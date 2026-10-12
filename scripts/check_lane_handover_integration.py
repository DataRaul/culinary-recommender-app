"""Offline project-mapping concurrency drill; no external or canonical-state writes."""
import argparse
import copy
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--agent-os-root', required=True, type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    adapter = json.loads((root / 'config/package_quality_adapter.json').read_text())
    shared = args.agent_os_root.resolve()
    for name, expected in adapter['shared_source']['files'].items():
        assert hashlib.sha256((shared/name).read_bytes()).hexdigest() == expected, name
    sys.path.insert(0, str(shared/'scripts'))
    from lane_handover import GateError, prepare, verify
    from package_quality import check_concurrency_log

    index_path = 'docs/handovers/INDEX.json'
    index = json.loads((root/index_path).read_text())
    migration = json.loads((root/'docs/package_quality/evidence/concurrent-lanes/migration.json').read_text())
    with tempfile.TemporaryDirectory() as tmp:
        fixture = Path(tmp)
        paths = [index_path, 'config/package_quality_adapter.json', 'scripts/package_quality.py'] + [v['goal_ref']['path'] for v in index['lanes'].values()]
        for name in paths:
            p = fixture/name; p.parent.mkdir(parents=True, exist_ok=True); p.write_bytes((root/name).read_bytes())
        for row in migration['bootstrap_writes']:
            body = (root/row['source']).read_bytes()
            assert hashlib.sha256(body).hexdigest() == row['sha256']
            p = fixture/row['target']; p.parent.mkdir(parents=True, exist_ok=True); p.write_bytes(body)

        def git(*args, input=None, env=None, check=True):
            r = subprocess.run(['git','-C',str(fixture),*args], input=input, env=env, text=True, capture_output=True)
            if check:
                assert r.returncode == 0, r.stderr
                return r.stdout.strip()
            return r

        git('init','-b','state'); git('config','user.name','Offline test'); git('config','user.email','offline@example.invalid')
        git('add','.'); git('commit','-m','reviewed fixtures')
        head = git('rev-parse','HEAD')
        original = {lane:(fixture/row['current']).read_bytes() for lane,row in index['lanes'].items()}

        def plan(lane, expected):
            row = index['lanes'][lane]; body = (fixture/row['current']).read_bytes(); doc = json.loads(body)
            digest = hashlib.sha256(body).hexdigest()
            doc['package_quality']['predecessor_sha256'] = digest
            doc['concurrency_log'].append({'event_id':lane+':offline-drill:'+expected,'event':'OFFLINE_ROTATION','expected_head':expected,'predecessor_sha256':digest})
            check_concurrency_log(json.loads(body), doc)
            return prepare(fixture,index_path,lane,doc,expected,expected,digest)

        def commit(plan, parent):
            with tempfile.TemporaryDirectory() as temp:
                env = {**os.environ,'GIT_INDEX_FILE':str(Path(temp)/'index')}
                git('read-tree',parent,env=env)
                for row in plan['writes']:
                    blob = git('hash-object','-w','--stdin',input=row['content'])
                    git('update-index','--add','--cacheinfo',row['mode']+','+blob+','+row['path'],env=env)
                tree = git('write-tree',env=env)
                new = git('commit-tree',tree,'-p',parent,input='Offline lane drill [skip ci]\n')
                result = git('update-ref','refs/heads/state',new,plan['expected_head'],check=False)
                return new,result

        lanes = list(index['lanes'])
        assert len(lanes) == 3
        plans = {lane:plan(lane,head) for lane in lanes}
        input_path = 'docs/package_quality/evidence/drill/next.json'
        output_path = 'docs/package_quality/evidence/drill/lane-plan.json'
        target = fixture/input_path; target.parent.mkdir(parents=True,exist_ok=True)
        target.write_text(plans[lanes[0]]['writes'][0]['content'])
        prefix = [sys.executable,str(fixture/'scripts/package_quality.py'),'--agent-os-root',str(shared)]
        commands = [prefix+['lane-prepare','--registry',index_path,'--lane',lanes[0],'--next',input_path,'--snapshot-head',head,'--expected-head',head,'--expected-current',hashlib.sha256(original[lanes[0]]).hexdigest(),'--output',output_path],prefix+['lane-verify','--plan',output_path,'--live-head',head]]
        for command in commands:
            run = subprocess.run(command,capture_output=True,text=True,cwd=fixture)
            assert run.returncode == 0, run.stdout+run.stderr
        latest,result = commit(plans[lanes[0]],head); assert result.returncode == 0
        _,stale = commit(plans[lanes[1]],head); assert stale.returncode != 0
        assert git('rev-parse','HEAD') == latest
        for lane in lanes[1:]:
            try:
                verify(fixture,plans[lane],latest)
            except GateError:
                pass
            else:
                raise AssertionError('stale head was accepted')
            git('reset','--hard',latest)
            p = plan(lane,latest); verify(fixture,p,latest)
            latest,result = commit(p,latest); assert result.returncode == 0
        git('reset','--hard',latest)
        for lane,row in index['lanes'].items():
            assert (fixture/row['previous']).read_bytes() == original[lane]
            current = json.loads((fixture/row['current']).read_bytes())
            assert len(current['concurrency_log']) == json.loads(original[lane]).get('concurrency_log',[]).__len__()+1
        assert (fixture/index_path).read_bytes() == (root/index_path).read_bytes()
        lane = lanes[0]; p=plan(lane,latest)
        old_doc = json.loads((fixture/index['lanes'][lane]['current']).read_text())
        for log in [[], old_doc['concurrency_log'], [{'event_id':'changed-history'}]]:
            bad_doc = copy.deepcopy(old_doc); bad_doc['concurrency_log'] = log
            try:
                check_concurrency_log(old_doc,bad_doc)
            except ValueError:
                pass
            else:
                raise AssertionError('log erasure/no-event was accepted')
        wrong=copy.deepcopy(p); wrong['writes'][1]['path']=index['lanes'][lanes[1]]['current']
        for bad in [wrong]:
            try:
                verify(fixture,bad,latest)
            except GateError:
                pass
            else:
                raise AssertionError('cross-lane write was accepted')
        (fixture/index['lanes'][lane]['current']).write_text(p['writes'][0]['content'])
        try:
            verify(fixture,p,latest)
        except GateError:
            pass
        else:
            raise AssertionError('same-lane stale checkpoint was accepted')
    print(json.dumps({'status':'PASS','project':index['project'],'lanes':lanes,'three_same_head_snapshots':True,'real_git_stale_lease_rejected':True,'all_latest_lane_histories_preserved':True,'previous_exact_bytes_preserved':True,'same_lane_stale_rejected':True,'cross_lane_write_rejected':True,'concurrency_log_erasure_rejected':True,'wrapper_cli_pair_validated':True,'external_writes':0}))


if __name__=='__main__':
    main()

#!/usr/bin/env python3
"""Trusted-base PR quality gate. Candidate checkout is DATA ONLY (never execute its scripts)."""
import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

CUTOFF = dt.datetime.fromisoformat("2026-10-16T00:00:00+00:00")
SIDECARS = ("packet.json", "supporter.json", "critic.json", "synthesis.json")


class QualityHold(Exception):
    pass


def require(ok, reason):
    if not ok:
        raise QualityHold(reason)


def read_json(path):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise QualityHold(f"invalid or missing JSON: {path}") from exc


def git(root, *args):
    try:
        return subprocess.check_output(["git", "-C", str(root), *args], stderr=subprocess.PIPE)
    except (OSError, subprocess.CalledProcessError) as exc:
        raise QualityHold("Git candidate/base inventory unavailable") from exc


def assess(event, candidate, trusted, shared):
    pr = event.get("pull_request")
    require(isinstance(pr, dict), "pull_request event required")
    stamp = pr.get("created_at")
    require(isinstance(stamp, str), "PR creation timestamp missing")
    try:
        created = dt.datetime.fromisoformat(stamp.replace("Z", "+00:00"))
        require(created.tzinfo is not None, "PR creation timezone missing")
    except ValueError as exc:
        raise QualityHold("invalid PR creation timestamp") from exc

    if created < CUTOFF:
        return {"status": "LEGACY_PR_GRANDFATHERED", "reason": "PR predates quality enforcement cutover"}

    base = pr.get("base", {}).get("sha")
    head = pr.get("head", {}).get("sha")
    require(isinstance(base, str) and len(base) == 40, "base SHA missing")
    require(isinstance(head, str) and len(head) == 40, "head SHA missing")
    require(git(candidate, "rev-parse", "HEAD").decode().strip() == head, "checked-out candidate differs from PR head")
    require(git(trusted, "rev-parse", "HEAD").decode().strip() == base, "trusted checkout differs from PR base")

    changed = [x for x in git(candidate, "diff", "--name-only", "-z", base, head, "--").decode().split("\0") if x]
    require(bool(changed) and len(changed) == len(set(changed)), "empty/duplicate PR diff")
    packets = [p for p in changed if p.startswith("docs/package_quality/evidence/") and p.endswith("/packet.json")]
    require(len(packets) == 1, "new PR must include exactly one reviewed package packet")
    packet_path = packets[0]
    evidence_dir = Path(packet_path).parent
    sidecars = [str(evidence_dir / name) for name in SIDECARS]
    require(all(p in changed for p in sidecars), "PR must publish packet, Supporter, Critic and synthesis")
    packet = read_json(candidate / packet_path)
    subject = packet.get("subject", {})
    contract_rel = subject.get("contract_path")
    require(isinstance(contract_rel, str) and contract_rel.startswith("docs/package_quality/contracts/"),
            "packet must name a package contract")
    require(contract_rel in changed, "contract for this one-package PR must be newly reviewed")
    contract = read_json(candidate / contract_rel)
    require(contract.get("base_commit") == base, "base has moved: reconcile, refreeze and rereview")
    require(contract.get("review_mode") == "SAME_CHAT_SEQUENTIAL", "same-chat review contract required")
    require(contract.get("lane_id") in {"culinary-app", "culinary-brain", "barbecue"},
            "unregistered lane selection")
    require(set(changed) == set(subject.get("candidate_paths", [])) | set(sidecars),
            "PR contains missing, unreviewed or extraneous paths")

    trusted_adapter = read_json(trusted / "config/package_quality_adapter.json")
    proposed_adapter = read_json(candidate / "config/package_quality_adapter.json")
    require(trusted_adapter.get("shared_source") == proposed_adapter.get("shared_source"),
            "shared verification pin changed; separate authorized migration required")
    source = trusted_adapter["shared_source"]
    require(git(shared, "rev-parse", "HEAD").decode().strip() == source["commit"],
            "wrong Agent OS commit")
    for name, expected in source["files"].items():
        actual = hashlib.sha256((shared / name).read_bytes()).hexdigest()
        require(actual == expected, "pinned checker source mismatch: " + name)

    # Only trusted-base gate code and exact verified Agent OS checker execute.
    with tempfile.TemporaryDirectory(prefix="culinary-qa-") as temp:
        inventory = Path(temp) / "outgoing.json"
        inventory.write_text(json.dumps(changed))
        cmd = [sys.executable, str(shared / "scripts/package_quality_gate.py"),
               "validate", "--root", str(candidate), "--packet", packet_path,
               "--supporter", sidecars[1], "--critic", sidecars[2],
               "--synthesis", sidecars[3], "--current-base", base,
               "--publication-list", str(inventory), "--git-base", base]
        result = subprocess.run(cmd, text=True, capture_output=True, check=False)
        require(result.returncode == 0, "pinned validation HOLD: " + (result.stdout + result.stderr)[-1300:])
        outcome = json.loads(result.stdout)
        require(outcome["status"] == "SEQUENTIALLY_REVIEWED_READY_FOR_REQUIRED_CI",
                "review is not ready for required CI")

    return {"status": "QUALITY_EVIDENCE_PASS", "package": contract["package_id"],
            "packet": packet_path, "assurance": "PROCEDURAL_SAME_CHAT_PASSES",
            "next_gate": "REQUIRED_CI_AND_ELIGIBLE_MERGE"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--event", required=True)
    ap.add_argument("--candidate", type=Path, required=True)
    ap.add_argument("--trusted", type=Path, required=True)
    ap.add_argument("--shared", type=Path, required=True)
    args = ap.parse_args()
    try:
        result = assess(read_json(args.event), args.candidate.resolve(),
                        args.trusted.resolve(), args.shared.resolve())
        print(json.dumps(result))
        if os.environ.get("GITHUB_STEP_SUMMARY"):
            with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf8") as out:
                out.write(f"### Culinary quality evidence: {result['status']}\n")
                out.write("This result is not independent review, required final CI completion, merge or deployment acceptance.\n")
    except (QualityHold, OSError, KeyError, TypeError, ValueError) as exc:
        print(json.dumps({"status": "QUALITY_EVIDENCE_HOLD", "reason": str(exc)}), file=sys.stderr)
        if os.environ.get("GITHUB_STEP_SUMMARY"):
            with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf8") as out:
                out.write("### Culinary quality evidence: HOLD\n")
                out.write("Missing or invalid reviewer evidence; merge not authorized by this gate.\n")
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()

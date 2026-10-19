"""Thin adapter to an exact, hash-pinned shared Agent OS checkout/snapshot."""
import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path


def check_concurrency_log(old, new):
    before = old.get("concurrency_log")
    after = new.get("concurrency_log")
    if not isinstance(before, list) or not before or not isinstance(after, list):
        raise ValueError("complete lane concurrency log required")
    if len(after) <= len(before) or after[:len(before)] != before:
        raise ValueError("concurrency history erased/changed or new event missing")
    ids = [row.get("event_id") for row in after if isinstance(row, dict)]
    if len(ids) != len(after) or any(not isinstance(v, str) or not v for v in ids) or len(ids) != len(set(ids)):
        raise ValueError("unique concurrency event identities required")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--agent-os-root", type=Path, required=True)
    parser.add_argument("--quality-adapter", choices=("legacy", "plan-first", "portfolio"), default="legacy")
    parser.add_argument("--portfolio-decision", help="Frozen portfolio decision for new-package priority check")
    args, remainder = parser.parse_known_args()
    root = Path(__file__).resolve().parents[1]
    adapter_file = ("config/package_quality_plan_first_adapter.json"
                    if args.quality_adapter in ("plan-first", "portfolio")
                    else "config/package_quality_adapter.json")
    adapter = json.loads((root / adapter_file).read_text())
    source = args.agent_os_root.resolve()
    try:
        if args.quality_adapter == "portfolio":
            if not args.portfolio_decision or Path(args.portfolio_decision).is_absolute() or ".." in Path(args.portfolio_decision).parts:
                raise ValueError("portfolio decision must be a safe relative path")
            decision = (root / args.portfolio_decision).resolve()
            if not decision.is_relative_to(root) or not decision.is_file():
                raise ValueError("portfolio decision missing/unsafe")
            gate = subprocess.run(
                [sys.executable, str(root / "scripts/portfolio_priority.py"),
                 "--agent-os-root", str(source), "--decision", args.portfolio_decision],
                check=False)
            if gate.returncode != 0:
                raise ValueError("PORTFOLIO_PRIORITY_GATE_HOLD")
            if remainder and remainder[0] == "freeze":
                contract_parser = argparse.ArgumentParser(add_help=False)
                contract_parser.add_argument("--contract", required=True)
                parsed, _ = contract_parser.parse_known_args(remainder[1:])
                contract_path = (root / parsed.contract).resolve()
                if not contract_path.is_relative_to(root):
                    raise ValueError("unsafe contract path")
                contract = json.loads(contract_path.read_text())
                required = contract.get("required_evidence", [])
                policy_path = json.loads((root / "config/package_quality_portfolio_adapter.json").read_text())["portfolio_priority"]["policy_path"]
                if (args.portfolio_decision not in required or policy_path not in required
                    or "config/package_quality_portfolio_adapter.json" not in required):
                    raise ValueError("portfolio decision and policy must be frozen in required evidence")
        shared = adapter["shared_source"]
        if not re.fullmatch(r"[0-9a-f]{40}", shared["commit"]):
            raise ValueError("verified shared source commit missing")
        files = shared["files"]
        if "scripts/package_quality_gate.py" not in files or not files:
            raise ValueError("shared source hashes missing")
        for name, expected in files.items():
            path = (source / name).resolve()
            if not path.is_relative_to(source) or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
                raise ValueError("shared source hash mismatch: " + name)
        lane_command = bool(remainder and remainder[0] in {"lane-prepare", "lane-verify"})
        plan_command = bool(remainder and remainder[0] == "plan-accept")
        if lane_command:
            remainder[0] = remainder[0].removeprefix("lane-")
            script = source / "scripts/lane_handover.py"
        elif plan_command:
            remainder.pop(0)
            script = source / "scripts/plan_first_gate.py"
        else:
            script = source / "scripts/package_quality_gate.py"
        if "--root" in remainder:
            raise ValueError("project root is fixed by this adapter")
        result = subprocess.run([sys.executable, str(script), *remainder, "--root", str(root)], check=False, capture_output=lane_command, text=lane_command)
        if lane_command and result.returncode == 0:
            plan_args = argparse.ArgumentParser(add_help=False)
            plan_args.add_argument("--output" if remainder[0] == "prepare" else "--plan", required=True)
            parsed, _ = plan_args.parse_known_args(remainder[1:])
            plan = json.loads((root / (parsed.output if remainder[0] == "prepare" else parsed.plan)).read_text())
            current = "docs/handovers/" + plan["lane_id"] + "/CURRENT.json"
            row = next(r for r in plan["writes"] if r["path"] == current)
            check_concurrency_log(json.loads((root/current).read_text()), json.loads(row["content"]))
        if lane_command:
            print(result.stdout, end="")
            print(result.stderr, end="", file=sys.stderr)
        raise SystemExit(result.returncode)
    except (OSError, ValueError, KeyError) as exc:
        print(json.dumps({"status": "HOLD", "reason": str(exc)}))
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()

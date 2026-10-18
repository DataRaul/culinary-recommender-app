"""Thin local launcher for exact-pinned Agent OS portfolio gate; no core copy."""
import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--agent-os-root", type=Path, required=True)
    p.add_argument("--decision", required=True)
    a = p.parse_args()
    root = Path(__file__).resolve().parents[1]
    cfg = json.loads((root / "config/package_quality_portfolio_adapter.json").read_text())
    src = cfg["shared_portfolio_gate"]
    script = a.agent_os_root.resolve() / src["path"]
    if not script.is_file() or hashlib.sha256(script.read_bytes()).hexdigest() != src["sha256"]:
        raise SystemExit("HOLD_SHARED_PORTFOLIO_GATE_PIN_MISMATCH")
    if (a.agent_os_root / ".git").exists():
        commit = subprocess.check_output(["git", "-C", str(a.agent_os_root), "rev-parse", "HEAD"], text=True).strip()
        if commit != src["commit"]:
            raise SystemExit("HOLD_SHARED_AGENT_OS_COMMIT_MISMATCH")
    cmd = [sys.executable, str(script), "--root", str(root),
           "--policy", cfg["portfolio_priority"]["policy_path"], "--decision", a.decision]
    raise SystemExit(subprocess.call(cmd))


if __name__ == "__main__":
    main()

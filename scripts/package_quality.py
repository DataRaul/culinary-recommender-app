"""Thin adapter to an exact, hash-pinned shared Agent OS checkout/snapshot."""
import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--agent-os-root", type=Path, required=True)
    args, remainder = parser.parse_known_args()
    root = Path(__file__).resolve().parents[1]
    adapter = json.loads((root / "config/package_quality_adapter.json").read_text())
    source = args.agent_os_root.resolve()
    try:
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
        script = source / "scripts/package_quality_gate.py"
        if "--root" in remainder:
            raise ValueError("project root is fixed by this adapter")
        result = subprocess.run([sys.executable, str(script), *remainder, "--root", str(root)], check=False)
        raise SystemExit(result.returncode)
    except (OSError, ValueError, KeyError) as exc:
        print(json.dumps({"status": "HOLD", "reason": str(exc)}))
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()

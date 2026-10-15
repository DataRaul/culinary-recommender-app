"""Post-cutover trusted PR gate wiring tests with an explicitly STUBBED shared verifier.

The real pinned Agent OS checker is exercised separately in the package validation;
this fixture verifies fail-closed event, inventory, pin, and result handling.
"""
import hashlib
import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("quality_pr_gate", ROOT / "scripts/quality_pr_gate.py")
gate = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(gate)

BASE = "b" * 40
HEAD = "c" * 40
SHARED = "a" * 40
FOLDER = "docs/package_quality/evidence/probe"
PACKET = FOLDER + "/packet.json"
CONTRACT = "docs/package_quality/contracts/probe.json"
SIDECARS = [FOLDER + "/" + name for name in ("supporter.json", "critic.json", "synthesis.json")]
CHANGED = [CONTRACT, PACKET, *SIDECARS]


class GateIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        self.trusted, self.candidate, self.shared = (root / x for x in ("trusted", "candidate", "shared"))
        for d in (self.trusted, self.candidate, self.shared):
            d.mkdir()
        stub = self.shared / "scripts/package_quality_gate.py"
        stub.parent.mkdir(parents=True)
        stub.write_text("# Stubbed shared checker; actual pin validated in release checks\n")
        pin = hashlib.sha256(stub.read_bytes()).hexdigest()
        self.adapter = {"shared_source": {
            "commit": SHARED,
            "files": {"scripts/package_quality_gate.py": pin}
        }}
        for root in (self.trusted, self.candidate):
            p = root / "config/package_quality_adapter.json"
            p.parent.mkdir(parents=True)
            p.write_text(json.dumps(self.adapter))
        packet = self.candidate / PACKET
        packet.parent.mkdir(parents=True)
        packet.write_text(json.dumps({"subject": {"contract_path": CONTRACT,
                "candidate_paths": [CONTRACT, PACKET]}}))
        contract = self.candidate / CONTRACT
        contract.parent.mkdir(parents=True)
        contract.write_text(json.dumps({"base_commit": BASE,
                "review_mode": "SAME_CHAT_SEQUENTIAL", "lane_id": "culinary-app",
                "package_id": "probe"}))
        self.event = {"pull_request": {"created_at": "2026-10-17T12:00:00Z",
                      "base": {"sha": BASE}, "head": {"sha": HEAD}}}
        self.changed = list(CHANGED)
        self.checker_status = "SEQUENTIALLY_REVIEWED_READY_FOR_REQUIRED_CI"
        self.checker_code = 0

    def git(self, root, *args):
        if args[0] == "rev-parse":
            return (HEAD if root == self.candidate else
                    BASE if root == self.trusted else SHARED).encode() + b"\n"
        if args[:2] == ("diff", "--name-only"):
            return ("\0".join(self.changed) + "\0").encode()
        raise AssertionError("unexpected git args " + repr(args))

    def run_checker(self, *args, **kwargs):
        return subprocess.CompletedProcess(args, self.checker_code,
            json.dumps({"status": self.checker_status}), "checker reported failure")

    def assess(self):
        with patch.object(gate, "git", side_effect=self.git), \
             patch.object(gate.subprocess, "run", side_effect=self.run_checker):
            return gate.assess(self.event, self.candidate, self.trusted, self.shared)

    def test_valid_post_cutover_inventory_reaches_stubbed_pinned_checker(self):
        self.assertEqual(self.assess()["status"], "QUALITY_EVIDENCE_PASS")

    def test_missing_frozen_sidecar_fails_closed(self):
        self.changed.remove(SIDECARS[-1])
        with self.assertRaisesRegex(gate.QualityHold, "Supporter, Critic and synthesis"):
            self.assess()

    def test_extra_file_fails_closed(self):
        self.changed.append("src/unreviewed.js")
        with self.assertRaisesRegex(gate.QualityHold, "extraneous"):
            self.assess()

    def test_moved_base_fails_closed(self):
        p = self.candidate / CONTRACT
        p.write_text(json.dumps({"base_commit": "d" * 40,
                      "review_mode": "SAME_CHAT_SEQUENTIAL", "lane_id": "culinary-app"}))
        with self.assertRaisesRegex(gate.QualityHold, "base has moved"):
            self.assess()

    def test_bad_shared_source_pin_fails_closed(self):
        self.adapter["shared_source"]["files"]["scripts/package_quality_gate.py"] = "f" * 64
        for root in (self.trusted, self.candidate):
            (root / "config/package_quality_adapter.json").write_text(json.dumps(self.adapter))
        with self.assertRaisesRegex(gate.QualityHold, "pinned checker source mismatch"):
            self.assess()

    def test_checker_hold_fails_closed(self):
        self.checker_code = 1
        with self.assertRaisesRegex(gate.QualityHold, "pinned validation HOLD"):
            self.assess()

    def test_checker_nonready_response_fails_closed(self):
        self.checker_status = "REVIEW_HOLD"
        with self.assertRaisesRegex(gate.QualityHold, "review is not ready"):
            self.assess()

    def test_historical_pr_remains_grandfathered(self):
        self.event["pull_request"]["created_at"] = "2026-10-15T12:00:00Z"
        self.assertEqual(self.assess()["status"], "LEGACY_PR_GRANDFATHERED")


if __name__ == "__main__":
    unittest.main()

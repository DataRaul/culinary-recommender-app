# Concurrent lane handovers — V1

Use live main's `docs/handovers/INDEX.json` to select exactly one canonical lane. The index is navigation, not operational or research authority. Read `AGENTS.md`, the current roadmap, package protocol and lane contract first. Fetch the lane CURRENT/PREVIOUS explicitly from the registered state branch, never a root rolling CURRENT.

Each lane owns its full CURRENT/PREVIOUS pair and an append-only `concurrency_log` inside CURRENT. Git history preserves earlier logs; PREVIOUS preserves the exact preceding CURRENT bytes. There is no mutable shared event-log file for ordinary lane writers. The main index is the cross-lane navigation surface. A checkpoint records the versioned lane goal, input/main/state identities, active PRs, unfinished work, failures, inherited budgets, actual next action and publication evidence. Stale snapshots never override live state.

Independent work may run in parallel. Shared-file merges and canonical database writers are serialized by the coordinator under existing authority. A Git checkpoint lease does not lock Drive or a database. Market Lab notebook writers must use the existing shared-DB ordering and frozen-snapshot contracts; read-only five-ETF work retains its independent eligibility gates.

## Normal state publication

1. Fetch the registered state branch head and tree, authoritative index/adapter/goals and this lane CURRENT. Verify goal hashes. Use the live index if the state copy differs; synchronize governance only through a reviewed integration, never through an ordinary two-file rotation.
2. Prepare the next full object. Retain history, authority and remaining budgets. Append an event to `concurrency_log` with event ID, timestamp, lane, predecessor SHA-256, observed main/state head, package and result/next action. Do not fabricate a chat URL or a publication commit that does not exist yet; its immutable locator is the resulting Git commit history.
3. Run the hash-pinned wrapper's `lane-prepare` and `lane-verify` with the freshly observed head and expected CURRENT hash. The plan contains exactly this lane's two writes.
4. Build the outgoing tree from that exact latest state-branch tree, preserve every other entry, create one commit with `[skip ci]`, and update the branch with `expected_sha`, `force=false`. Re-fetch both lane files and compare exact bytes before reporting completion.
5. A moved head rejects publication. Reread branch and lane. If another lane advanced, rebuild this unchanged lane pair on the latest tree. If the same lane advanced, reconcile completed work and budgets instead of replaying stale state. One bounded reconciliation is allowed; unresolved conflict becomes HOLD and a useful handover, never an unbounded retry.
6. Preserve all other lane CURRENT/PREVIOUS hashes after publication. Emit the complete verified lane JSON at a terminal/context boundary. Existing one-package and stop rules still apply.

Run from the project root. Example (commands operate offline and never publish; inputs/plans use repository-relative evidence paths):

```bash
python scripts/package_quality.py --agent-os-root /exact/pinned/agent-os lane-prepare --registry docs/handovers/INDEX.json --lane <canonical-id> --next docs/package_quality/evidence/<package>/next.json --snapshot-head <fresh-head> --expected-head <fresh-head> --expected-current <current-sha256> --output docs/package_quality/evidence/<package>/lane-plan.json
python scripts/package_quality.py --agent-os-root /exact/pinned/agent-os lane-verify --plan docs/package_quality/evidence/<package>/lane-plan.json --live-head <fresh-head>
```

## Reviewed bootstrap and legacy archive

`docs/package_quality/evidence/concurrent-lanes/migration.json` binds the explicit bootstrap paths/bytes and original state-branch predecessor. Installation publishes the registered index, adapter, goal files and these reviewed new pairs on the latest state tree using an expected-head lease. This initial multi-lane operation is a migration exception, not permission for an ordinary lane writer to change shared governance or another pair.

Preserve pre-existing root/pilot pairs byte-for-byte as read-only historical archives. They are never a fallback writable CURRENT. Do not infer that a newly bootstrapped PREVIOUS is a prior operational run: its bootstrap marker identifies it. Culinary app PREVIOUS instead retains the exact legacy root CURRENT bytes and CURRENT retains its historical fields/constraints. Brain and Barbecue checkpoints explicitly require fresh authority reconciliation.

The isolated three-writer drill proves real local Git lease rejection and preservation for these project mappings. It does not prove server lock availability, automatically update running chats, launch successor chats, guarantee context-percentage callbacks, measure reliability gains or advance data/product gates. No new paid service, background monitor or scheduled Actions is installed.

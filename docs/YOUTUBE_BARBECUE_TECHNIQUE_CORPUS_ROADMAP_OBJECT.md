# Barbecue Technique Corpus — Roadmap Object V1

Status: **PLANNED / OWNER-PRIORITY POST-USABLE-APP / NOT ACTIVE**

Date: 2026-09-22

## Purpose

Build a dedicated barbecue technique corpus from bounded YouTube research without copying recipe prose, transcripts, images, audio or video. The product output is a compact, structured set of technique families, ranges, alternatives and safety constraints that users can adjust to taste.

This is a **technique-family creation lane**, not a conventional recipe-ingestion lane.

## Activation gate

Do not activate this programme while legal-corpus scale remains the blocking product lane.

Activation is earned only when all of the following are true:

1. `LEGAL_CORPUS_BASELINE_PASS` has been earned.
2. The app has reached a usable recommendation baseline over the admitted corpus: normalized/categorized corpus, applicable nutrition audit complete enough for the usable baseline, and recommendation readiness accepted.
3. No higher-priority production/security/rights gate requires the YouTube child programme to remain paused.
4. A fresh repository reconciliation confirms that the scheduled YouTube lane can be repurposed without overwriting another active child programme.

When all four conditions are true, record:

`BARBECUE_TECHNIQUE_CORPUS_ACTIVATION_READY`

That state authorizes a bounded implementation PR that switches the daily YouTube discovery focus to this barbecue programme. It does not itself authorize publication.

## Scope — conventional barbecue only

In scope:

- conventional above-ground barbecue/grill equipment;
- charcoal, gas, kettle, pellet and conventional above-ground smoker/barbecue apparatus;
- direct and indirect grilling;
- covered/uncovered barbecue where the food is cooked on or in ordinary barbecue/grill hardware;
- common culturally distinct barbecue/grill traditions such as American barbecue, Korean barbecue and Spanish parrilla/asado-style grilling, provided the technique remains within the equipment boundary above.

Explicitly out of scope for V1:

- underground/earth-oven cooking;
- buried cooking;
- cooking directly in ashes or buried embers;
- fire-pit/campfire cooking without conventional grill/barbecue apparatus;
- open-hearth cooking outside the barbecue/grill boundary;
- novelty/extreme outdoor-fire techniques merely because they use flame, smoke or coals.

The scope may later be expanded only by a separate roadmap decision.

## Core model

Each barbecue family/leaf is represented as:

`product + cut/form + tradition/style + method + equipment/heat source + intensity + time/endpoint + flavor-treatment ranges + safety constraints`

Initial product families:

- poultry;
- beef;
- pork;
- lamb where relevant;
- fish/seafood;
- vegetables.

Typical style/tradition facets include American, Korean, Spanish and other later-admitted barbecue traditions. Tradition is descriptive structure, not an authenticity claim derived from popularity alone.

Typical method facets include direct heat, indirect heat, covered grilling, smoking/barbecue, skewered grilling where performed on conventional barbecue hardware, and staged combinations of those methods.

## Adjustment axes

The user-facing corpus should expose compact ranges or alternatives such as:

- heat source/fuel;
- direct vs indirect heat;
- heat intensity;
- time and doneness/endpoint range;
- brine/salt level and duration;
- marinade duration;
- sweetness;
- acidity;
- spice/heat;
- smoke intensity;
- glaze/sauce timing;
- resting/finishing treatment.

Do not average incompatible techniques into false precision. Preserve genuine alternatives as separate method branches.

## Five-source one-shot synthesis rule

For each defined barbecue leaf:

1. identify **five independent admission-qualified sources**;
2. store only references/IDs, source qualification/provenance and project-authored normalized observations;
3. extract only the small technique variables needed for comparison;
4. synthesize project-authored ranges, alternatives, decision notes and outliers;
5. attach food-safety constraints from appropriate safety authorities rather than treating practitioner videos as safety authority;
6. mark the leaf complete and remove it from routine daily acquisition.

Do not weaken the source gate merely to reach five. If five qualified independent sources cannot be established, record `INSUFFICIENT_QUALIFIED_SOURCE_SET` and leave the leaf incomplete.

A completed leaf is not searched again by the routine daily run. Refresh requires a separately recorded reason such as material technique gap, source invalidation, major product change or explicit owner request.


## Discovery query strategy — world-champion first

For each incomplete barbecue leaf, the first discovery pass must deliberately search for championship-level practitioners rather than generic recipe popularity.

The primary query template is:

`world champion + barbecue/grill + product/cut`

Examples:

- `world champion barbecue chicken`;
- `world champion BBQ ribs`;
- `world champion brisket barbecue`;
- `world champion grilled fish`;
- `world champion barbecue vegetables`.

Equivalent ordering and competition-language variants should also be tried where useful, including:

- `<product/cut> barbecue world champion`;
- `barbecue world champion <product/cut>`;
- `competition BBQ champion <product/cut>`;
- `grand champion BBQ <product/cut>`;
- the relevant language/local competition term for a named tradition when the English query would systematically miss qualified practitioners.

The purpose of this query strategy is **candidate discovery**. A title, description or search result using “world champion” does not automatically qualify the source. The programme must verify the claimed credential or otherwise establish domain competence before that source can count toward the five-source synthesis set.

For every leaf, championship-oriented queries are searched **before** generic expert/educator queries. If fewer than five independent admission-qualified championship-level sources exist or are discoverable for that leaf, fill the remaining positions using other strongly qualified specialist practitioners or culinary educators under the existing source-admission gate. Never lower the admission threshold merely to complete the set of five.

The daily engine should record which query class produced each admitted source so later review can distinguish:

`WORLD_CHAMPION_DISCOVERY` / `COMPETITION_CHAMPION_DISCOVERY` / `SPECIALIST_FALLBACK_DISCOVERY`.

## Source-admission principles

Popularity alone is insufficient. The source set should favor demonstrated competence relevant to the exact technique: recognized competition credentials where meaningful, established specialist practitioners/pitmasters, respected culinary educators, or similarly strong domain evidence.

The five sources should be meaningfully independent. Five videos from the same person/channel, the same recipe lineage or obvious copies do not constitute five-source synthesis.

For every admitted source retain:

- video/source ID and canonical URL/reference;
- creator/channel identity;
- source-admission rationale;
- access/review date;
- exact leaf/claim scope supported;
- project-authored normalized observations only.

## Storage and copyright boundary

The programme does **not** need or retain:

- downloaded video/audio;
- screenshots/images;
- transcripts;
- copied recipe prose;
- copied creator instructions;
- bulk raw API payload history.

Durable state should consist of references/IDs, provenance, admission metadata, normalized observations, derived ranges/alternatives, validation state and compact daily work-unit state.

The corpus must remain project-authored synthesis, not a reconstruction of any one source.

## Daily-run transition

Before activation, the existing YT-CUL child programme keeps its current authority and schedule.

After `BARBECUE_TECHNIQUE_CORPUS_ACTIVATION_READY`:

- repurpose the bounded daily Search budget to barbecue coverage only;
- prioritize incomplete barbecue leaves and coverage gaps rather than generic recipe discovery;
- target five qualified independent references per leaf;
- stop spending quota on a leaf once its five-source synthesis packet passes;
- move automatically to the next incomplete leaf on a later quota day;
- preserve all existing provider-quota, policy, storage, backpressure and fail-closed controls;
- do not auto-publish or auto-admit technique content into recommendation behavior.

The intended outcome is a finite, auditable barbecue technique corpus assembled progressively by the daily run rather than an indefinitely growing video collection.

## First implementation milestone

`BARBECUE_TECHNIQUE_CORPUS_PILOT_PASS`

Pilot scope:

- one poultry leaf;
- one beef leaf;
- one pork leaf;
- one fish/seafood leaf;
- one vegetable leaf;
- at least two materially different barbecue traditions/styles across the five leaves;
- five qualified independent references per completed leaf;
- structured adjustment axes and alternatives;
- safety firewall validated;
- zero retained transcripts/images/video/audio/copied recipe prose.

A pilot PASS earns controlled family expansion. It does not authorize unbounded search or publication.

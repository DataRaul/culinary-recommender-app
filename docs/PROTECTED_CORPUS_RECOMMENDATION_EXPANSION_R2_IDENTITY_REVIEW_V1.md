# Protected Corpus Recommendation Expansion R2 — identity review V1

Status: **CANDIDATE-ONLY BOUNDED REVIEW**

R2 reviews only the frozen R1 10-recipe tranche. It does not mutate the global ingredient alias index or catalog.

Five exact existing-identity mappings are permitted inside this frozen tranche only:

- Aubergines → `aubergine`;
- Flat-leaf parsley → `parsley`;
- Long-grain rice → `rice`;
- Short-grain rice → `rice`;
- Coarse salt → `salt`.

Ten unresolved identities remain held: composite Salt and pepper; unspecified Flour; Fresh white cheese; Soft white cheese; Soured cream; Unleavened çörek flatbread; Precooked corn flour/masarepa; Mutton on the bone; Fleshy red peppers; and Raisins.

The measurement determines which frozen recipes become ingredient-identity-ready. Any positive catalog allergen signal is diagnostic only at this stage. Hard dietary/allergen candidate authority is a separate R2 policy gate.

No runtime admission, D1 mutation, protected-body rewrite, global alias/catalog mutation, new source ingestion, paid infrastructure, Knowledge Core write, third shard or Barbecue mutation is authorized.

# Culinary Brain C4 — UniTools high-leverage ingredient alias review V1

This bounded review takes the measured top-25 unresolved UniTools ingredient-name queue and makes explicit identity decisions without mutating the app-wide ingredient alias index.

Six names are accepted only inside the exact pinned UniTools 1.1.0 protected overlay: **Warm water → water**, **Limes → lime**, **Lemons → lemon**, **Spring onions → spring_onion**, **Minced beef → beef_mince**, and **Dried oregano → oregano**.

The other 19 reviewed names remain held because they are composite, ambiguous, form-specific, conflict with an existing source-ID diagnostic, or have no matching canonical ingredient identity. In particular, **Soft white cheese** and **Tapioca starch**, the two single-alias candidates identified by the design gate, remain held rather than being guessed.

The first workflow run measures the exact post-review ingredient-identity gain and freezes the newly fully mapped recipe cohort before any dietary/allergen authority or recommendation admission can proceed.

No D1, protected-body, public-runtime, recommendation, global alias-index, Knowledge Core, paid API, third-shard or Barbecue mutation is authorized.

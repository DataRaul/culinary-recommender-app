# Human Acceptance Review — Gate 9 / 9A / 9B

## Gate 9 — ACCEPTED
The original public V0 review passed:
1. first-time onboarding;
2. Budget Beginner profile;
3. Mediterranean + vegetarian + high-protein profile;
4. advanced/exploratory profile;
5. generate only selected meal slots;
6. swap one recipe without rebuilding everything;
7. mark an ingredient unavailable;
8. inspect substitution wording;
9. inspect combined grocery list;
10. inspect approximate cost tier and uncertainty;
11. edit pantry/default staples;
12. test on a phone viewport/device;
13. intentionally create a constrained/impossible combination;
14. report confusing UI;
15. report recommendations that feel obviously wrong.

## Gate 9A — FRIDGE SEARCH IMPLEMENTED / HUMAN_PENDING
16. Search **salmon** with secondary ingredient **rice**; confirm recipes using both are ranked ahead of other salmon recipes.
17. Turn on **require all secondary ingredients** and confirm recipes missing rice disappear rather than being silently retained.
18. As an experienced profile, temporarily choose **Beginner-simple** + a fast time limit and confirm search respects today's simpler request without changing the saved profile.
19. As a beginner profile, give yourself more time and choose **Explore something new**; confirm skill remains a hard ceiling while discovery can still move upward within eligible recipes.
20. Try an impossible or safety-conflicting search and confirm the app explains why no result survives rather than relaxing dietary/allergen/exclusion/availability constraints.

## Gate 9B — COMPOSABLE PROFILE HUMAN_GATE
The V0.9.2 correction should be reviewed together with the still-pending Search checks:
21. Confirm the old one-choice preset dropdown is gone and the UI explicitly says **choose up to 3** priority packs.
22. Select **Meal Prep → Lunch**, **Culinary Explorer → Dinner**, plus one all-meals pack; confirm all three remain selected and the fourth selection is rejected clearly.
23. Build a plan containing lunch and dinner; confirm lunch and dinner recommendations can reflect different scoped packs while hard skill/time/diet constraints remain unchanged.
24. Confirm cuisine preferences are visibly multi-select and prominently include **Indian** and **Thai / Southeast Asian**; **Local / Canarian** should appear later rather than first.
25. In Search, choose **Lunch** or **Dinner** under “Cooking for” and confirm the matching scoped priority pack is used; choosing **Ingredients first · neutral preferences** should ignore all soft priority packs without weakening safety constraints.

V1.0 remains blocked until the combined Gate 9A/9B check is accepted.

Failure report format: **screen / profile or action / expected / observed / screenshot if useful**.

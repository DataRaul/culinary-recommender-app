# Human Acceptance Review — Gate 9 / 9A

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

## Gate 9A — FRIDGE SEARCH HUMAN_GATE
Run after V0.9.1 is deployed:
16. Search **salmon** with secondary ingredient **rice**; confirm recipes using both are ranked ahead of other salmon recipes.
17. Turn on **require all secondary ingredients** and confirm recipes missing rice disappear rather than being silently retained.
18. As an experienced profile, temporarily choose **Beginner-simple** + a fast time limit and confirm search respects today's simpler request without changing the saved profile.
19. As a beginner profile, give yourself more time and choose **Explore something new**; confirm skill remains a hard ceiling while discovery can still move upward within eligible recipes.
20. Try an impossible or safety-conflicting search and confirm the app explains why no result survives rather than relaxing dietary/allergen/exclusion/availability constraints.

Failure report format: **screen / profile or action / expected / observed / screenshot if useful**.

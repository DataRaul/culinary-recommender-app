-- Step 7D protected 84-record runtime canary.
-- This table lives only in the existing culinary-control D1 Free database.
-- It does not create any of the eight future recipe-body shard databases.
CREATE TABLE IF NOT EXISTS step7d_recipe_oracle (
  ordinal INTEGER PRIMARY KEY,
  recipe_id TEXT NOT NULL UNIQUE,
  body_json TEXT NOT NULL,
  body_bytes INTEGER NOT NULL
);

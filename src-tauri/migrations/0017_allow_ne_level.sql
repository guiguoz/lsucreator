-- no-transaction
-- Add 'NE' (Non Évalué) to allowed result levels
-- SQLite doesn't support ALTER CHECK, so recreate the table

CREATE TABLE results_new (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK(level IN ('A', 'AR', 'ECA', 'NA', 'NE')),
  created_at TEXT NOT NULL,
  UNIQUE(student_id, evaluation_id)
);

INSERT INTO results_new SELECT * FROM results;

DROP TABLE results;

ALTER TABLE results_new RENAME TO results;

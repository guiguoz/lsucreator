CREATE TABLE IF NOT EXISTS appreciations (
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  period     TEXT NOT NULL,
  domain     TEXT NOT NULL,
  text       TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (student_id, period, domain)
);

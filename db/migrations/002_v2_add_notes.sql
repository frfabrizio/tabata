-- v2: add notes column and index
ALTER TABLE entries ADD COLUMN notes TEXT;
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at);

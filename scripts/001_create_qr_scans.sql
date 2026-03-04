-- Create table to track QR code scans
CREATE TABLE IF NOT EXISTS qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id TEXT NOT NULL,
  target_url TEXT NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_qr_scans_qr_id ON qr_scans(qr_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_scanned_at ON qr_scans(scanned_at DESC);

-- Enable Row Level Security
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for tracking scans from public QR codes)
CREATE POLICY "Allow public inserts" ON qr_scans
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to select (for realtime subscription)
CREATE POLICY "Allow public select" ON qr_scans
  FOR SELECT
  USING (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE qr_scans;

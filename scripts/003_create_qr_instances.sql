-- Create table to track QR code instances (each unique QR view)
CREATE TABLE IF NOT EXISTS qr_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id TEXT NOT NULL,
  instance_id TEXT NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scanned BOOLEAN DEFAULT FALSE,
  scanned_at TIMESTAMPTZ
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_qr_instances_qr_id ON qr_instances(qr_id);
CREATE INDEX IF NOT EXISTS idx_qr_instances_instance_id ON qr_instances(instance_id);

-- Enable Row Level Security
ALTER TABLE qr_instances ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert and update
CREATE POLICY "Allow public inserts on instances" ON qr_instances
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public updates on instances" ON qr_instances
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow public select on instances" ON qr_instances
  FOR SELECT
  USING (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE qr_instances;

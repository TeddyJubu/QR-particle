-- Ensure realtime is enabled for qr_scans table
-- This command is idempotent - it won't error if already added

DO $$
BEGIN
  -- Check if table is already in publication
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'qr_scans'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE qr_scans;
    RAISE NOTICE 'Added qr_scans to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'qr_scans already in supabase_realtime publication';
  END IF;
END $$;

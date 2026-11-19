-- Run this in Supabase SQL Editor to fix the "permission denied for table ticket_tiers" error
-- This enables RLS and grants SELECT access to anon role for active ticket tiers

-- Enable RLS on ticket_tiers (if not already enabled)
ALTER TABLE public.ticket_tiers ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate it
DROP POLICY IF EXISTS anon_select_active_tiers ON public.ticket_tiers;
CREATE POLICY anon_select_active_tiers ON public.ticket_tiers
  FOR SELECT TO anon USING (active = true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.ticket_tiers TO anon, authenticated;

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'ticket_tiers';
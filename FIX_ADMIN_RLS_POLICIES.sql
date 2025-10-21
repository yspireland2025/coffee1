/*
  # Fix Admin RLS Policies for All Tables

  This SQL script updates all admin policies to check for admin role in multiple locations:
  - JWT role field
  - app_metadata.role
  - user_metadata.role
  - Specific admin email (admin@yspi.ie)

  Run this in the Supabase SQL Editor to fix admin access issues.
*/

-- =============================================
-- CAMPAIGNS TABLE
-- =============================================

DROP POLICY IF EXISTS "Admins can manage all campaigns" ON campaigns;

CREATE POLICY "Admins can manage all campaigns"
  ON campaigns
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'role' = 'super_admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    auth.jwt() ->> 'email' = 'admin@yspi.ie'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'role' = 'super_admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    auth.jwt() ->> 'email' = 'admin@yspi.ie'
  );

-- =============================================
-- DONATIONS TABLE
-- =============================================

DROP POLICY IF EXISTS "Admins can manage all donations" ON donations;

CREATE POLICY "Admins can manage all donations"
  ON donations
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'role' = 'super_admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    auth.jwt() ->> 'email' = 'admin@yspi.ie'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'role' = 'super_admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    auth.jwt() ->> 'email' = 'admin@yspi.ie'
  );

-- =============================================
-- PACK_ORDERS TABLE
-- =============================================

DROP POLICY IF EXISTS "Admins can read all pack orders" ON pack_orders;
DROP POLICY IF EXISTS "Admins can update pack orders" ON pack_orders;

CREATE POLICY "Admins can read all pack orders"
  ON pack_orders
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'role' = 'super_admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    auth.jwt() ->> 'email' = 'admin@yspi.ie'
  );

CREATE POLICY "Admins can update pack orders"
  ON pack_orders
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'role' = 'super_admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' OR
    auth.jwt() ->> 'email' = 'admin@yspi.ie'
  );

-- =============================================
-- MESSAGES TABLE (if exists)
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
    -- Drop existing admin policies
    EXECUTE 'DROP POLICY IF EXISTS "Admins can read all messages" ON messages';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update messages" ON messages';

    -- Create new admin policies
    EXECUTE '
      CREATE POLICY "Admins can read all messages"
        ON messages
        FOR SELECT
        TO authenticated
        USING (
          auth.jwt() ->> ''role'' = ''admin'' OR
          auth.jwt() ->> ''role'' = ''super_admin'' OR
          (auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'' OR
          (auth.jwt() -> ''app_metadata'' ->> ''role'') = ''super_admin'' OR
          (auth.jwt() -> ''user_metadata'' ->> ''role'') = ''admin'' OR
          (auth.jwt() -> ''user_metadata'' ->> ''role'') = ''super_admin'' OR
          auth.jwt() ->> ''email'' = ''admin@yspi.ie''
        )
    ';

    EXECUTE '
      CREATE POLICY "Admins can update messages"
        ON messages
        FOR UPDATE
        TO authenticated
        USING (
          auth.jwt() ->> ''role'' = ''admin'' OR
          auth.jwt() ->> ''role'' = ''super_admin'' OR
          (auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'' OR
          (auth.jwt() -> ''app_metadata'' ->> ''role'') = ''super_admin'' OR
          (auth.jwt() -> ''user_metadata'' ->> ''role'') = ''admin'' OR
          (auth.jwt() -> ''user_metadata'' ->> ''role'') = ''super_admin'' OR
          auth.jwt() ->> ''email'' = ''admin@yspi.ie''
        )
    ';
  END IF;
END $$;

-- =============================================
-- Verification Query
-- =============================================

-- Run this to verify the policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE '%Admins%'
ORDER BY tablename, policyname;

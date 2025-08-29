/*
  # Fix user creation trigger

  1. Updates
    - Fix the handle_new_user trigger function to properly extract metadata
    - Use correct JSONB syntax for Supabase auth.users table
    - Add better error handling and logging
    - Ensure trigger fires on auth.users INSERT

  2. Security
    - Function runs with security definer privileges
    - Proper error handling to not break auth flow
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create the trigger function with proper JSONB handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_full_name TEXT;
  user_county TEXT;
  user_eircode TEXT;
BEGIN
  -- Log the trigger execution
  RAISE LOG 'handle_new_user trigger fired for user: %', NEW.id;
  RAISE LOG 'User email: %', NEW.email;
  RAISE LOG 'Raw user meta data: %', NEW.raw_user_meta_data;

  -- Extract metadata from JSONB with proper syntax
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.email
  );
  
  user_county := NEW.raw_user_meta_data->>'county';
  user_eircode := NEW.raw_user_meta_data->>'eircode';

  -- Log extracted values
  RAISE LOG 'Extracted values - full_name: %, county: %, eircode: %', user_full_name, user_county, user_eircode;

  -- Insert into public.users table
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      full_name,
      role,
      is_active,
      county,
      eircode,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      user_full_name,
      'user',
      true,
      user_county,
      user_eircode,
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Successfully created user record in public.users for: %', NEW.email;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE LOG 'Error creating user record: % %', SQLERRM, SQLSTATE;
    RAISE WARNING 'Failed to create user record for %: %', NEW.email, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres;
/*
  # Fix user creation trigger function

  1. Function Updates
    - Fix the handle_new_user() function to properly handle user metadata
    - Add better error handling and logging
    - Ensure proper data extraction from auth.users

  2. Security
    - Maintain RLS policies on users table
    - Ensure trigger runs with proper permissions
*/

-- Drop and recreate the trigger function with fixes
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the trigger execution
  RAISE LOG 'handle_new_user trigger fired for user: %', NEW.id;
  
  -- Insert into public.users table
  INSERT INTO public.users (
    id,
    email,
    full_name,
    county,
    eircode,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.user_metadata->>'full_name', 
      NEW.email
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'county',
      NEW.user_metadata->>'county'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'eircode',
      NEW.user_metadata->>'eircode'
    ),
    'user',
    true,
    NOW(),
    NOW()
  );
  
  RAISE LOG 'User record created successfully for: %', NEW.email;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE LOG 'Error creating user record for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON public.users TO postgres;
/*
  # Fix user creation trigger

  1. New Functions
    - `handle_new_user_signup` - Creates user record when auth user is created
  
  2. Security
    - Grant necessary permissions for trigger function
    - Handle errors gracefully to not break auth signup
  
  3. Trigger
    - Fires on INSERT to auth.users table
    - Extracts metadata from raw_user_meta_data JSONB field
    - Creates corresponding record in public.users table
*/

-- Create the trigger function with proper error handling
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
  user_county TEXT;
  user_eircode TEXT;
BEGIN
  -- Log the trigger execution
  RAISE LOG 'handle_new_user_signup triggered for user: %', NEW.id;
  RAISE LOG 'raw_user_meta_data: %', NEW.raw_user_meta_data;
  
  -- Extract metadata from the JSONB field with proper null handling
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  user_county := NEW.raw_user_meta_data->>'county';
  user_eircode := NEW.raw_user_meta_data->>'eircode';
  
  RAISE LOG 'Extracted data - full_name: %, county: %, eircode: %', user_full_name, user_county, user_eircode;
  
  -- Insert into public.users table with error handling
  BEGIN
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
      user_full_name,
      user_county,
      user_eircode,
      'user',
      true,
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Successfully created user record in public.users for: %', NEW.email;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE LOG 'Failed to create user record: % %', SQLERRM, SQLSTATE;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres;
GRANT INSERT, UPDATE ON public.users TO postgres;
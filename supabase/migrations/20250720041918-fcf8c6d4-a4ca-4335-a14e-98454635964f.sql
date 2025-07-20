-- Create edge function to add test users
CREATE OR REPLACE FUNCTION create_test_users()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- This function will be called by an edge function
  -- that handles the actual auth user creation
  result := '{"status": "ready"}'::json;
  RETURN result;
END;
$$;
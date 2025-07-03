-- Drop existing function if it exists
DROP FUNCTION IF EXISTS admin_update_user_profile(uuid, jsonb);

-- Create a simplified update function that raises an error if the user profile doesn't exist.
CREATE OR REPLACE FUNCTION admin_update_user_profile(p_user_id uuid, p_update_data jsonb)
RETURNS SETOF users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Attempt to update the user record.
  UPDATE public.users
  SET 
    pokepoke_id = COALESCE(p_update_data->>'pokepoke_id', pokepoke_id),
    display_name = COALESCE(p_update_data->>'display_name', display_name),
    name = COALESCE(p_update_data->>'name', name),
    avatar_url = COALESCE(p_update_data->>'avatar_url', avatar_url)
  WHERE id = p_user_id;
  
  -- Check if the update affected any row. If not, it means the profile was not found.
  IF NOT FOUND THEN
    -- Raise an exception. This will be caught as an error by the Supabase client.
    RAISE EXCEPTION 'User profile not found for id %. A profile should be created automatically by a trigger.', p_user_id;
  END IF;
  
  -- If the update was successful, return the updated user data.
  RETURN QUERY SELECT * FROM public.users WHERE id = p_user_id;
END;
$$;

-- Grant necessary execute permissions
GRANT EXECUTE ON FUNCTION public.admin_update_user_profile(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_profile(uuid, jsonb) TO anon; -- for service_role usage

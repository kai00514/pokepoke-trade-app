-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS admin_get_user_by_id(uuid);
DROP FUNCTION IF EXISTS admin_update_user_profile(uuid, jsonb);

-- Create admin_get_user_by_id function
CREATE OR REPLACE FUNCTION admin_get_user_by_id(user_id uuid)
RETURNS SETOF users
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM users WHERE id = user_id;
$$;

-- Create admin_update_user_profile function with upsert capability
CREATE OR REPLACE FUNCTION admin_update_user_profile(user_id uuid, update_data jsonb)
RETURNS SETOF users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try to update existing record
  UPDATE users
  SET 
    pokepoke_id = COALESCE(update_data->>'pokepoke_id', pokepoke_id),
    display_name = COALESCE(update_data->>'display_name', display_name),
    name = COALESCE(update_data->>'name', name),
    avatar_url = COALESCE(update_data->>'avatar_url', avatar_url),
    updated_at = COALESCE((update_data->>'updated_at')::timestamp with time zone, updated_at)
  WHERE id = user_id;

  -- If no rows were updated, insert a new record
  IF NOT FOUND THEN
    INSERT INTO users (
      id,
      pokepoke_id,
      display_name,
      name,
      avatar_url,
      created_at,
      updated_at
    ) VALUES (
      user_id,
      update_data->>'pokepoke_id',
      update_data->>'display_name',
      update_data->>'name',
      update_data->>'avatar_url',
      COALESCE((update_data->>'created_at')::timestamp with time zone, NOW()),
      COALESCE((update_data->>'updated_at')::timestamp with time zone, NOW())
    );
  END IF;

  -- Return the updated/inserted record
  RETURN QUERY SELECT * FROM users WHERE id = user_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION admin_get_user_by_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_profile(uuid, jsonb) TO authenticated;

-- Grant execute permissions to anon users (for public access if needed)
GRANT EXECUTE ON FUNCTION admin_get_user_by_id(uuid) TO anon;
GRANT EXECUTE ON FUNCTION admin_update_user_profile(uuid, jsonb) TO anon;

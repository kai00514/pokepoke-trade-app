-- ユーザープロファイル取得用のRPC関数
CREATE OR REPLACE FUNCTION admin_get_user_by_id(user_id UUID)
RETURNS SETOF users
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM users WHERE id = user_id;
$$;

-- ユーザープロファイル更新用のRPC関数
CREATE OR REPLACE FUNCTION admin_update_user_profile(user_id UUID, update_data JSONB)
RETURNS SETOF users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET 
    pokepoke_id = COALESCE(update_data->>'pokepoke_id', pokepoke_id),
    display_name = COALESCE(update_data->>'display_name', display_name),
    name = COALESCE(update_data->>'name', name),
    avatar_url = COALESCE(update_data->>'avatar_url', avatar_url),
    updated_at = COALESCE(update_data->>'updated_at', updated_at)
  WHERE id = user_id;
  
  RETURN QUERY SELECT * FROM users WHERE id = user_id;
END;
$$;

-- RPC関数に対する権限設定
GRANT EXECUTE ON FUNCTION admin_get_user_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_profile(UUID, JSONB) TO authenticated;

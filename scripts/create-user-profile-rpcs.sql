-- RPC関数を作成してRLSをバイパスしてユーザープロファイルを更新
CREATE OR REPLACE FUNCTION admin_update_user_profile(
  target_user_id UUID,
  profile_updates JSONB
)
RETURNS TABLE(
  id UUID,
  email TEXT,
  display_name TEXT,
  pokepoke_id TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 現在のユーザーが対象ユーザーと同じかチェック
  IF auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot update other user profiles';
  END IF;
  
  -- プロファイルを更新
  UPDATE users 
  SET 
    display_name = COALESCE((profile_updates->>'display_name')::TEXT, display_name),
    pokepoke_id = COALESCE((profile_updates->>'pokepoke_id')::TEXT, pokepoke_id),
    name = COALESCE((profile_updates->>'name')::TEXT, name),
    avatar_url = COALESCE((profile_updates->>'avatar_url')::TEXT, avatar_url),
    updated_at = NOW()
  WHERE users.id = target_user_id;
  
  -- 更新されたデータを返す
  RETURN QUERY
  SELECT 
    users.id,
    users.email,
    users.display_name,
    users.pokepoke_id,
    users.name,
    users.avatar_url,
    users.created_at,
    users.updated_at
  FROM users
  WHERE users.id = target_user_id;
END;
$$;

-- 関数の実行権限を認証済みユーザーに付与
GRANT EXECUTE ON FUNCTION admin_update_user_profile(UUID, JSONB) TO authenticated;

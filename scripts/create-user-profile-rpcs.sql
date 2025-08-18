-- RPC関数を作成してRLSをバイパス
CREATE OR REPLACE FUNCTION admin_get_user_by_id(target_user_id UUID)
RETURNS SETOF users
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM users WHERE id = target_user_id;
$$;

-- ユーザープロファイル更新用のRPC関数
CREATE OR REPLACE FUNCTION admin_update_user_profile(target_user_id UUID, profile_updates JSONB)
RETURNS SETOF users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- まず、ユーザーが存在するかチェック
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = target_user_id) THEN
    -- ユーザーが存在し���い場合は作成
    INSERT INTO users (
      id,
      pokepoke_id,
      display_name,
      name,
      avatar_url,
      created_at,
      updated_at
    ) VALUES (
      target_user_id,
      profile_updates->>'pokepoke_id',
      profile_updates->>'display_name',
      profile_updates->>'name',
      profile_updates->>'avatar_url',
      COALESCE((profile_updates->>'created_at')::timestamptz, NOW()),
      COALESCE((profile_updates->>'updated_at')::timestamptz, NOW())
    );
  ELSE
    -- ユーザーが存在する場合は更新
    UPDATE users
    SET 
      pokepoke_id = COALESCE(profile_updates->>'pokepoke_id', pokepoke_id),
      display_name = COALESCE(profile_updates->>'display_name', display_name),
      name = COALESCE(profile_updates->>'name', name),
      avatar_url = COALESCE(profile_updates->>'avatar_url', avatar_url),
      updated_at = COALESCE((profile_updates->>'updated_at')::timestamptz, NOW())
    WHERE id = target_user_id;
  END IF;
  
  -- 更新されたデータを返す
  RETURN QUERY SELECT * FROM users WHERE id = target_user_id;
END;
$$;

-- 関数の実行権限を設定
GRANT EXECUTE ON FUNCTION admin_get_user_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_profile(UUID, JSONB) TO authenticated;

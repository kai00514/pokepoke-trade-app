-- 既存の関数を削除
DROP FUNCTION IF EXISTS admin_update_user_profile(uuid, jsonb);
DROP FUNCTION IF EXISTS admin_get_user_by_id(uuid);

-- admin_get_user_by_id関数を修正（SECURITY DEFINERを追加）
CREATE OR REPLACE FUNCTION admin_get_user_by_id(user_id uuid)
RETURNS SETOF users
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM users WHERE id = user_id;
$$;

-- admin_update_user_profile関数を修正（SECURITY DEFINERとupsert機能を追加）
CREATE OR REPLACE FUNCTION admin_update_user_profile(user_id uuid, update_data jsonb)
RETURNS SETOF users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- まず、ユーザーが存在するかチェック
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = user_id) THEN
    -- ユーザーが存在しない場合は作成
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
      COALESCE((update_data->>'created_at')::timestamptz, NOW()),
      COALESCE((update_data->>'updated_at')::timestamptz, NOW())
    );
  ELSE
    -- ユーザーが存在する場合は更新
    UPDATE users
    SET 
      pokepoke_id = COALESCE(update_data->>'pokepoke_id', pokepoke_id),
      display_name = COALESCE(update_data->>'display_name', display_name),
      name = COALESCE(update_data->>'name', name),
      avatar_url = COALESCE(update_data->>'avatar_url', avatar_url),
      updated_at = COALESCE((update_data->>'updated_at')::timestamptz, NOW())
    WHERE id = user_id;
  END IF;
  
  -- 更新されたデータを返す
  RETURN QUERY SELECT * FROM users WHERE id = user_id;
END;
$$;

-- 関数の実行権限を設定
GRANT EXECUTE ON FUNCTION admin_get_user_by_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_profile(uuid, jsonb) TO authenticated;

-- 関数の所有者を確認（必要に応じて調整）
-- ALTER FUNCTION admin_get_user_by_id(uuid) OWNER TO postgres;
-- ALTER FUNCTION admin_update_user_profile(uuid, jsonb) OWNER TO postgres;

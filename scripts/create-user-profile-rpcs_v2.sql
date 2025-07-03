-- 既存の関数を削除（存在する場合）
DROP FUNCTION IF EXISTS admin_update_user_profile(target_user_id UUID, profile_data JSONB);
DROP FUNCTION IF EXISTS ensure_user_profile_exists(target_user_id UUID);

-- ユーザープロファイルの存在を確認し、存在しない場合は作成する関数
CREATE OR REPLACE FUNCTION ensure_user_profile_exists(target_user_id UUID)
RETURNS users AS $$
DECLARE
    user_record users%ROWTYPE;
    auth_user_data auth.users%ROWTYPE;
BEGIN
    -- まず既存のユーザーレコードを確認
    SELECT * INTO user_record FROM users WHERE id = target_user_id;
    
    -- ユーザーレコードが存在しない場合は作成
    IF NOT FOUND THEN
        -- auth.usersテーブルからユーザー情報を取得
        SELECT * INTO auth_user_data FROM auth.users WHERE id = target_user_id;
        
        IF FOUND THEN
            -- 新しいユーザーレコードを作成
            INSERT INTO users (
                id,
                email,
                created_at,
                updated_at
            ) VALUES (
                target_user_id,
                auth_user_data.email,
                NOW(),
                NOW()
            ) RETURNING * INTO user_record;
            
            RAISE LOG 'Created new user profile for user_id: %', target_user_id;
        ELSE
            RAISE EXCEPTION 'Auth user not found for user_id: %', target_user_id;
        END IF;
    END IF;
    
    RETURN user_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 管理者権限でユーザープロファイルを更新する関数（RLSをバイパス）
CREATE OR REPLACE FUNCTION admin_update_user_profile(
    target_user_id UUID,
    profile_data JSONB
)
RETURNS users AS $$
DECLARE
    user_record users%ROWTYPE;
    updated_record users%ROWTYPE;
BEGIN
    -- ユーザープロファイルの存在を確認（存在しない場合は作成）
    SELECT * INTO user_record FROM ensure_user_profile_exists(target_user_id);
    
    -- プロファイルデータを更新
    UPDATE users SET
        display_name = COALESCE((profile_data->>'display_name')::TEXT, display_name),
        pokepoke_id = COALESCE((profile_data->>'pokepoke_id')::TEXT, pokepoke_id),
        name = COALESCE((profile_data->>'name')::TEXT, name),
        avatar_url = COALESCE((profile_data->>'avatar_url')::TEXT, avatar_url),
        updated_at = NOW()
    WHERE id = target_user_id
    RETURNING * INTO updated_record;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to update user profile for user_id: %', target_user_id;
    END IF;
    
    RAISE LOG 'Updated user profile for user_id: %, data: %', target_user_id, profile_data;
    
    RETURN updated_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 関数の実行権限を認証済みユーザーに付与
GRANT EXECUTE ON FUNCTION ensure_user_profile_exists(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_profile(UUID, JSONB) TO authenticated;

-- 通知テーブルの改善スクリプト

-- 1. user_idのデータ型をtextからuuidに変更（既存データがある場合は注意）
-- 注意: 本番環境では既存データのバックアップを取ってから実行してください

-- trade_notificationsテーブルの改善
ALTER TABLE public.trade_notifications 
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
  ALTER COLUMN is_read SET NOT NULL,
  ALTER COLUMN is_read SET DEFAULT false,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now();

-- deck_notificationsテーブルの改善
ALTER TABLE public.deck_notifications 
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
  ALTER COLUMN is_read SET NOT NULL,
  ALTER COLUMN is_read SET DEFAULT false,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now();

-- 外部キー制約の追加（profilesテーブルが存在する場合）
ALTER TABLE public.trade_notifications 
  ADD CONSTRAINT fk_trade_notifications_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.deck_notifications 
  ADD CONSTRAINT fk_deck_notifications_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 複合インデックスの追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_trade_notifications_user_unread 
  ON public.trade_notifications (user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deck_notifications_user_unread 
  ON public.deck_notifications (user_id, is_read, created_at DESC);

-- typeカラムのインデックス追加
CREATE INDEX IF NOT EXISTS idx_trade_notifications_type 
  ON public.trade_notifications (type);

CREATE INDEX IF NOT EXISTS idx_deck_notifications_type 
  ON public.deck_notifications (type);

-- 古い通知を自動削除する関数（オプション）
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- 90日以上古い通知を削除
  DELETE FROM public.trade_notifications 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  DELETE FROM public.deck_notifications 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 定期実行のためのcron設定（pg_cronが有効な場合）
-- SELECT cron.schedule('cleanup-notifications', '0 2 * * *', 'SELECT cleanup_old_notifications();');

-- 通知統計を取得するビュー（オプション）
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
  'trade' as notification_type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(DISTINCT user_id) as unique_users
FROM public.trade_notifications
UNION ALL
SELECT 
  'deck' as notification_type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(DISTINCT user_id) as unique_users
FROM public.deck_notifications;

-- コメント
COMMENT ON TABLE public.trade_notifications IS 'トレード関連の通知を管理するテーブル';
COMMENT ON TABLE public.deck_notifications IS 'デッキ関連の通知を管理するテーブル';
COMMENT ON COLUMN public.trade_notifications.type IS '通知の種類（comment, reply, match_request等）';
COMMENT ON COLUMN public.trade_notifications.content IS '通知の内容メッセージ';
COMMENT ON COLUMN public.trade_notifications.related_id IS '関連するリソースのID（投稿ID、デッキID等）';
COMMENT ON COLUMN public.deck_notifications.type IS '通知の種類（comment, like, share等）';
COMMENT ON COLUMN public.deck_notifications.content IS '通知の内容メッセージ';
COMMENT ON COLUMN public.deck_notifications.related_id IS '関連するリソースのID（投稿ID、デッキID等）';

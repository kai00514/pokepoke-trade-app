-- 通知テーブルの改善スクリプト

-- 1. trade_notificationsテーブルの改善
-- user_idをtextからuuidに変更し、外部キー制約を追加
ALTER TABLE public.trade_notifications 
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- 外部キー制約を追加
ALTER TABLE public.trade_notifications 
  ADD CONSTRAINT fk_trade_notifications_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- NOT NULL制約を追加
ALTER TABLE public.trade_notifications 
  ALTER COLUMN is_read SET NOT NULL,
  ALTER COLUMN is_read SET DEFAULT false,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now();

-- 複合インデックスを追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_trade_notifications_user_unread_date 
  ON public.trade_notifications (user_id, is_read, created_at DESC);

-- typeカラムにインデックスを追加
CREATE INDEX IF NOT EXISTS idx_trade_notifications_type 
  ON public.trade_notifications (type);

-- related_idにインデックスを追加
CREATE INDEX IF NOT EXISTS idx_trade_notifications_related_id 
  ON public.trade_notifications (related_id);

-- 2. deck_notificationsテーブルの改善
-- user_idをtextからuuidに変更し、外部キー制約を追加
ALTER TABLE public.deck_notifications 
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- 外部キー制約を追加
ALTER TABLE public.deck_notifications 
  ADD CONSTRAINT fk_deck_notifications_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- NOT NULL制約を追加
ALTER TABLE public.deck_notifications 
  ALTER COLUMN is_read SET NOT NULL,
  ALTER COLUMN is_read SET DEFAULT false,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now();

-- 複合インデックスを追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_deck_notifications_user_unread_date 
  ON public.deck_notifications (user_id, is_read, created_at DESC);

-- typeカラムにインデックスを追加
CREATE INDEX IF NOT EXISTS idx_deck_notifications_type 
  ON public.deck_notifications (type);

-- related_idにインデックスを追加
CREATE INDEX IF NOT EXISTS idx_deck_notifications_related_id 
  ON public.deck_notifications (related_id);

-- 3. 古い通知を自動削除する関数を作成
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- 30日以上前の既読通知を削除
  DELETE FROM public.trade_notifications 
  WHERE is_read = true 
    AND created_at < NOW() - INTERVAL '30 days';
    
  DELETE FROM public.deck_notifications 
  WHERE is_read = true 
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 4. 通知統計を取得する関数を作成
CREATE OR REPLACE FUNCTION get_notification_stats(user_uuid uuid)
RETURNS TABLE(
  total_count bigint,
  unread_count bigint,
  trade_count bigint,
  deck_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.trade_notifications WHERE user_id = user_uuid) +
    (SELECT COUNT(*) FROM public.deck_notifications WHERE user_id = user_uuid) as total_count,
    
    (SELECT COUNT(*) FROM public.trade_notifications WHERE user_id = user_uuid AND is_read = false) +
    (SELECT COUNT(*) FROM public.deck_notifications WHERE user_id = user_uuid AND is_read = false) as unread_count,
    
    (SELECT COUNT(*) FROM public.trade_notifications WHERE user_id = user_uuid) as trade_count,
    
    (SELECT COUNT(*) FROM public.deck_notifications WHERE user_id = user_uuid) as deck_count;
END;
$$ LANGUAGE plpgsql;

-- 5. 通知の一括既読機能を改善
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.trade_notifications 
  SET is_read = true 
  WHERE user_id = user_uuid AND is_read = false;
  
  UPDATE public.deck_notifications 
  SET is_read = true 
  WHERE user_id = user_uuid AND is_read = false;
END;
$$ LANGUAGE plpgsql;

-- 6. RLS (Row Level Security) ポリシーを設定
-- trade_notificationsのRLS有効化
ALTER TABLE public.trade_notifications ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の通知のみ閲覧・操作可能
CREATE POLICY "Users can view own trade notifications" ON public.trade_notifications
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own trade notifications" ON public.trade_notifications
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own trade notifications" ON public.trade_notifications
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own trade notifications" ON public.trade_notifications
  FOR DELETE USING (auth.uid()::text = user_id);

-- deck_notificationsのRLS有効化
ALTER TABLE public.deck_notifications ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の通知のみ閲覧・操作可能
CREATE POLICY "Users can view own deck notifications" ON public.deck_notifications
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own deck notifications" ON public.deck_notifications
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own deck notifications" ON public.deck_notifications
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own deck notifications" ON public.deck_notifications
  FOR DELETE USING (auth.uid()::text = user_id);

-- 7. 通知作成時のトリガー関数
CREATE OR REPLACE FUNCTION notify_user_on_notification()
RETURNS trigger AS $$
BEGIN
  -- リアルタイム通知のためのチャンネル通知
  PERFORM pg_notify('user_notification_' || NEW.user_id::text, 
    json_build_object(
      'id', NEW.id,
      'type', NEW.type,
      'content', NEW.content,
      'created_at', NEW.created_at
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを作成
CREATE TRIGGER trigger_notify_user_on_trade_notification
  AFTER INSERT ON public.trade_notifications
  FOR EACH ROW EXECUTE FUNCTION notify_user_on_notification();

CREATE TRIGGER trigger_notify_user_on_deck_notification
  AFTER INSERT ON public.deck_notifications
  FOR EACH ROW EXECUTE FUNCTION notify_user_on_notification();

-- 8. 通知作成用の関数
CREATE OR REPLACE FUNCTION create_trade_notification(
  p_user_id text,
  p_type text,
  p_content text,
  p_related_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.trade_notifications (user_id, type, content, related_id)
  VALUES (p_user_id, p_type, p_content, p_related_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_deck_notification(
  p_user_id text,
  p_type text,
  p_content text,
  p_related_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.deck_notifications (user_id, type, content, related_id)
  VALUES (p_user_id, p_type, p_content, p_related_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- 9. 未読通知数を取得する関数
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id text)
RETURNS integer AS $$
DECLARE
  trade_count integer;
  deck_count integer;
BEGIN
  SELECT COUNT(*) INTO trade_count
  FROM public.trade_notifications
  WHERE user_id = p_user_id::uuid AND is_read = false;
  
  SELECT COUNT(*) INTO deck_count
  FROM public.deck_notifications
  WHERE user_id = p_user_id::uuid AND is_read = false;
  
  RETURN COALESCE(trade_count, 0) + COALESCE(deck_count, 0);
END;
$$ LANGUAGE plpgsql;

-- 10. パフォーマンス向上のための部分インデックス
-- 未読通知のみのインデックス（よく使われるクエリを高速化）
CREATE INDEX IF NOT EXISTS idx_trade_notifications_unread_only 
  ON public.trade_notifications (user_id, created_at DESC) 
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_deck_notifications_unread_only 
  ON public.deck_notifications (user_id, created_at DESC) 
  WHERE is_read = false;

-- 11. 統計情報の更新
ANALYZE public.trade_notifications;
ANALYZE public.deck_notifications;

-- 完了メッセージ
DO $$
BEGIN
  RAISE NOTICE '通知テーブルの改善が完了しました。';
  RAISE NOTICE '- 外部キー制約の追加';
  RAISE NOTICE '- インデックスの最適化';
  RAISE NOTICE '- RLSポリシーの設定';
  RAISE NOTICE '- 自動クリーンアップ機能の追加';
  RAISE NOTICE '- リアルタイム通知機能の追加';
  RAISE NOTICE '- 通知作成用の関数の追加';
  RAISE NOTICE '- 未読通知数を取得する関数の追加';
END $$;

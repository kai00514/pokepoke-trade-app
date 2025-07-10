-- 通知テーブルの改善点を適用

-- 1. user_idのデータ型をUUIDに統一（現在はtextになっている）
-- trade_notificationsテーブルの改善
ALTER TABLE public.trade_notifications 
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- deck_notificationsテーブルの改善  
ALTER TABLE public.deck_notifications 
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- 2. 外部キー制約を追加してデータ整合性を保つ
ALTER TABLE public.trade_notifications 
ADD CONSTRAINT fk_trade_notifications_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.deck_notifications 
ADD CONSTRAINT fk_deck_notifications_user_id 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 3. is_readのデフォルト値をNOT NULLに変更
ALTER TABLE public.trade_notifications 
ALTER COLUMN is_read SET DEFAULT false,
ALTER COLUMN is_read SET NOT NULL;

ALTER TABLE public.deck_notifications 
ALTER COLUMN is_read SET DEFAULT false,
ALTER COLUMN is_read SET NOT NULL;

-- 4. created_atのデフォルト値をNOT NULLに変更
ALTER TABLE public.trade_notifications 
ALTER COLUMN created_at SET DEFAULT now(),
ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.deck_notifications 
ALTER COLUMN created_at SET DEFAULT now(),
ALTER COLUMN created_at SET NOT NULL;

-- 5. 複合インデックスを追加してクエリパフォーマンスを向上
CREATE INDEX IF NOT EXISTS idx_trade_notifications_user_unread 
ON public.trade_notifications (user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deck_notifications_user_unread 
ON public.deck_notifications (user_id, is_read, created_at DESC);

-- 6. typeカラムにインデックスを追加（通知タイプでのフィルタリング用）
CREATE INDEX IF NOT EXISTS idx_trade_notifications_type 
ON public.trade_notifications (type);

CREATE INDEX IF NOT EXISTS idx_deck_notifications_type 
ON public.deck_notifications (type);

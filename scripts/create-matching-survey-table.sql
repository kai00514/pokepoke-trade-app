-- Q1 用 ENUM（最重視項目）
DO $$ BEGIN
  CREATE TYPE matching_primary_pref AS ENUM (
    'want_match',       -- 欲しいカードが一致
    'offer_match',      -- 譲れるカードが一致
    'facet_search',     -- レアリティ/タイプ等で検索
    'direct_specify'    -- フレンドID等で直接指定
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.matching_survey_responses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- Q1: 単一（ENUM）
  q1_primary   matching_primary_pref NOT NULL,
  -- Q2: 複数（配列）。許容値を CHECK で制約
  q2_values    text[] NOT NULL DEFAULT '{}',
  -- Q3: 複数（配列）。許容値を CHECK で制約
  q3_features  text[] NOT NULL DEFAULT '{}',
  -- Q4: 任意（1〜5）
  q4_intent    smallint,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_matching_survey_user UNIQUE (user_id),
  CONSTRAINT chk_q2_values_allowed CHECK (
    q2_values <@ ARRAY['speed','trust','rare_efficiency','social']::text[]
  ),
  CONSTRAINT chk_q3_features_allowed CHECK (
    q3_features <@ ARRAY['chat','notify','review','history']::text[]
  ),
  CONSTRAINT chk_q4_intent_range CHECK (
    q4_intent IS NULL OR (q4_intent BETWEEN 1 AND 5)
  )
);

-- 更新タイムスタンプ
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_updated_at ON public.matching_survey_responses;
CREATE TRIGGER trg_touch_updated_at
BEFORE UPDATE ON public.matching_survey_responses
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS
ALTER TABLE public.matching_survey_responses ENABLE ROW LEVEL SECURITY;

-- 自分の回答の参照・作成のみ許可（1回だけ）
CREATE POLICY "survey_select_own"
ON public.matching_survey_responses
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "survey_insert_own"
ON public.matching_survey_responses
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 回答の上書きは不可（要件：1ユーザー1回）
REVOKE UPDATE ON public.matching_survey_responses FROM PUBLIC;

-- 集計用の簡易ビュー（個票を見せずにカウントだけ使える）
CREATE OR REPLACE VIEW public.matching_survey_agg AS
SELECT
  count(*)                                          AS total,
  q1_primary,
  (SELECT jsonb_object_agg(val, cnt) FROM (
    SELECT val, count(*) AS cnt
    FROM public.matching_survey_responses r2,
         unnest(r2.q2_values) val
    GROUP BY val
  ) s)                                              AS q2_counts,
  (SELECT jsonb_object_agg(val, cnt) FROM (
    SELECT val, count(*) AS cnt
    FROM public.matching_survey_responses r3,
         unnest(r3.q3_features) val
    GROUP BY val
  ) s2)                                             AS q3_counts
FROM public.matching_survey_responses
GROUP BY q1_primary;

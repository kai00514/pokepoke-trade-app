# 現在のデータベーススキーマ

**作成日**: 2025-11-25
**データベース**: Supabase PostgreSQL
**プロジェクトID**: oflucnwezzqqtxryonhf

---

## 📊 テーブル一覧

| テーブル名 | 説明 | 多言語対応必要 |
|-----------|------|--------------|
| cards | カードマスターデータ | ✅ 必要 |
| packs | パック情報 | ✅ 必要 |
| deck_pages | 公式デッキガイド | ✅ 必要 |
| info_articles | 情報記事 | ✅ 必要 |
| info_article_blocks | 記事ブロック | ✅ 必要 |
| info_pages | 情報ページ | ✅ 必要 |
| tournaments | 大会情報 | ✅ 必要 |
| decks | ユーザーデッキ | ✅ 必要 |
| trade_posts | トレード投稿 | ✅ 必要 |
| user_collages | ユーザーコラージュ | ✅ 必要 |
| deck_comments | デッキコメント | ⚠️ オンデマンド翻訳 |
| trade_comments | トレードコメント | ⚠️ オンデマンド翻訳 |
| notifications | 通知 | ✅ 必要 |
| admin_users | 管理者ユーザー | ❌ 不要 |
| deck_cards | デッキカード中間テーブル | ❌ 不要 |
| deck_favorites | デッキお気に入り | ❌ 不要 |
| deck_lists | デッキリスト | ❌ 不要 |
| deck_notifications | デッキ通知 | ❌ 不要 |
| contact_submissions | お問い合わせ | ❌ 不要 |
| matching_survey_responses | マッチング調査回答 | ❌ 不要 |
| message_reactions | メッセージリアクション | ❌ 不要 |
| trade_matches | トレードマッチ | ❌ 不要 |
| trade_notifications | トレード通知 | ❌ 不要 |
| trade_owned_list | 所有カードリスト | ❌ 不要 |
| trade_post_offered_cards | 提供カード中間テーブル | ❌ 不要 |
| trade_post_wanted_cards | 求めるカード中間テーブル | ❌ 不要 |
| users | ユーザー | ❌ 不要 |

---

## 1. cards（カードマスターデータ）

### 現在のスキーマ

```sql
CREATE TABLE cards (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name               TEXT NOT NULL,
  category           card_category NOT NULL,
  type_code          TEXT NOT NULL,
  rarity_code        card_rarity_code NOT NULL,
  pack_id            BIGINT REFERENCES packs(id) ON DELETE SET NULL,
  image_url          TEXT NOT NULL,
  thumb_url          TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_visible         BOOLEAN DEFAULT true,
  poke2_image_url    TEXT,
  poke2_name         TEXT,
  game8_image_url    TEXT,
  col_1              TEXT,
  col_2              TEXT,
  col_3              TEXT,  -- パック識別子
  col_4              TEXT,  -- カード番号
  col_5              TEXT   -- フルID
);

CREATE INDEX idx_cards_is_visible ON cards(is_visible);
CREATE INDEX idx_cards_name ON cards USING GIN(to_tsvector('simple', name));
CREATE INDEX idx_cards_pack ON cards(pack_id);
CREATE INDEX idx_cards_type ON cards(type_code, rarity_code);
```

### 多言語化に必要な変更

```sql
-- JSONB カラム追加
ALTER TABLE cards ADD COLUMN name_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb;
ALTER TABLE cards ADD COLUMN image_url_multilingual JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 既存データを JSONB に変換
UPDATE cards SET
  name_multilingual = jsonb_build_object('ja', name),
  image_url_multilingual = jsonb_build_object(
    'ja', image_url,
    'en', COALESCE(game8_image_url, image_url)
  );

-- インデックス作成
CREATE INDEX idx_cards_name_multilingual ON cards USING GIN(name_multilingual);
CREATE INDEX idx_cards_image_multilingual ON cards USING GIN(image_url_multilingual);
```

---

## 2. packs（パック情報）

### 現在のスキーマ

```sql
CREATE TABLE packs (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         TEXT NOT NULL,
  release_date DATE,
  total_cards  SMALLINT,
  symbol_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 多言語化に必要な変更

```sql
ALTER TABLE packs ADD COLUMN name_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb;
ALTER TABLE packs ADD COLUMN symbol_url_multilingual JSONB DEFAULT '{}'::jsonb;

UPDATE packs SET
  name_multilingual = jsonb_build_object('ja', name),
  symbol_url_multilingual = jsonb_build_object('ja', symbol_url);

CREATE INDEX idx_packs_name_multilingual ON packs USING GIN(name_multilingual);
```

---

## 3. deck_pages（公式デッキガイド）

### 現在のスキーマ

```sql
CREATE TABLE deck_pages (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                        TEXT NOT NULL,
  last_updated                 TIMESTAMPTZ DEFAULT now(),
  comment_count                INTEGER DEFAULT 0,
  thumbnail_image_url          TEXT,
  thumbnail_alt                TEXT,
  deck_badge                   TEXT,
  section1_title               TEXT NOT NULL,
  deck_name                    TEXT NOT NULL,
  energy_type                  TEXT NOT NULL,
  energy_image_url             TEXT,
  deck_cards                   JSONB DEFAULT '[]'::jsonb,
  deck_description             TEXT,
  evaluation_title             TEXT NOT NULL,
  tier_rank                    TEXT NOT NULL,
  tier_name                    TEXT NOT NULL,
  tier_descriptions            TEXT[] DEFAULT '{}',
  stat_accessibility           INTEGER CHECK (stat_accessibility BETWEEN 1 AND 5),
  stat_speed                   INTEGER CHECK (stat_speed BETWEEN 1 AND 5),
  stat_power                   INTEGER CHECK (stat_power BETWEEN 1 AND 5),
  stat_durability              INTEGER CHECK (stat_durability BETWEEN 1 AND 5),
  stat_stability               INTEGER CHECK (stat_stability BETWEEN 1 AND 5),
  section2_title               TEXT NOT NULL,
  strengths_weaknesses_list    TEXT[] DEFAULT '{}',
  strengths_weaknesses_details JSONB DEFAULT '[]'::jsonb,
  section3_title               TEXT NOT NULL,
  how_to_play_list             TEXT[] DEFAULT '{}',
  how_to_play_steps            JSONB DEFAULT '[]'::jsonb,
  is_published                 BOOLEAN DEFAULT false,
  view_count                   INTEGER DEFAULT 0,
  like_count                   INTEGER DEFAULT 0,
  created_at                   TIMESTAMPTZ DEFAULT now(),
  updated_at                   TIMESTAMPTZ DEFAULT now(),
  category                     deck_category DEFAULT 'featured',
  favorite_count               INTEGER NOT NULL DEFAULT 0,
  eval_value                   NUMERIC(3,2) DEFAULT 0.00,
  eval_count                   INTEGER DEFAULT 0
);

CREATE INDEX idx_deck_pages_category ON deck_pages(category);
CREATE INDEX idx_deck_pages_deck_cards ON deck_pages USING GIN(deck_cards);
CREATE INDEX idx_deck_pages_published ON deck_pages(is_published, created_at DESC);
CREATE INDEX idx_deck_pages_title ON deck_pages USING GIN(to_tsvector('simple', title));
```

### 多言語化に必要な変更（17カラム）

```sql
-- 17カラムの多言語化
ALTER TABLE deck_pages
  ADD COLUMN title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN deck_name_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN deck_description_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN evaluation_title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN tier_name_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN tier_descriptions_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN section1_title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN section2_title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN section3_title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN strengths_weaknesses_list_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN strengths_weaknesses_details_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN how_to_play_list_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN how_to_play_steps_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN thumbnail_alt_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN deck_badge_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN thumbnail_image_url_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN energy_image_url_multilingual JSONB DEFAULT '{}'::jsonb;

-- 既存データ変換
UPDATE deck_pages SET
  title_multilingual = jsonb_build_object('ja', title),
  deck_name_multilingual = jsonb_build_object('ja', deck_name),
  -- ... (他のフィールドも同様)
;

-- インデックス作成（GINインデックス: 4個）
CREATE INDEX idx_deck_pages_title_multilingual ON deck_pages USING GIN(title_multilingual);
CREATE INDEX idx_deck_pages_strengths_weaknesses_multilingual ON deck_pages USING GIN(strengths_weaknesses_details_multilingual);
CREATE INDEX idx_deck_pages_how_to_play_multilingual ON deck_pages USING GIN(how_to_play_steps_multilingual);
CREATE INDEX idx_deck_pages_deck_name_multilingual ON deck_pages USING GIN(deck_name_multilingual);
```

---

## 4. info_articles（情報記事）

### 現在のスキーマ

```sql
CREATE TABLE info_articles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                CITEXT UNIQUE,
  title               TEXT NOT NULL,
  subtitle            TEXT,
  excerpt             TEXT,
  thumbnail_image_url TEXT,
  hero_image_url      TEXT,
  category            TEXT NOT NULL DEFAULT 'news',
  tags                TEXT[] NOT NULL DEFAULT '{}',
  is_published        BOOLEAN NOT NULL DEFAULT false,
  published_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  pinned              BOOLEAN NOT NULL DEFAULT false,
  priority            INTEGER NOT NULL DEFAULT 0,
  view_count          BIGINT NOT NULL DEFAULT 0,
  like_count          BIGINT NOT NULL DEFAULT 0,
  favorite_count      BIGINT NOT NULL DEFAULT 0,
  comment_count       BIGINT NOT NULL DEFAULT 0,
  author_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX info_articles_idx_cat_pin_pri_pub ON info_articles(category, pinned DESC, priority DESC, published_at DESC);
CREATE INDEX info_articles_idx_pub_time ON info_articles(is_published, published_at DESC);
CREATE INDEX info_articles_idx_tags_gin ON info_articles USING GIN(tags);
```

### 多言語化に必要な変更（6カラム）

```sql
ALTER TABLE info_articles
  ADD COLUMN title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN subtitle_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN excerpt_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN thumbnail_image_url_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN hero_image_url_multilingual JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN tags_multilingual JSONB DEFAULT '{}'::jsonb;

-- インデックス作成（GINインデックス: 2個）
CREATE INDEX idx_info_articles_title_multilingual ON info_articles USING GIN(title_multilingual);
CREATE INDEX idx_info_articles_tags_multilingual ON info_articles USING GIN(tags_multilingual);
```

---

## 5. info_article_blocks（記事ブロック）

### 現在のスキーマ

```sql
CREATE TABLE info_article_blocks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id    UUID NOT NULL REFERENCES info_articles(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  type          TEXT NOT NULL,
  data          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(article_id, display_order)
);

CREATE INDEX info_article_blocks_type_idx ON info_article_blocks(type);

-- Constraint: type を制限
CHECK (type IN ('heading', 'paragraph', 'rich-text', 'image', 'list', 'table',
                'flexible-table', 'key-value-table', 'callout', 'toc',
                'latest-info', 'divider', 'related-links', 'evaluation',
                'cards-table', 'card-display-table', 'media-gallery',
                'pickup', 'button'))
```

### 多言語化に必要な変更（1カラム）

```sql
ALTER TABLE info_article_blocks
  ADD COLUMN data_multilingual JSONB NOT NULL DEFAULT '{"ja":{}}'::jsonb;

UPDATE info_article_blocks SET
  data_multilingual = jsonb_build_object('ja', data);

-- インデックス作成（GINインデックス: 1個）
CREATE INDEX idx_info_article_blocks_data_multilingual ON info_article_blocks USING GIN(data_multilingual);
```

---

## 6. info_pages（情報ページ）

### 現在のスキーマ

```sql
CREATE TABLE info_pages (
  -- deck_pages と同じ構造
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                        TEXT NOT NULL,
  -- ... (deck_pages と同一フィールド多数)
);
```

### 多言語化に必要な変更

**info_pages は deck_pages と同じ構造のため、deck_pages と同じ17カラムの多言語化が必要**

---

## 7. tournaments（大会情報）

### 現在のスキーマ

```sql
CREATE TABLE tournaments (
  id           BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  title        TEXT NOT NULL,
  event_date   TIMESTAMP NOT NULL,
  is_online    BOOLEAN DEFAULT true,
  benefit      TEXT DEFAULT '',
  detail_url   TEXT DEFAULT '',
  is_published BOOLEAN DEFAULT true
);
```

### 多言語化に必要な変更（2カラム）

```sql
ALTER TABLE tournaments
  ADD COLUMN title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN benefit_multilingual JSONB DEFAULT '{}'::jsonb;

UPDATE tournaments SET
  title_multilingual = jsonb_build_object('ja', title),
  benefit_multilingual = jsonb_build_object('ja', benefit);

-- インデックス作成（GINインデックス: 1個）
CREATE INDEX idx_tournaments_title_multilingual ON tournaments USING GIN(title_multilingual);
```

---

## 8. decks（ユーザーデッキ）

### 現在のスキーマ

```sql
CREATE TABLE decks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  description       TEXT,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_name        TEXT,
  is_public         BOOLEAN NOT NULL DEFAULT true,
  tags              TEXT[] DEFAULT '{}',
  thumbnail_card_id INTEGER REFERENCES cards(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  like_count        INTEGER NOT NULL DEFAULT 0,
  favorite_count    INTEGER NOT NULL DEFAULT 0,
  view_count        INTEGER NOT NULL DEFAULT 0,
  comment_count     INTEGER NOT NULL DEFAULT 0,
  CHECK (
    (user_id IS NOT NULL AND guest_name IS NULL) OR
    (user_id IS NULL AND guest_name IS NOT NULL)
  )
);

CREATE INDEX idx_decks_created_at ON decks(created_at DESC);
CREATE INDEX idx_decks_is_public ON decks(is_public);
CREATE INDEX idx_decks_user_id ON decks(user_id);
```

### 多言語化に必要な変更（2カラム）

```sql
ALTER TABLE decks
  ADD COLUMN title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN description_multilingual JSONB DEFAULT '{}'::jsonb;

-- インデックス作成（GINインデックス: 1個）
CREATE INDEX idx_decks_title_multilingual ON decks USING GIN(title_multilingual);
```

---

## 9. trade_posts（トレード投稿）

### 現在のスキーマ

```sql
CREATE TABLE trade_posts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  owner_id         UUID,
  custom_id        TEXT,
  comment          TEXT,
  status           TEXT NOT NULL DEFAULT 'OPEN'
                   CHECK (status IN ('OPEN', 'MATCHED', 'COMPLETED', 'CANCELLED')),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  is_authenticated BOOLEAN NOT NULL DEFAULT false,
  guest_name       TEXT,
  g8_post_id       TEXT,
  wanted_card_id   JSONB DEFAULT '[]'::jsonb CHECK (jsonb_typeof(wanted_card_id) = 'array'),
  offered_card_id  JSONB DEFAULT '[]'::jsonb CHECK (jsonb_typeof(offered_card_id) = 'array'),
  g8_flg           BOOLEAN
);

CREATE INDEX idx_trade_posts_offered_card_id_gin ON trade_posts USING GIN(offered_card_id);
CREATE INDEX idx_trade_posts_wanted_card_id_gin ON trade_posts USING GIN(wanted_card_id);
CREATE INDEX idx_trade_posts_status ON trade_posts(status);
```

### 多言語化に必要な変更（2カラム）

```sql
ALTER TABLE trade_posts
  ADD COLUMN title_multilingual JSONB NOT NULL DEFAULT '{"ja":""}'::jsonb,
  ADD COLUMN comment_multilingual JSONB DEFAULT '{}'::jsonb;

-- インデックス作成（GINインデックス: 1個）
CREATE INDEX idx_trade_posts_title_multilingual ON trade_posts USING GIN(title_multilingual);
```

---

## 10. user_collages（ユーザーコラージュ）

### 現在のスキーマ

```sql
CREATE TABLE user_collages (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id),
  title1               TEXT NOT NULL DEFAULT '求めるカード',
  card_ids_1           BIGINT[] NOT NULL,
  title2               TEXT NOT NULL DEFAULT '譲れるカード',
  card_ids_2           BIGINT[] NOT NULL,
  created_at           TIMESTAMP DEFAULT now(),
  updated_at           TIMESTAMP DEFAULT now(),
  collage_image_url    TEXT,
  collage_storage_path TEXT
);

CREATE INDEX idx_user_id ON user_collages(user_id);
CREATE INDEX idx_user_id_created ON user_collages(user_id, created_at DESC);
```

### 多言語化に必要な変更（2カラム）

```sql
ALTER TABLE user_collages
  ADD COLUMN title1_multilingual JSONB NOT NULL DEFAULT '{"ja":"求めるカード"}'::jsonb,
  ADD COLUMN title2_multilingual JSONB NOT NULL DEFAULT '{"ja":"譲れるカード"}'::jsonb;

-- インデックス作成（GINインデックス: なし - タイトルは固定フレーズのため）
```

---

## 11. deck_comments（デッキコメント）

### 現在のスキーマ

```sql
CREATE TABLE deck_comments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id      UUID NOT NULL,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id    UUID REFERENCES deck_comments(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  user_name    VARCHAR(255),
  comment_type TEXT NOT NULL DEFAULT 'deck'
               CHECK (comment_type IN ('deck', 'deck_page'))
);

CREATE INDEX idx_comments_deck ON deck_comments(deck_id);
CREATE INDEX idx_deck_comments_type_deck_id ON deck_comments(comment_type, deck_id);
```

### 多言語化に必要な変更

**オンデマンド翻訳**: `content` はリアルタイムで翻訳API経由で表示。JSONB保存は不要。

---

## 12. trade_comments（トレードコメント）

### 現在のスキーマ

```sql
CREATE TABLE trade_comments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id               UUID NOT NULL,
  user_id               TEXT,
  content               TEXT NOT NULL,
  parent_id             UUID,
  is_guest              BOOLEAN DEFAULT false,
  guest_id              TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),
  is_edited             BOOLEAN DEFAULT false,
  is_hidden             BOOLEAN DEFAULT false,
  edited_at             TIMESTAMPTZ,
  user_name             TEXT,
  is_deleted            BOOLEAN DEFAULT false,
  guest_name            TEXT,
  thread_comment_number TEXT,
  game8_flg             SMALLINT DEFAULT 0,
  game8_comp_flg        SMALLINT DEFAULT 1,
  g8_comment_id         TEXT,
  trainer_id            TEXT,
  friend_name           TEXT
);

CREATE INDEX idx_trade_comments_post_id ON trade_comments(post_id);
```

### 多言語化に必要な変更

**オンデマンド翻訳**: `content` はリアルタイムで翻訳API経由で表示。JSONB保存は不要。

---

## 13. notifications（通知）

### 現在のスキーマ

```sql
CREATE TABLE notifications (
  id         BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  payload    JSONB NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
```

### 多言語化に必要な変更（1カラム）

```sql
ALTER TABLE notifications
  ADD COLUMN payload_multilingual JSONB NOT NULL DEFAULT '{"ja":{}}'::jsonb;

UPDATE notifications SET
  payload_multilingual = jsonb_build_object('ja', payload);

-- インデックス作成（GINインデックス: 1個）
CREATE INDEX idx_notifications_payload_multilingual ON notifications USING GIN(payload_multilingual);
```

---

## 📊 多言語化サマリー

### 対象テーブル: 13個

| テーブル名 | 追加カラム数 | GINインデックス数 | BTREEインデックス数 | 翻訳戦略 |
|-----------|------------|----------------|-------------------|---------|
| cards | 2 | 2 | 0 | CSV import |
| packs | 2 | 1 | 0 | Admin-created |
| deck_pages | 17 | 4 | 0 | Admin-created |
| info_articles | 6 | 2 | 0 | Admin-created |
| info_article_blocks | 1 | 1 | 0 | Admin-created |
| info_pages | 17 | 4 | 0 | Admin-created |
| tournaments | 2 | 1 | 0 | Admin-created |
| decks | 2 | 1 | 0 | Background |
| trade_posts | 2 | 1 | 0 | Background |
| user_collages | 2 | 0 | 0 | Background |
| deck_comments | - | - | - | On-demand |
| trade_comments | - | - | - | On-demand |
| notifications | 1 | 1 | 0 | Background |
| **合計** | **54** | **18** | **0** | - |

**注**: 多言語スキーマ変更サマリーでは66カラム・53インデックスでしたが、コメントテーブルをオンデマンド翻訳に変更したため実際は54カラム・18インデックスになります。

---

## 🔧 補助テーブル（新規作成が必要）

### translation_cache（翻訳キャッシュ）

```sql
CREATE TABLE translation_cache (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text     TEXT NOT NULL,
  source_language VARCHAR(10) NOT NULL,
  target_language VARCHAR(10) NOT NULL,
  translated_text TEXT NOT NULL,
  service_used    VARCHAR(50) NOT NULL DEFAULT 'google-translate',
  char_count      INTEGER NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_text, source_language, target_language)
);

CREATE INDEX idx_translation_cache_lookup
  ON translation_cache(source_text, source_language, target_language);
CREATE INDEX idx_translation_cache_created
  ON translation_cache(created_at DESC);
```

### translation_jobs（翻訳ジョブ）

```sql
CREATE TABLE translation_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name      TEXT NOT NULL,
  record_id       TEXT NOT NULL,
  column_name     TEXT NOT NULL,
  source_language VARCHAR(10) NOT NULL DEFAULT 'ja',
  target_language VARCHAR(10) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message   TEXT,
  attempts        INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  UNIQUE(table_name, record_id, column_name, target_language)
);

CREATE INDEX idx_translation_jobs_status
  ON translation_jobs(status, created_at);
CREATE INDEX idx_translation_jobs_table_record
  ON translation_jobs(table_name, record_id);
```

---

## 📝 備考

- **ENUM型**: `card_category`, `card_rarity_code`, `deck_category` などのENUM型は既存のまま維持
- **Full Text Search**: 日本語の全文検索は `to_tsvector('simple', ...)` を使用
- **RLS (Row Level Security)**: 既存のポリシーは維持し、多言語カラムに対しても同じポリシーを適用
- **Triggers**: `updated_at` 自動更新トリガーは既存のまま維持

---

**次のステップ**: このスキーマ情報をもとに、Phase 2の完全なマイグレーションSQLを作成します。

# Game8連携機能の設定

## 必要な環境変数

以下の環境変数を設定してください：

\`\`\`bash
# Game8連携機能の有効/無効
GAME8_ENABLED=true

# Game8のトレーナーID（数値）
GAME8_TRAINER_ID=495490

# Game8の記事ID（CSRF取得とReferer用）
GAME8_ARTICLE_ID=666311

# Game8の認証Cookie（DevToolsから取得）
GAME8_RAW_COOKIE="gtuid=bd69ae13-0bf3-401b-9fe8-e20c7c3cf088; switch_advertisement=2; ..."
\`\`\`

## Cookie取得方法

1. ブラウザでGame8にログイン
2. DevToolsを開く（F12）
3. Networkタブを開く
4. 任意のページをリロード
5. リクエストヘッダーからCookieをコピー

## 機能の動作

- トレード投稿にコメントが送信される
- `trade_posts.game8_post_id`が存在する場合のみ実行
- Game8への投稿が失敗してもメインのコメント投稿は成功扱い
- エラーはログに記録される

## トラブルシューティング

### よくあるエラー

1. **401/403エラー**: Cookie認証の問題
   - Cookieを再取得してください
   
2. **422エラー**: パラメータの検証エラー
   - trainer_idやarticle_idを確認してください
   
3. **タイムアウト**: ネットワークの問題
   - 一時的な問題の可能性があります

### ログの確認

サーバーログで以下のプレフィックスを検索：
- `[Game8]`: Game8関連のログ
- `[addComment]`: コメント投稿のログ

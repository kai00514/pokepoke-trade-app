# Info: 即時反映（revalidate）運用手順

目的
- 管理サイトで記事を公開/更新した直後に、/info（ダッシュボード）・/info/news（一覧）・該当の詳細ページを即時更新します。

エンドポイント
- Method: POST
- Path: /api/revalidate-info
- Auth: Authorization: Bearer <REVALIDATE_SECRET>
- Body: JSON
  - { "id": "<記事ID>" } （一覧のみ更新で良ければ id 省略可）

revalidate 対象
- /info
- /info/news
- /info/[id]
- /info/${id}

実行例（curl）
\`\`\`bash
curl -X POST "https://<your-domain>/api/revalidate-info" \
  -H "Authorization: Bearer ${REVALIDATE_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{"id":"<article-uuid>"}'
\`\`\`

備考
- このエンドポイントは Next.js の revalidatePath を用い、キャッシュを即時更新します（App Router）[^1][^2]。

運用フロー
1) 管理サイトで記事を保存し、is_published=true & published_at<=現在時刻 で公開。
2) 管理サイトから /api/revalidate-info に POST（必要であれば id を付与）。
3) エンドユーザの /info, /info/news, /info/{id} で最新状態が即時反映されます。

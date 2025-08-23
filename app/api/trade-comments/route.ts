// app/api/trade-comments/route.ts  (Next.js App Router)
import { NextResponse } from "next/server";
import { addCommentServer, getCommentsServer } from "@/lib/actions/trade-comments.server";
import { postCommentGame8, kickPostCommentGame8 } from "@/lib/server/game8Client";

const truthy = (v?: string | null) => /^(1|true|yes|on)$/i.test(v ?? "");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  if (!postId) return NextResponse.json({ success: false, error: "postId is required" }, { status: 400 });

  const result = await getCommentsServer(postId);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}

export async function POST(req: Request) {
  const payload = await req.json();

  // 1) まずDBに保存
  const result = await addCommentServer(
    payload.postId,
    payload.content,
    payload.userId,
    payload.userName,
    payload.isGuest,
    payload.guestId,
  );

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }

  // 2) Game8 投稿を起動
  const friendName =
    payload.userName ||
    (payload.isGuest ? "ゲスト" : "ユーザー") ||
    "ゲスト";

  if (truthy(process.env.GAME8_SYNC_ENABLED)) {
    // 同期（レスポンスを待たせる）
    const r = await postCommentGame8(payload.postId, payload.content, friendName);
    if (!r.ok) {
      console.error("[game8] sync post failed:", r.status, r.error, r.text?.slice(0, 500));
      // DBは成功しているため 200 で返すが、必要ならここで 202/207 なども検討
    }
  } else {
    // 非同期（おすすめ：ユーザーを待たせない）
    kickPostCommentGame8(payload.postId, payload.content, friendName);
  }

  // 3) クライアントへ即返却（UI はすぐ再取得へ）
  return NextResponse.json(result, { status: 200 });
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useBoardPost } from "@/entities/board/model/useBoards";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

export default function BoardDetailClient() {
  const params = useParams();
  const code = typeof params.code === "string" ? params.code : "";
  const id = typeof params.id === "string" ? Number(params.id) : 0;

  const { data: post, isLoading, isError } = useBoardPost(code, id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="space-y-4">
          <div className="h-8 w-3/4 animate-pulse rounded-xl bg-muted/50" />
          <div className="h-4 w-1/3 animate-pulse rounded-xl bg-muted/50" />
          <div className="h-64 animate-pulse rounded-2xl bg-muted/50" />
        </div>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href={`/boards/${code}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          목록으로
        </Link>
        <div className="mt-8 rounded-2xl border border-black/12 bg-card p-10 text-center text-sm text-muted-foreground">
          게시글을 불러올 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* 뒤로가기 */}
      <Link
        href={`/boards/${code}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        목록으로
      </Link>

      {/* 게시글 */}
      <article className="mt-4 rounded-2xl border border-black/12 bg-card shadow-sm">
        {/* 헤더 */}
        <header className="border-b border-black/8 px-6 py-5">
          <h1 className="text-2xl font-semibold text-foreground">{post.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{post.authorName ?? "익명"}</span>
            <span>·</span>
            <span>{formatDate(post.createdAt)}</span>
            <span>·</span>
            <span>조회 {post.viewCount}</span>
            {post.isPinned && (
              <>
                <span>·</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  공지
                </span>
              </>
            )}
            {post.isAnswered && (
              <>
                <span>·</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                  답변완료
                </span>
              </>
            )}
          </div>
        </header>

        {/* 본문 */}
        <div className="px-6 py-6">
          {post.content ? (
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {post.content}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">내용이 없습니다.</p>
          )}
        </div>
      </article>

      {/* 하단 목록 버튼 */}
      <div className="mt-4 flex justify-center">
        <Link
          href={`/boards/${code}`}
          className="rounded-full border border-black/15 px-5 py-2.5 text-sm hover:bg-muted transition-colors"
        >
          ← 목록으로
        </Link>
      </div>
    </div>
  );
}

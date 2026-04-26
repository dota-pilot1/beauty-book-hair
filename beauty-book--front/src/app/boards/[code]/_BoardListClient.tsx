"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Pin, ChevronLeft, ChevronRight } from "lucide-react";
import { useBoardPosts, useBoardConfigs } from "@/entities/board/model/useBoards";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

export default function BoardListClient() {
  const params = useParams();
  const code = typeof params.code === "string" ? params.code : "";
  const [page, setPage] = useState(0);

  const configsQuery = useBoardConfigs();
  const postsQuery = useBoardPosts(code, page);

  const config = configsQuery.data?.find((c) => c.code === code);
  const pageData = postsQuery.data;
  const posts = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;

  const isQA = config?.kind === "QA";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          홈으로
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
          {config?.displayName ?? code}
        </h1>
        {config?.description && (
          <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
        )}
      </div>

      {/* 게시글 목록 */}
      <div className="rounded-2xl border border-black/12 bg-card shadow-sm">
        {postsQuery.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/50" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            등록된 게시글이 없습니다.
          </div>
        ) : (
          <ul className="divide-y divide-black/8">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/boards/${code}/${post.id}`}
                  className="flex items-start gap-3 px-5 py-4 hover:bg-muted/30 transition-colors"
                >
                  {/* 핀 표시 */}
                  {post.isPinned && (
                    <Pin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {post.title}
                      </p>
                      {isQA && (
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                            post.isAnswered
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {post.isAnswered ? "답변완료" : "미답변"}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{post.authorName ?? "익명"}</span>
                      <span>·</span>
                      <span>{formatDate(post.createdAt)}</span>
                      <span>·</span>
                      <span>조회 {post.viewCount}</span>
                    </div>
                  </div>
                  {!post.isPinned && (
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-full border border-black/15 px-4 py-2 text-sm disabled:opacity-40 hover:bg-muted"
          >
            이전
          </button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-black/15 px-4 py-2 text-sm disabled:opacity-40 hover:bg-muted"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

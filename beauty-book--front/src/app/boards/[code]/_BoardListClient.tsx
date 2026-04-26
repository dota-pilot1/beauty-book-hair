"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Pencil, Pin } from "lucide-react";
import {
  useBoardPosts,
  useBoardConfigs,
  useCreateBoardPost,
} from "@/entities/board/model/useBoards";
import { useAuth } from "@/entities/user/model/authStore";

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
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { user } = useAuth();
  const configsQuery = useBoardConfigs();
  const postsQuery = useBoardPosts(code, page);
  const createPost = useCreateBoardPost(code);

  const config = configsQuery.data?.find((c) => c.code === code);
  const pageData = postsQuery.data;
  const posts = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;

  const isQA = config?.kind === "QA";
  const isAdmin = user?.role?.code === "ROLE_ADMIN";
  const canWrite = !!user && (isAdmin || config?.allowCustomerWrite);

  const handleSubmit = () => {
    if (!title.trim()) return;
    createPost.mutate(
      { title: title.trim(), content: content.trim() || undefined, status: "PUBLISHED" },
      {
        onSuccess: () => {
          setTitle("");
          setContent("");
          setShowForm(false);
        },
      }
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* 상단 헤더 */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            홈으로
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {config?.displayName ?? code}
          </h1>
          {config?.description && (
            <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
          )}
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Pencil className="h-4 w-4" />
            {showForm ? "닫기" : "글쓰기"}
          </button>
        )}
      </div>

      {/* 글쓰기 폼 */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-black/12 bg-card shadow-sm">
          <div className="border-b border-black/8 px-5 py-3">
            <p className="text-sm font-medium text-foreground">새 게시글 작성</p>
          </div>
          <div className="space-y-3 px-5 py-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="w-full rounded-xl border border-black/12 bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              rows={5}
              className="w-full resize-none rounded-xl border border-black/12 bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full border border-black/12 px-5 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                disabled={createPost.isPending || !title.trim()}
                onClick={handleSubmit}
                className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {createPost.isPending ? "등록 중…" : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 게시글 목록 */}
      <div className="rounded-2xl border border-black/12 bg-card shadow-sm">
        {postsQuery.isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/50" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            등록된 게시글이 없습니다.
          </div>
        ) : (
          <ul className="divide-y divide-black/8">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/boards/${code}/${post.id}`}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors"
                >
                  {post.isPinned && (
                    <Pin className="h-3.5 w-3.5 shrink-0 text-primary" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {post.isPinned && (
                          <span className="mr-1.5 inline-flex rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                            공지
                          </span>
                        )}
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
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
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

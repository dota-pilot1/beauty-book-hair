"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useBoardPost, useUpdateBoardPost, useDeleteBoardPost } from "@/entities/board/model/useBoards";
import { useAuth } from "@/entities/user/model/authStore";

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
  const router = useRouter();
  const code = typeof params.code === "string" ? params.code : "";
  const id = typeof params.id === "string" ? Number(params.id) : 0;

  const { user } = useAuth();
  const { data: post, isLoading, isError } = useBoardPost(code, id);
  const updatePost = useUpdateBoardPost();
  const deletePost = useDeleteBoardPost();

  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const isAdmin = user?.role?.name === "ADMIN";
  const isOwner = !!user && !!post && post.authorId === user.id;
  const canEdit = isAdmin || isOwner;

  const startEdit = () => {
    if (!post) return;
    setEditTitle(post.title);
    setEditContent(post.content ?? "");
    setEditMode(true);
  };

  const handleUpdate = () => {
    if (!editTitle.trim()) return;
    updatePost.mutate(
      { id, body: { title: editTitle.trim(), content: editContent.trim() || undefined } },
      { onSuccess: () => setEditMode(false) }
    );
  };

  const handleDelete = () => {
    if (!window.confirm("게시글을 삭제하시겠습니까?")) return;
    deletePost.mutate(id, {
      onSuccess: () => router.push(`/boards/${code}`),
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
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
      <div className="mx-auto max-w-5xl px-4 py-8">
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
    <div className="mx-auto max-w-5xl px-4 py-8">
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
          {editMode ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-xl border border-black/12 bg-background px-4 py-2.5 text-xl font-semibold outline-none focus:border-primary"
            />
          ) : (
            <h1 className="text-2xl font-semibold text-foreground">{post.title}</h1>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{post.authorName ?? "익명"}</span>
              <span>·</span>
              <span>{formatDate(post.createdAt)}</span>
              <span>·</span>
              <span>조회 {post.viewCount}</span>
              {post.isPinned && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  공지
                </span>
              )}
              {post.isAnswered && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                  답변완료
                </span>
              )}
            </div>
            {canEdit && !editMode && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startEdit}
                  className="rounded-full border border-black/12 px-4 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  수정
                </button>
                <button
                  type="button"
                  disabled={deletePost.isPending}
                  onClick={handleDelete}
                  className="rounded-full border border-rose-200 px-4 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </header>

        {/* 본문 */}
        <div className="px-6 py-6">
          {editMode ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={10}
                className="w-full resize-none rounded-xl border border-black/12 bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="rounded-full border border-black/12 px-5 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={updatePost.isPending || !editTitle.trim()}
                  onClick={handleUpdate}
                  className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {updatePost.isPending ? "저장 중…" : "저장"}
                </button>
              </div>
            </div>
          ) : post.content ? (
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

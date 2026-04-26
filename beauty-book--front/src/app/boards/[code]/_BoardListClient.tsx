"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Pencil, Pin, MessageSquare } from "lucide-react";
import {
  useBoardPosts,
  useBoardConfigs,
  useBoardPost,
  useCreateBoardPost,
  useUpdateBoardPost,
  useDeleteBoardPost,
} from "@/entities/board/model/useBoards";
import { useAuth } from "@/entities/user/model/authStore";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

// ── 오른쪽 상세 패널 ─────────────────────────────────────────────────────────

function DetailPanel({
  code,
  postId,
  canEdit,
  onDeleted,
}: {
  code: string;
  postId: number;
  canEdit: boolean;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const { data: post, isLoading, isError } = useBoardPost(code, postId);
  const updatePost = useUpdateBoardPost();
  const deletePost = useDeleteBoardPost();

  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const startEdit = () => {
    if (!post) return;
    setEditTitle(post.title);
    setEditContent(post.content ?? "");
    setEditMode(true);
  };

  const handleUpdate = () => {
    if (!editTitle.trim()) return;
    updatePost.mutate(
      { id: postId, body: { title: editTitle.trim(), content: editContent.trim() || undefined } },
      { onSuccess: () => setEditMode(false) }
    );
  };

  const handleDelete = () => {
    if (!window.confirm("게시글을 삭제하시겠습니까?")) return;
    deletePost.mutate(postId, { onSuccess: onDeleted });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-8">
        <div className="h-7 w-2/3 animate-pulse rounded-xl bg-muted/50" />
        <div className="h-4 w-1/3 animate-pulse rounded-xl bg-muted/50" />
        <div className="mt-6 h-48 animate-pulse rounded-2xl bg-muted/50" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
        게시글을 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* 게시글 헤더 */}
      <div className="border-b border-black/8 px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {post.isPinned && (
              <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <Pin className="h-3 w-3" /> 중요 공지
              </span>
            )}
            {editMode ? (
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/12 bg-background px-4 py-2.5 text-xl font-semibold outline-none focus:border-primary"
              />
            ) : (
              <h2 className="mt-1 text-xl font-semibold leading-snug text-foreground">
                {post.title}
              </h2>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{post.authorName ?? "익명"}</span>
              <span>·</span>
              <span>{formatDateTime(post.createdAt)}</span>
              <span>·</span>
              <span>조회 {post.viewCount}</span>
            </div>
          </div>
          {canEdit && !editMode && (
            <div className="flex shrink-0 items-center gap-2">
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
      </div>

      {/* 본문 */}
      <div className="flex-1 px-8 py-6">
        {editMode ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={12}
              className="w-full resize-none rounded-xl border border-black/12 bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="rounded-full border border-black/12 px-5 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                취소
              </button>
              <button
                type="button"
                disabled={updatePost.isPending || !editTitle.trim()}
                onClick={handleUpdate}
                className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:opacity-90"
              >
                {updatePost.isPending ? "저장 중…" : "저장"}
              </button>
            </div>
          </div>
        ) : post.content ? (
          <div className="max-w-2xl whitespace-pre-wrap text-sm leading-7 text-foreground">
            {post.content}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">내용이 없습니다.</p>
        )}
      </div>

      {/* 댓글 영역 플레이스홀더 */}
      <div className="border-t border-black/8 px-8 py-5">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          댓글 <span className="text-xs text-muted-foreground/60">(Phase 2)</span>
        </div>
      </div>
    </div>
  );
}

// ── 빈 상태 (아무것도 선택 안 됨) ─────────────────────────────────────────────

function EmptyDetail() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
        <MessageSquare className="h-6 w-6 text-muted-foreground/40" />
      </div>
      <p className="text-sm text-muted-foreground">왼쪽 목록에서 게시글을 선택하세요</p>
    </div>
  );
}

// ── 글쓰기 폼 ─────────────────────────────────────────────────────────────────

function WriteForm({
  code,
  onClose,
}: {
  code: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const createPost = useCreateBoardPost(code);

  const handleSubmit = () => {
    if (!title.trim()) return;
    createPost.mutate(
      { title: title.trim(), content: content.trim() || undefined, status: "PUBLISHED" },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="border-b border-black/8 bg-muted/20 px-5 py-4 space-y-3">
      <p className="text-xs font-medium text-muted-foreground">새 게시글</p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
        className="w-full rounded-xl border border-black/12 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="내용"
        rows={4}
        className="w-full resize-none rounded-xl border border-black/12 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-black/12 px-4 py-1.5 text-xs text-muted-foreground hover:bg-muted"
        >
          취소
        </button>
        <button
          type="button"
          disabled={createPost.isPending || !title.trim()}
          onClick={handleSubmit}
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50 hover:opacity-90"
        >
          {createPost.isPending ? "등록 중…" : "등록"}
        </button>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function BoardListClient() {
  const params = useParams();
  const code = typeof params.code === "string" ? params.code : "";

  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showWrite, setShowWrite] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  const { user } = useAuth();
  const configsQuery = useBoardConfigs();
  const postsQuery = useBoardPosts(code, page);

  const config = configsQuery.data?.find((c) => c.code === code);
  const pageData = postsQuery.data;
  const posts = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;

  const isAdmin = user?.role?.code === "ROLE_ADMIN";
  const canWrite = !!user && (isAdmin || config?.allowCustomerWrite);

  const handleSelect = (id: number) => {
    setSelectedId(id);
    setMobileView("detail");
    setShowWrite(false);
  };

  const handleDeleted = () => {
    setSelectedId(null);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-0 px-4 py-6">
      {/* 페이지 헤더 */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* 모바일: 상세에서 목록으로 */}
          {mobileView === "detail" && (
            <button
              type="button"
              onClick={() => setMobileView("list")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:hidden"
            >
              <ChevronLeft className="h-4 w-4" />
              목록
            </button>
          )}
          {mobileView === "list" && (
            <Link
              href="/"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              홈으로
            </Link>
          )}
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {config?.displayName ?? code}
            </h1>
            {config?.description && (
              <p className="text-xs text-muted-foreground">{config.description}</p>
            )}
          </div>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => { setShowWrite((v) => !v); setMobileView("list"); }}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Pencil className="h-3.5 w-3.5" />
            {showWrite ? "닫기" : "글쓰기"}
          </button>
        )}
      </div>

      {/* Split-view 컨테이너 */}
      <div className="overflow-hidden rounded-2xl border border-black/12 bg-card shadow-sm">
        <div className="flex" style={{ minHeight: "560px" }}>
          {/* ── 왼쪽 목록 패널 ── */}
          <div
            className={`flex w-full flex-col border-r border-black/8 lg:w-[340px] lg:shrink-0 ${
              mobileView === "detail" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* 글쓰기 폼 */}
            {showWrite && (
              <WriteForm code={code} onClose={() => setShowWrite(false)} />
            )}

            {/* 목록 */}
            <div className="flex-1 overflow-y-auto">
              {postsQuery.isLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/50" />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                  등록된 게시글이 없습니다.
                </div>
              ) : (
                <ul className="divide-y divide-black/6">
                  {posts.map((post) => {
                    const isSelected = post.id === selectedId;
                    return (
                      <li key={post.id}>
                        <button
                          type="button"
                          onClick={() => handleSelect(post.id)}
                          className={`w-full px-4 py-3.5 text-left transition-colors ${
                            isSelected
                              ? "bg-primary/8 border-l-2 border-primary"
                              : "border-l-2 border-transparent hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {post.isPinned && (
                              <Pin className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                {post.isPinned && (
                                  <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                    공지
                                  </span>
                                )}
                                <p
                                  className={`truncate text-sm font-medium ${
                                    isSelected ? "text-primary" : "text-foreground"
                                  }`}
                                >
                                  {post.title}
                                </p>
                              </div>
                              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <span>{post.authorName ?? "익명"}</span>
                                <span>·</span>
                                <span>{formatDate(post.createdAt)}</span>
                                <span>·</span>
                                <span>조회 {post.viewCount}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 border-t border-black/8 px-4 py-3">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded-lg border border-black/12 px-3 py-1.5 text-xs disabled:opacity-40 hover:bg-muted"
                >
                  이전
                </button>
                <span className="text-xs text-muted-foreground">
                  {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-black/12 px-3 py-1.5 text-xs disabled:opacity-40 hover:bg-muted"
                >
                  다음
                </button>
              </div>
            )}
          </div>

          {/* ── 오른쪽 상세 패널 ── */}
          <div
            className={`flex-1 ${
              mobileView === "list" ? "hidden lg:block" : "block"
            }`}
          >
            {selectedId ? (
              <DetailPanel
                key={selectedId}
                code={code}
                postId={selectedId}
                canEdit={isAdmin}
                onDeleted={handleDeleted}
              />
            ) : (
              <EmptyDetail />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

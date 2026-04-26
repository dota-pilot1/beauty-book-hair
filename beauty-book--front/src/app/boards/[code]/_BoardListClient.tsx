"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Pencil, Pin, MessageSquare, Trash2, LayoutList } from "lucide-react";
import { LexicalEditor } from "@/shared/ui/lexical/lexical-editor";
import {
  useBoardPosts,
  useBoardConfigs,
  useBoardPost,
  useCreateBoardPost,
  useUpdateBoardPost,
  useDeleteBoardPost,
  useBoardComments,
  useCreateComment,
  useDeleteComment,
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

// ── 댓글 섹션 ─────────────────────────────────────────────────────────────────

function CommentSection({ boardId, isAdmin, userId }: { boardId: number; isAdmin: boolean; userId?: number }) {
  const { data: comments = [], isLoading } = useBoardComments(boardId);
  const createComment = useCreateComment(boardId);
  const deleteComment = useDeleteComment(boardId);
  const [text, setText] = useState("");
  const { user } = useAuth();

  const handleSubmit = () => {
    if (!text.trim()) return;
    createComment.mutate(text.trim(), { onSuccess: () => setText("") });
  };

  return (
    <div className="border-t border-border">
      {/* 댓글 헤더 */}
      <div className="flex items-center gap-2 px-6 py-4">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          댓글 <span className="text-xs text-muted-foreground">{comments.length}</span>
        </span>
      </div>

      {/* 댓글 목록 */}
      {isLoading ? (
        <div className="space-y-2 px-6 pb-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="px-6 pb-4 text-xs text-muted-foreground">첫 댓글을 남겨보세요.</p>
      ) : (
        <ul className="space-y-1 px-6 pb-4">
          {comments.map((c) => (
            <li key={c.id} className="group flex items-start gap-3 rounded-xl bg-muted/30 px-4 py-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {c.authorName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{c.authorName}</span>
                  {c.isAdminReply && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      관리자
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground">{formatDate(c.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-sm text-foreground/80 leading-relaxed">{c.content}</p>
              </div>
              {(isAdmin || c.authorId === userId) && (
                <button
                  type="button"
                  onClick={() => deleteComment.mutate(c.id)}
                  className="shrink-0 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* 댓글 작성 */}
      {user ? (
        <div className="flex items-end gap-3 border-t border-border px-6 py-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="댓글을 입력하세요..."
            rows={2}
            className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
            }}
          />
          <button
            type="button"
            disabled={createComment.isPending || !text.trim()}
            onClick={handleSubmit}
            className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:opacity-90"
          >
            등록
          </button>
        </div>
      ) : (
        <p className="border-t border-border px-6 py-4 text-xs text-muted-foreground">
          댓글을 작성하려면 로그인이 필요합니다.
        </p>
      )}
    </div>
  );
}

// ── 상세 패널 ─────────────────────────────────────────────────────────────────

function DetailPanel({
  code, postId, isAdmin, userId, onDeleted,
}: {
  code: string; postId: number; isAdmin: boolean; userId?: number; onDeleted: () => void;
}) {
  const { data: post, isLoading, isError } = useBoardPost(code, postId);
  const updatePost = useUpdateBoardPost();
  const deletePost = useDeleteBoardPost();

  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const isOwner = !!userId && !!post && post.authorId === userId;
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
      <div className="space-y-3 p-6">
        <div className="h-6 w-2/3 animate-pulse rounded-xl bg-muted/50" />
        <div className="h-4 w-1/3 animate-pulse rounded-xl bg-muted/50" />
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-muted/50" />
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
      {/* 헤더 */}
      <div className="border-b border-border px-6 py-5">
        {post.isPinned && (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <Pin className="h-3 w-3" /> 중요 공지
            </span>
          </div>
        )}
        {editMode ? (
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xl font-semibold outline-none focus:border-primary"
          />
        ) : (
          <h2 className="text-xl font-semibold leading-snug text-foreground">{post.title}</h2>
        )}
        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">{post.authorName ?? "익명"}</span>
            <span>·</span>
            <span>{formatDateTime(post.createdAt)}</span>
            <span>·</span>
            <span>조회 {post.viewCount}</span>
          </div>
          {canEdit && !editMode && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={startEdit}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                수정
              </button>
              <button
                type="button"
                disabled={deletePost.isPending}
                onClick={handleDelete}
                className="rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 px-6 py-4">
        {editMode ? (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-xl border border-border">
              <LexicalEditor
                key={`edit-${postId}`}
                initialState={editContent}
                onChange={setEditContent}
                minHeight="240px"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditMode(false)}
                className="rounded-full border border-border px-5 py-2 text-sm text-muted-foreground hover:bg-muted">
                취소
              </button>
              <button type="button" disabled={updatePost.isPending || !editTitle.trim()} onClick={handleUpdate}
                className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:opacity-90">
                {updatePost.isPending ? "저장 중…" : "저장"}
              </button>
            </div>
          </div>
        ) : post.content ? (
          <LexicalEditor
            key={`view-${postId}`}
            initialState={post.content}
            readOnly
            minHeight="0px"
          />
        ) : (
          <p className="text-sm text-muted-foreground">내용이 없습니다.</p>
        )}
      </div>

      {/* 댓글 */}
      <CommentSection boardId={postId} isAdmin={isAdmin} userId={userId} />
    </div>
  );
}

// ── 빈 상태 ───────────────────────────────────────────────────────────────────

function EmptyDetail() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
        <MessageSquare className="h-6 w-6 text-muted-foreground/40" />
      </div>
      <p className="text-sm text-muted-foreground">왼쪽에서 게시글을 선택하세요</p>
    </div>
  );
}

// ── 글쓰기 폼 ─────────────────────────────────────────────────────────────────

function WriteForm({ code, onClose }: { code: string; onClose: () => void }) {
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
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* 폼 헤더 */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <p className="text-base font-semibold text-foreground">새 게시글 작성</p>
        <button type="button" onClick={onClose}
          className="rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors">
          취소
        </button>
      </div>
      {/* 제목 */}
      <div className="border-b border-border px-6 py-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          autoFocus
          className="w-full bg-transparent text-lg font-medium text-foreground placeholder:text-muted-foreground/50 outline-none"
        />
      </div>
      {/* 본문 */}
      <div className="overflow-hidden rounded-b-none">
        <LexicalEditor
          onChange={setContent}
          placeholder="내용을 입력하세요"
          minHeight="320px"
        />
      </div>
      {/* 액션 */}
      <div className="flex justify-end border-t border-border px-6 py-4">
        <button
          type="button"
          disabled={createPost.isPending || !title.trim()}
          onClick={handleSubmit}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {createPost.isPending ? "등록 중…" : "등록하기"}
        </button>
      </div>
    </div>
  );
}

// ── 메인 ──────────────────────────────────────────────────────────────────────

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
  const posts = postsQuery.data?.content ?? [];
  const totalPages = postsQuery.data?.totalPages ?? 0;

  const isAdmin = user?.role?.code === "ROLE_ADMIN";
  const canWrite = !!user && (isAdmin || config?.allowCustomerWrite);

  return (
    <div className="mx-auto flex max-w-7xl flex-col">
      {/* Breadcrumb + 페이지 헤더 */}
      <div className="border-b border-border bg-background px-6 py-4">
        {/* Breadcrumb */}
        <nav className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          {mobileView === "detail" ? (
            <button type="button" onClick={() => setMobileView("list")}
              className="flex items-center gap-1 hover:text-foreground transition-colors lg:hidden">
              <ChevronLeft className="h-3.5 w-3.5" /> 목록
            </button>
          ) : (
            <>
              <Link href="/" className="hover:text-foreground transition-colors">홈</Link>
              <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
              <span className="text-muted-foreground/60">게시판</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
              <span className="font-medium text-foreground">{config?.displayName ?? code}</span>
            </>
          )}
        </nav>

        {/* 타이틀 행 */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <LayoutList className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight tracking-tight text-foreground">
                {config?.displayName ?? code}
              </h1>
              {config?.description && (
                <p className="text-xs text-muted-foreground leading-none mt-0.5">{config.description}</p>
              )}
            </div>
          </div>
          {canWrite && (
            <button type="button"
              onClick={() => { setShowWrite((v) => !v); setMobileView("list"); }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
              <Pencil className="h-3.5 w-3.5" />
              {showWrite ? "닫기" : "글쓰기"}
            </button>
          )}
        </div>
      </div>

      {/* 글쓰기 폼 — 풀 와이드 */}
      {showWrite && (
        <div className="p-6">
          <WriteForm code={code} onClose={() => setShowWrite(false)} />
        </div>
      )}

      {/* Split-view */}
      {!showWrite && (
      <div className="flex flex-1" style={{ minHeight: "640px" }}>
        {/* 왼쪽 목록 */}
        <div className={`flex w-full flex-col border-r border-border lg:w-[40%] lg:shrink-0 ${mobileView === "detail" ? "hidden lg:flex" : "flex"}`}>

          {/* 컬럼 헤더 */}
          <div className="flex items-center bg-muted/40 border-b border-border px-5 py-2">
            <span className="w-8 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">No.</span>
            <span className="flex-1 pl-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">제목</span>
            <span className="w-14 shrink-0 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">날짜</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {postsQuery.isLoading ? (
              <div className="divide-y divide-border">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="h-3 w-5 animate-pulse rounded bg-muted" />
                    <div className="h-3 flex-1 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-10 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <LayoutList className="h-8 w-8 text-muted-foreground/30" />
                등록된 게시글이 없습니다.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {posts.map((post, idx) => {
                  const active = post.id === selectedId;
                  const rowNum = postsQuery.data
                    ? postsQuery.data.totalElements - (page * 20 + idx)
                    : idx + 1;
                  return (
                    <li key={post.id}>
                      <button
                        type="button"
                        onClick={() => { setSelectedId(post.id); setMobileView("detail"); setShowWrite(false); }}
                        className={`group flex w-full items-center px-5 py-3.5 text-left transition-colors ${
                          active ? "bg-primary/8 border-l-2 border-l-primary" : "hover:bg-muted/50 border-l-2 border-l-transparent"
                        }`}
                      >
                        {/* 번호 or 공지 */}
                        <span className="w-8 shrink-0 text-center">
                          {post.isPinned ? (
                            <span className="inline-flex items-center justify-center rounded px-1 py-0.5 bg-primary/15 text-[9px] font-bold text-primary">
                              공지
                            </span>
                          ) : (
                            <span className={`text-xs tabular-nums ${active ? "text-primary/60" : "text-muted-foreground/50"}`}>{rowNum}</span>
                          )}
                        </span>

                        {/* 제목 */}
                        <div className="min-w-0 flex-1 pl-2">
                          <p className={`truncate text-sm leading-snug ${
                            active ? "font-semibold text-primary" : post.isPinned ? "font-medium text-foreground" : "text-foreground/85 group-hover:text-foreground"
                          }`}>
                            {post.title}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70">
                            {post.authorName ?? "익명"}
                          </p>
                        </div>

                        {/* 날짜 */}
                        <span className={`w-14 shrink-0 text-right text-[11px] tabular-nums ${active ? "text-primary/60" : "text-muted-foreground/60"}`}>
                          {formatDate(post.createdAt).replace(/\d{4}\. /, "")}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-2.5">
              <span className="text-xs text-muted-foreground">{page + 1} / {totalPages} 페이지</span>
              <div className="flex items-center gap-1">
                <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="flex h-7 items-center gap-0.5 rounded-md border border-border px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40">
                  <ChevronLeft className="h-3 w-3" /> 이전
                </button>
                <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}
                  className="flex h-7 items-center gap-0.5 rounded-md border border-border px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40">
                  다음 <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽 상세 */}
        <div className={`flex-1 bg-card ${mobileView === "list" ? "hidden lg:block" : "block"}`}>
          {selectedId ? (
            <DetailPanel key={selectedId} code={code} postId={selectedId} isAdmin={isAdmin} userId={user?.id} onDeleted={() => setSelectedId(null)} />
          ) : (
            <EmptyDetail />
          )}
        </div>
      </div>
      )}
    </div>
  );
}

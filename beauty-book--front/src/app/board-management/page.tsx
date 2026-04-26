"use client";

import { useState } from "react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { AdminShell } from "@/shared/ui/admin/AdminShell";
import {
  useAdminBoardConfigs,
  useAdminBoardPosts,
  useCreateBoardConfig,
  useCreateBoardPost,
  useDeleteBoardPost,
  usePinBoardPost,
  useUnpinBoardPost,
} from "@/entities/board/model/useBoards";
import type { BoardKind, BoardStatus } from "@/entities/board/model/types";

// ── 상태/kind 뱃지 ───────────────────────────────────────────────────────────

const STATUS_BADGE: Record<BoardStatus, { label: string; className: string }> = {
  PUBLISHED: { label: "공개",   className: "bg-emerald-100 text-emerald-700" },
  PENDING:   { label: "검토중", className: "bg-amber-100 text-amber-700" },
  HIDDEN:    { label: "숨김",   className: "bg-rose-100 text-rose-700" },
  DRAFT:     { label: "임시저장", className: "bg-muted text-muted-foreground" },
};

const KIND_BADGE: Record<BoardKind, { label: string; className: string }> = {
  NOTICE:    { label: "공지",     className: "bg-blue-100 text-blue-700" },
  COMMUNITY: { label: "커뮤니티", className: "bg-green-100 text-green-700" },
  QA:        { label: "Q&A",      className: "bg-purple-100 text-purple-700" },
  FAQ:       { label: "FAQ",      className: "bg-orange-100 text-orange-700" },
  GALLERY:   { label: "갤러리",   className: "bg-pink-100 text-pink-700" },
};

const BOARD_KINDS: BoardKind[] = ["NOTICE", "COMMUNITY", "QA", "FAQ", "GALLERY"];
const BOARD_STATUSES: BoardStatus[] = ["PUBLISHED", "PENDING", "DRAFT", "HIDDEN"];

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

// ── 게시판 설정 섹션 ─────────────────────────────────────────────────────────

function BoardConfigSection({ onSelectCode }: { onSelectCode: (code: string) => void }) {
  const { data: configs = [], isLoading } = useAdminBoardConfigs();
  const createConfig = useCreateBoardConfig();

  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<BoardKind>("NOTICE");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!code.trim() || !displayName.trim()) return;
    createConfig.mutate(
      {
        code: code.trim(),
        kind,
        displayName: displayName.trim(),
        description: description.trim() || undefined,
        allowCustomerWrite: false,
        allowComment: false,
        sortOrder: configs.length,
      },
      {
        onSuccess: () => {
          setCode("");
          setKind("NOTICE");
          setDisplayName("");
          setDescription("");
          setShowForm(false);
        },
      }
    );
  };

  return (
    <section className="rounded-2xl border border-black/12 bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-black/8 px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">게시판 설정</h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          {showForm ? "닫기" : "게시판 추가"}
        </button>
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <div className="border-b border-black/8 bg-muted/30 px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">코드</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="예: notice"
                className="w-full rounded-xl border border-black/12 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">종류</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as BoardKind)}
                className="w-full rounded-xl border border-black/12 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {BOARD_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_BADGE[k].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">게시판명</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="예: 공지사항"
                className="w-full rounded-xl border border-black/12 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">설명 (선택)</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="간단한 설명"
                className="w-full rounded-xl border border-black/12 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={createConfig.isPending || !code.trim() || !displayName.trim()}
              onClick={handleSubmit}
              className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:opacity-90"
            >
              {createConfig.isPending ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      )}

      {/* 게시판 목록 */}
      <div className="divide-y divide-black/8">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse mx-5 my-3 rounded-xl bg-muted/50" />
          ))
        ) : configs.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            등록된 게시판이 없습니다.
          </p>
        ) : (
          configs.map((config) => {
            const kb = KIND_BADGE[config.kind];
            return (
              <div key={config.id} className="flex items-center gap-3 px-5 py-3.5">
                <code className="shrink-0 rounded-lg bg-muted px-2 py-1 text-xs font-mono text-muted-foreground">
                  {config.code}
                </code>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${kb.className}`}
                >
                  {kb.label}
                </span>
                <span className="flex-1 text-sm font-medium text-foreground">
                  {config.displayName}
                </span>
                {!config.isActive && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700">
                    비활성
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onSelectCode(config.code)}
                  className="shrink-0 rounded-full border border-black/12 px-4 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  게시글 보기
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

// ── 게시글 관리 섹션 ─────────────────────────────────────────────────────────

function BoardPostSection({ selectedCode }: { selectedCode: string }) {
  const { data: pageData, isLoading } = useAdminBoardPosts(selectedCode);
  const createPost = useCreateBoardPost(selectedCode);
  const deletePost = useDeleteBoardPost();
  const pinPost = usePinBoardPost();
  const unpinPost = useUnpinBoardPost();

  const posts = pageData?.content ?? [];

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<BoardStatus>("PUBLISHED");

  const handleCreate = () => {
    if (!title.trim()) return;
    createPost.mutate(
      { title: title.trim(), content: content.trim() || undefined, status },
      {
        onSuccess: () => {
          setTitle("");
          setContent("");
          setStatus("PUBLISHED");
          setShowForm(false);
        },
      }
    );
  };

  return (
    <section className="rounded-2xl border border-black/12 bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-black/8 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">게시글 관리</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            게시판 코드:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{selectedCode}</code>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          {showForm ? "닫기" : "게시글 작성"}
        </button>
      </div>

      {/* 작성 폼 */}
      {showForm && (
        <div className="border-b border-black/8 bg-muted/30 px-5 py-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="게시글 제목을 입력하세요"
              className="w-full rounded-xl border border-black/12 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">본문</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="본문 내용을 입력하세요"
              rows={4}
              className="w-full resize-none rounded-xl border border-black/12 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">상태</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BoardStatus)}
                className="rounded-xl border border-black/12 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {BOARD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_BADGE[s].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1" />
            <button
              type="button"
              disabled={createPost.isPending || !title.trim()}
              onClick={handleCreate}
              className="self-end rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:opacity-90"
            >
              {createPost.isPending ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      )}

      {/* 게시글 테이블 */}
      {isLoading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">
          등록된 게시글이 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/8 bg-muted/20">
                <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">제목</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">상태</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">핀</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">작성일</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">액션</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const sb = STATUS_BADGE[post.status];
                return (
                  <tr key={post.id} className="border-b border-black/8 hover:bg-muted/20 transition-colors">
                    <td className="max-w-xs truncate px-5 py-3 text-sm font-medium text-foreground">
                      {post.title}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${sb.className}`}>
                        {sb.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {post.isPinned ? (
                        <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          고정
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {post.isPinned ? (
                          <button
                            type="button"
                            disabled={unpinPost.isPending}
                            onClick={() => unpinPost.mutate(post.id)}
                            className="rounded-lg border border-black/12 px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-40"
                          >
                            고정해제
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={pinPost.isPending}
                            onClick={() => pinPost.mutate(post.id)}
                            className="rounded-lg border border-black/12 px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-40"
                          >
                            고정
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={deletePost.isPending}
                          onClick={() => {
                            if (window.confirm("게시글을 삭제하시겠습니까?")) {
                              deletePost.mutate(post.id);
                            }
                          }}
                          className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ── 메인 페이지 ──────────────────────────────────────────────────────────────

export default function BoardManagementPage() {
  return (
    <RequireAuth>
      <BoardManagementInner />
    </RequireAuth>
  );
}

function BoardManagementInner() {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  return (
    <AdminShell
      eyebrow="Admin"
      title="게시판 관리"
      description="게시판 설정과 게시글을 관리합니다."
    >
      <div className="space-y-6">
        <BoardConfigSection onSelectCode={setSelectedCode} />
        {selectedCode && <BoardPostSection selectedCode={selectedCode} />}
      </div>
    </AdminShell>
  );
}

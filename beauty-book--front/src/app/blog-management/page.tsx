"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Pencil, Tag, FolderOpen } from "lucide-react";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { AdminShell } from "@/shared/ui/admin/AdminShell";
import {
  useAdminBlogPosts,
  useDeleteBlogPost,
  useBlogTags,
  useCreateBlogTag,
  useDeleteBlogTag,
  useBlogCategories,
  useCreateBlogCategory,
  useDeleteBlogCategory,
} from "@/entities/blog/model/useBlog";
import { blogApi } from "@/entities/blog/api/blogApi";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

// ── 태그 관리 섹션 ─────────────────────────────────────────────────────────────

function TagManagementSection() {
  const { data: tags = [] } = useBlogTags();
  const createTag = useCreateBlogTag();
  const deleteTag = useDeleteBlogTag();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const handleNameChange = async (value: string) => {
    setName(value);
    if (value.trim()) {
      try {
        const suggested = await blogApi.suggestSlug(value);
        setSlug(suggested);
      } catch {
        // 무시
      }
    }
  };

  const handleCreate = () => {
    if (!name.trim() || !slug.trim()) return;
    createTag.mutate(
      { name: name.trim(), slug: slug.trim() },
      {
        onSuccess: () => {
          setName("");
          setSlug("");
        },
      }
    );
  };

  return (
    <section className="rounded-2xl border border-black/10 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-semibold text-foreground">태그 관리</h2>
      </div>

      {/* 태그 목록 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.length === 0 ? (
          <p className="text-xs text-muted-foreground">등록된 태그가 없습니다.</p>
        ) : (
          tags.map((tag) => (
            <span
              key={tag.id}
              className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs"
            >
              {tag.name}
              <span className="text-muted-foreground/50">({tag.slug})</span>
              <button
                onClick={() => deleteTag.mutate(tag.id)}
                className="ml-0.5 text-muted-foreground/50 hover:text-destructive transition-colors"
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      {/* 태그 추가 폼 */}
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="태그명 (예: 커트)"
          className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="slug (예: cut)"
          className="h-9 w-36 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={handleCreate}
          disabled={createTag.isPending || !name.trim() || !slug.trim()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          추가
        </button>
      </div>
    </section>
  );
}

// ── 카테고리 관리 섹션 ────────────────────────────────────────────────────────

function CategoryManagementSection() {
  const { data: categories = [] } = useBlogCategories();
  const createCategory = useCreateBlogCategory();
  const deleteCategory = useDeleteBlogCategory();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [order, setOrder] = useState(0);

  const handleCreate = () => {
    if (!name.trim() || !slug.trim()) return;
    createCategory.mutate(
      { name: name.trim(), slug: slug.trim(), displayOrder: order },
      {
        onSuccess: () => {
          setName("");
          setSlug("");
          setOrder(0);
        },
      }
    );
  };

  return (
    <section className="rounded-2xl border border-black/10 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-semibold text-foreground">카테고리 관리</h2>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {categories.length === 0 ? (
          <p className="text-xs text-muted-foreground">등록된 카테고리가 없습니다.</p>
        ) : (
          categories.map((cat) => (
            <span
              key={cat.id}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-sm"
            >
              <span className="font-medium">{cat.name}</span>
              <span className="text-muted-foreground/50 text-xs">({cat.slug})</span>
              <button
                onClick={() => deleteCategory.mutate(cat.id)}
                className="ml-0.5 text-muted-foreground/50 hover:text-destructive transition-colors"
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="카테고리명 (예: 헤어팁)"
          className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="slug (예: hair-tip)"
          className="h-9 w-36 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="number"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          placeholder="순서"
          className="h-9 w-20 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={handleCreate}
          disabled={createCategory.isPending || !name.trim() || !slug.trim()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          추가
        </button>
      </div>
    </section>
  );
}

// ── 포스트 목록 섹션 ──────────────────────────────────────────────────────────

function PostListSection() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useAdminBlogPosts(page);
  const deletePost = useDeleteBlogPost();

  const posts = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <section className="rounded-2xl border border-black/10 bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/8">
        <h2 className="text-base font-semibold text-foreground">포스트 목록</h2>
        <Link
          href="/blog-management/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          새 포스트
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          등록된 포스트가 없습니다.
        </p>
      ) : (
        <div className="divide-y divide-black/8">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-4 px-6 py-3 hover:bg-muted/20 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{post.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {post.authorName && <span>{post.authorName} · </span>}
                  {formatDate(post.createdAt)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  post.status === "PUBLISHED"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {post.status === "PUBLISHED" ? "발행" : "임시저장"}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={`/blog-management/${post.id}/edit`}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={() => {
                    if (confirm("포스트를 삭제하시겠습니까?")) {
                      deletePost.mutate(post.id);
                    }
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 px-6 py-4 border-t border-black/8">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`h-7 w-7 rounded-full text-xs font-medium transition-colors ${
                i === page
                  ? "bg-foreground text-background"
                  : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

// ── 페이지 ─────────────────────────────────────────────────────────────────────

export default function BlogManagementPage() {
  return (
    <RequireAuth>
      <AdminShell
        eyebrow="Admin"
        title="블로그 관리"
        description="헤어 다이어리 포스트와 태그를 관리합니다."
      >
        <div className="space-y-6">
          <CategoryManagementSection />
          <TagManagementSection />
          <PostListSection />
        </div>
      </AdminShell>
    </RequireAuth>
  );
}

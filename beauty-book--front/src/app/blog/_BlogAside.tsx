"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Flame, Tag, Settings, Plus, X, Loader2 } from "lucide-react";
import { useBlogCategories, useBlogPopularPosts, useCreateBlogCategory, useDeleteBlogCategory } from "@/entities/blog/model/useBlog";
import { useAuth } from "@/entities/user/model/authStore";

type Props = {
  selectedCategory?: string;
  onCategoryClick?: (slug: string | undefined) => void;
};

function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "category";
}

export function BlogAside({ selectedCategory, onCategoryClick }: Props) {
  const { data: categories = [] } = useBlogCategories();
  const { data: popularPosts = [] } = useBlogPopularPosts();
  const createCategory = useCreateBlogCategory();
  const deleteCategory = useDeleteBlogCategory();
  const { user } = useAuth();

  const canManage = user?.role?.code === "ROLE_ADMIN" || user?.role?.code === "ROLE_MANAGER";

  const [managing, setManaging] = useState(false);
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    const slug = toSlug(name);
    const displayOrder = categories.length;
    createCategory.mutate(
      { name, slug, displayOrder },
      { onSuccess: () => setNewName("") }
    );
  };

  return (
    <div className="space-y-4">
      {/* 카테고리 */}
      <div className="rounded-2xl border border-black/8 bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">카테고리</p>
          </div>
          {canManage && (
            <button
              onClick={() => setManaging((v) => !v)}
              className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                managing ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title="카테고리 관리"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <ul className="space-y-0.5">
          {onCategoryClick ? (
            <li>
              <button
                onClick={() => onCategoryClick(undefined)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                  !selectedCategory
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                전체 보기
              </button>
            </li>
          ) : (
            <li>
              <Link
                href="/blog"
                className="block w-full rounded-xl px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                전체 보기
              </Link>
            </li>
          )}

          {categories.map((cat) =>
            onCategoryClick ? (
              <li key={cat.slug} className="flex items-center gap-1">
                <button
                  onClick={() => onCategoryClick(cat.slug)}
                  className={`flex-1 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    selectedCategory === cat.slug
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {cat.name}
                </button>
                {managing && (
                  <button
                    onClick={() => deleteCategory.mutate(cat.id)}
                    className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </li>
            ) : (
              <li key={cat.slug} className="flex items-center gap-1">
                <Link
                  href={`/blog?category=${cat.slug}`}
                  className={`flex-1 rounded-xl px-3 py-2 text-sm transition-colors ${
                    selectedCategory === cat.slug
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {cat.name}
                </Link>
                {managing && (
                  <button
                    onClick={() => deleteCategory.mutate(cat.id)}
                    className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </li>
            )
          )}

          {categories.length === 0 && !managing && (
            <li className="px-3 py-2 text-sm text-muted-foreground">카테고리 없음</li>
          )}
        </ul>

        {/* 카테고리 추가 폼 */}
        {managing && (
          <div className="mt-3 flex gap-1.5">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="카테고리명"
              className="h-8 flex-1 min-w-0 rounded-lg border border-input bg-background px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleAdd}
              disabled={createCategory.isPending || !newName.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {createCategory.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* 인기 포스트 */}
      {popularPosts.length > 0 && (
        <div className="rounded-2xl border border-black/8 bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-3.5 w-3.5 text-orange-400" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">인기 포스트</p>
          </div>
          <ul className="space-y-3">
            {popularPosts.map((post, idx) => (
              <li key={post.id}>
                <Link href={`/blog/${post.slug}`} className="flex items-start gap-3 group">
                  <span className="shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {post.viewCount}
                      <span className="text-muted-foreground/40">·</span>
                      <span>{post.authorName}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

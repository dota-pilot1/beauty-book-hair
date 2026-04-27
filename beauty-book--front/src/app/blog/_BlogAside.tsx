"use client";

import Link from "next/link";
import { Eye, Flame, Tag } from "lucide-react";
import { useBlogCategories, useBlogPopularPosts } from "@/entities/blog/model/useBlog";

type Props = {
  selectedCategory?: string;
  onCategoryClick?: (slug: string | undefined) => void;
};

export function BlogAside({ selectedCategory, onCategoryClick }: Props) {
  const { data: categories = [] } = useBlogCategories();
  const { data: popularPosts = [] } = useBlogPopularPosts();

  return (
    <div className="space-y-4">
      {/* 카테고리 */}
      <div className="rounded-2xl border border-black/8 bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">카테고리</p>
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
              <li key={cat.slug}>
                <button
                  onClick={() => onCategoryClick(cat.slug)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    selectedCategory === cat.slug
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {cat.name}
                </button>
              </li>
            ) : (
              <li key={cat.slug}>
                <Link
                  href={`/blog?category=${cat.slug}`}
                  className={`block w-full rounded-xl px-3 py-2 text-sm transition-colors ${
                    selectedCategory === cat.slug
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {cat.name}
                </Link>
              </li>
            )
          )}
          {categories.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">카테고리 없음</li>
          )}
        </ul>
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

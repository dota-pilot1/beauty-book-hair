"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Pin, PenSquare } from "lucide-react";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";
import { BlogAside } from "./_BlogAside";
import { LexicalEditor } from "@/shared/ui/lexical/lexical-editor";
import { useBlogPosts } from "@/entities/blog/model/useBlog";
import { useAuth } from "@/entities/user/model/authStore";
import type { BlogPostSummary } from "@/entities/blog/model/types";

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric", month: "short", day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(d);
}

function AuthorAvatar({ name }: { name: string }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
      {name.slice(0, 1)}
    </span>
  );
}

function BlogCard({ post }: { post: BlogPostSummary }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-2xl border border-black/8 bg-card p-5 transition-colors hover:border-primary/30 hover:bg-muted/30"
    >
      {/* 배지 영역 */}
      {(post.category || post.isPinned) && (
        <div className="mb-2 flex items-center gap-1.5">
          {post.category && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {post.category.name}
            </span>
          )}
          {post.isPinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              <Pin className="h-3 w-3" />
              추천
            </span>
          )}
        </div>
      )}

      {/* 제목 */}
      <h3 className="text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
        {post.title}
      </h3>

      {/* 본문 미리보기 */}
      {post.previewJson ? (
        <div className="relative mt-3 max-h-48 overflow-hidden">
          <LexicalEditor
            key={`preview-${post.id}`}
            initialState={post.previewJson}
            readOnly
            minHeight="0px"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
        </div>
      ) : (post.contentPreview || post.summary) ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">
          {post.contentPreview || post.summary}
        </p>
      ) : null}

      {/* 하단 메타 */}
      <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
        <AuthorAvatar name={post.authorName ?? "B"} />
        <span className="font-medium text-foreground/70">{post.authorName ?? "BeautyBook"}</span>
        <span className="text-muted-foreground/40">·</span>
        <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
        <span className="text-muted-foreground/40">·</span>
        <span className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          {post.viewCount}
        </span>
      </div>
    </Link>
  );
}

export default function BlogListClient() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useBlogPosts(selectedCategory, page);
  const { user } = useAuth();

  const canPost = user?.role?.code === "ROLE_ADMIN" || user?.role?.code === "ROLE_MANAGER";

  const posts = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleCategoryClick = (slug: string | undefined) => {
    setSelectedCategory(slug);
    setPage(0);
  };

  return (
    <CustomerShell
      eyebrow="Hair Diary"
      title="헤어 다이어리"
      description="디자이너들의 스타일 노하우와 헤어 이야기를 확인해보세요."
      aside={<BlogAside selectedCategory={selectedCategory} onCategoryClick={handleCategoryClick} />}
      showHeader={false}
    >
      {canPost ? (
        <div className="mb-4 flex justify-end">
          <Link
            href="/blog-management/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <PenSquare className="h-3.5 w-3.5" />
            포스트 작성
          </Link>
        </div>
      ) : null}

      {/* 피드 */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 rounded-2xl border border-black/8 bg-card p-4">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-sm text-muted-foreground">아직 등록된 포스트가 없습니다.</p>
          {canPost && (
            <Link
              href="/blog-management/new"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <PenSquare className="h-3.5 w-3.5" />
              첫 포스트 작성하기
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`h-8 w-8 rounded-full text-sm font-medium transition-colors ${
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
    </CustomerShell>
  );
}

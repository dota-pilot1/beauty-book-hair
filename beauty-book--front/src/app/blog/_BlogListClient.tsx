"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pin } from "lucide-react";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";
import { useBlogPosts, useBlogTags } from "@/entities/blog/model/useBlog";
import type { BlogPostSummary } from "@/entities/blog/model/types";

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

function BlogCard({ post }: { post: BlogPostSummary }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-card shadow-sm transition-all duration-200 hover:shadow-md"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {post.coverImageUrl ? (
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/30 text-xs">
            이미지 없음
          </div>
        )}
        {post.isPinned && (
          <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-xs font-medium text-primary-foreground">
            <Pin className="h-2.5 w-2.5" />
            추천
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-4 py-3">
        <h2 className="line-clamp-2 text-sm font-semibold text-foreground">{post.title}</h2>
        {post.summary && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{post.summary}</p>
        )}
        <div className="mt-auto flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
          {post.authorName && <span className="font-medium text-foreground/70">{post.authorName}</span>}
          {post.authorName && (post.publishedAt || post.createdAt) && <span>·</span>}
          <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}

export default function BlogListClient() {
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useBlogPosts(selectedTag, page);
  const { data: tags = [] } = useBlogTags();

  const posts = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleTagClick = (slug: string | undefined) => {
    setSelectedTag(slug);
    setPage(0);
  };

  return (
    <CustomerShell
      eyebrow="Hair Diary"
      title="헤어 다이어리"
      description="디자이너들의 스타일 노하우와 헤어 이야기를 확인해보세요."
    >
      {/* 태그 필터 */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => handleTagClick(undefined)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            !selectedTag
              ? "bg-foreground text-background"
              : "border border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          전체
        </button>
        {tags.map((tag) => (
          <button
            key={tag.slug}
            onClick={() => handleTagClick(tag.slug)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedTag === tag.slug
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>

      {/* 카드 그리드 */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted-foreground">등록된 포스트가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
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

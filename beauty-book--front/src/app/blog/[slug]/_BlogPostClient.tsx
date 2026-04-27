"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, ChevronLeft } from "lucide-react";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";
import { LexicalEditor } from "@/shared/ui/lexical/lexical-editor";
import { useBlogPost } from "@/entities/blog/model/useBlog";

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}

export default function BlogPostClient() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const { data: post, isLoading, isError } = useBlogPost(slug);

  if (isLoading) {
    return (
      <CustomerShell eyebrow="Hair Diary" title="" description="">
        <div className="space-y-4">
          <div className="aspect-video w-full animate-pulse rounded-2xl bg-muted" />
          <div className="h-6 w-2/3 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-1/3 animate-pulse rounded-lg bg-muted" />
        </div>
      </CustomerShell>
    );
  }

  if (isError || !post) {
    return (
      <CustomerShell eyebrow="Hair Diary" title="포스트 없음" description="">
        <p className="text-sm text-muted-foreground">포스트를 찾을 수 없습니다.</p>
        <Link href="/blog" className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ChevronLeft className="h-3.5 w-3.5" />
          목록으로 돌아가기
        </Link>
      </CustomerShell>
    );
  }

  return (
    <CustomerShell eyebrow="Hair Diary" title={post.title} description={post.summary ?? ""}>
      <article className="max-w-3xl space-y-6">
        {/* 커버 이미지 */}
        {post.coverImageUrl && (
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* 메타 정보 */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {post.authorName && (
            <span className="font-medium text-foreground">{post.authorName}</span>
          )}
          {post.authorName && <span>·</span>}
          <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {post.viewCount}
          </span>
        </div>

        {/* 태그 뱃지 */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/blog?tag=${tag.slug}`}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* 본문 */}
        <div className="rounded-2xl border border-black/10 bg-card p-6">
          {post.content ? (
            <LexicalEditor
              key={`blog-${post.slug}`}
              initialState={post.content}
              readOnly
              minHeight="0px"
            />
          ) : (
            <p className="text-sm text-muted-foreground">내용이 없습니다.</p>
          )}
        </div>

        {/* 목록으로 */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          목록으로
        </Link>
      </article>
    </CustomerShell>
  );
}

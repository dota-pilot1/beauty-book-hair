"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Eye, ChevronLeft } from "lucide-react";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";
import { LexicalEditor } from "@/shared/ui/lexical/lexical-editor";
import { BlogAside } from "../_BlogAside";
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

  const aside = <BlogAside selectedCategory={post?.category?.slug} />;

  if (isLoading) {
    return (
      <CustomerShell eyebrow="Hair Diary" title="" description="" aside={aside}>
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
      <CustomerShell eyebrow="Hair Diary" title="포스트 없음" description="" aside={aside}>
        <p className="text-sm text-muted-foreground">포스트를 찾을 수 없습니다.</p>
        <Link href="/blog" className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ChevronLeft className="h-3.5 w-3.5" />
          목록으로 돌아가기
        </Link>
      </CustomerShell>
    );
  }

  return (
    <CustomerShell eyebrow="Hair Diary" title="" description="" showHeader={false} aside={aside}>
      <article className="rounded-2xl border border-black/10 bg-card overflow-hidden shadow-sm">
        {/* 헤더 */}
        <header className="px-7 pt-7 pb-5 space-y-2.5 border-b border-black/8">
          {post.category && (
            <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              {post.category.name}
            </span>
          )}
          <h1 className="text-[22px] font-bold tracking-tight text-foreground leading-snug">
            {post.title}
          </h1>
          {post.summary && (
            <p className="text-sm text-muted-foreground leading-relaxed">{post.summary}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-muted-foreground">
            {post.authorName && (
              <span className="font-medium text-foreground/80">{post.authorName}</span>
            )}
            <span className="text-muted-foreground/30">·</span>
            <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
            <span className="text-muted-foreground/30">·</span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {post.viewCount}
            </span>
            {post.tags.length > 0 && (
              <>
                <span className="text-muted-foreground/30">·</span>
                {post.tags.map((tag) => (
                  <Link
                    key={tag.slug}
                    href={`/blog?tag=${tag.slug}`}
                    className="text-primary/70 hover:text-primary hover:underline transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </>
            )}
          </div>
        </header>

        {/* 본문 */}
        <div className="px-7 py-6">
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

        {/* 푸터 */}
        <div className="px-7 pb-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
          >
            <ChevronLeft className="h-3 w-3" />
            목록으로
          </Link>
        </div>
      </article>
    </CustomerShell>
  );
}

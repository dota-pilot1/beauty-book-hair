"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, Pin, PenSquare } from "lucide-react";
import { CustomerShell } from "@/shared/ui/customer/CustomerShell";
import { BlogAside } from "./_BlogAside";
import { BlogPostSheet } from "./_BlogPostSheet";
import { LexicalEditor } from "@/shared/ui/lexical/lexical-editor";
import { useBlogPosts, useBlogCategories } from "@/entities/blog/model/useBlog";
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
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 12px 32px -4px rgba(0,0,0,0.25)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="h-full rounded-2xl overflow-hidden"
    >
    <Link
      href={`/blog/${post.slug}`}
      className="group h-full flex flex-col rounded-2xl border border-black/8 bg-card overflow-hidden"
    >
      {/* 헤더 — 배지·제목 */}
      <div className="px-4 pt-3 pb-2.5 border-b border-black/6">
        <div className="flex items-center gap-1.5 mb-1 min-h-[18px]">
          {post.category && (
            <span className="rounded-full bg-background border border-black/8 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {post.category.name}
            </span>
          )}
          {post.isPinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              <Pin className="h-2.5 w-2.5" />
              추천
            </span>
          )}
        </div>
        <h3 className="text-[14px] font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h3>
      </div>

      {/* 본문 미리보기 */}
      <div className="flex-1 px-4 py-3">
        {post.previewJson ? (
          <div className="relative max-h-44 overflow-hidden">
            <LexicalEditor
              key={`preview-${post.id}`}
              initialState={post.previewJson}
              readOnly
              minHeight="0px"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-card to-transparent" />
          </div>
        ) : (post.contentPreview || post.summary) ? (
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">
            {post.contentPreview || post.summary}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/40 italic">본문 없음</p>
        )}
      </div>

      {/* 푸터 메타 */}
      <div className="flex items-center gap-2 border-t border-black/6 px-4 py-2.5 text-xs text-muted-foreground bg-black/[0.04]">
        <AuthorAvatar name={post.authorName ?? "B"} />
        <span className="font-medium text-foreground/70">{post.authorName ?? "BeautyBook"}</span>
        <span className="text-muted-foreground/30">·</span>
        <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
        <span className="ml-auto flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          {post.viewCount}
        </span>
      </div>
    </Link>
    </motion.div>
  );
}

export default function BlogListClient() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [page, setPage] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading } = useBlogPosts(selectedCategory, page);
  const { data: categories } = useBlogCategories();
  const { user } = useAuth();

  const canPost = user?.role?.code === "ROLE_ADMIN" || user?.role?.code === "ROLE_MANAGER";

  const posts = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;
  const selectedCategoryName = selectedCategory
    ? categories?.find((c) => c.slug === selectedCategory)?.name
    : undefined;

  const handleCategoryClick = (slug: string | undefined) => {
    setSelectedCategory(slug);
    setPage(0);
  };

  return (
    <>
    <CustomerShell
      eyebrow="Hair Diary"
      title="헤어 다이어리"
      description="디자이너들의 스타일 노하우와 헤어 이야기를 확인해보세요."
      showHeader={false}
      aside={<BlogAside selectedCategory={selectedCategory} onCategoryClick={handleCategoryClick} />}
    >

      {/* 에디토리얼 헤더 */}
      <div className="mb-5 pb-4 border-b border-black/8">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-primary/60 uppercase mb-1.5">
          Hair Diary
        </p>
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-[26px] font-bold tracking-tight text-foreground leading-none">
            {selectedCategoryName ?? "헤어 다이어리"}
          </h2>
          {!isLoading && (
            <span className="text-xs text-muted-foreground mb-0.5">
              {data?.totalElements ?? 0}개의 포스트
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          {selectedCategoryName
            ? `${selectedCategoryName} 카테고리의 포스트`
            : "디자이너들의 스타일 노하우와 헤어 이야기"}
        </p>
      </div>

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
            <button
              onClick={() => setSheetOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <PenSquare className="h-3.5 w-3.5" />
              첫 포스트 작성하기
            </button>
          )}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        >
          {posts.map((post) => (
            <motion.div
              key={post.id}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="h-full"
            >
              <BlogCard post={post} />
            </motion.div>
          ))}
        </motion.div>
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

    {canPost && (
      <>
        <BlogPostSheet open={sheetOpen} onOpenChange={setSheetOpen} />
        <button
          onClick={() => setSheetOpen(true)}
          className="fixed bottom-8 right-8 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 active:scale-95 transition-all duration-150"
          title="포스트 작성"
          aria-label="포스트 작성"
        >
          <PenSquare className="h-5 w-5" />
        </button>
      </>
    )}
    </>
  );
}

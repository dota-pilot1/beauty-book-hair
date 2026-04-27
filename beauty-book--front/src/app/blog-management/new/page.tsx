"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImagePlus, Loader2, ChevronLeft, X } from "lucide-react";
import Link from "next/link";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { AdminShell } from "@/shared/ui/admin/AdminShell";
import { LexicalEditor } from "@/shared/ui/lexical/lexical-editor";
import { uploadImage } from "@/shared/api/upload";
import { useCreateBlogPost } from "@/entities/blog/model/useBlog";
import { blogApi } from "@/entities/blog/api/blogApi";

export default function BlogPostNewPage() {
  const router = useRouter();
  const createPost = useCreateBlogPost();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [tagNames, setTagNames] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleSuggestSlug = async () => {
    if (!title.trim()) return;
    try {
      const suggested = await blogApi.suggestSlug(title);
      setSlug(suggested);
    } catch {
      // 무시
    }
  };

  const handleCoverUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "blog");
      setCoverImageUrl(url);
    } finally {
      setUploading(false);
    }
  };

  const addTag = (value: string) => {
    const trimmed = value.trim().replace(/,+$/, "").trim();
    if (trimmed && !tagNames.includes(trimmed)) {
      setTagNames((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && tagInput === "" && tagNames.length > 0) {
      setTagNames((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = (submitStatus: "DRAFT" | "PUBLISHED") => {
    if (!title.trim() || !slug.trim()) return;
    createPost.mutate(
      {
        title: title.trim(),
        slug: slug.trim(),
        content,
        summary: summary.trim() || undefined,
        coverImageUrl: coverImageUrl || undefined,
        authorName: authorName.trim() || undefined,
        status: submitStatus,
        isPinned: false,
        tagNames,
      },
      { onSuccess: () => router.push("/blog-management") }
    );
  };

  return (
    <RequireAuth>
      <AdminShell eyebrow="Admin" title="새 포스트 작성" description="헤어 다이어리 포스트를 작성합니다.">
        <div className="max-w-3xl space-y-6">
          {/* 뒤로가기 */}
          <Link
            href="/blog-management"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            목록으로
          </Link>

          {/* 커버 이미지 */}
          <section className="rounded-2xl border border-black/10 bg-card p-5 shadow-sm">
            <p className="mb-3 text-sm font-medium text-foreground">커버 이미지</p>
            {coverImageUrl ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl">
                <Image src={coverImageUrl} alt="커버" fill className="object-cover" />
                <button
                  onClick={() => setCoverImageUrl("")}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={uploading}
                className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="h-6 w-6" />
                    <span className="text-xs">클릭하여 이미지 업로드</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
            />
          </section>

          {/* 기본 정보 */}
          <section className="rounded-2xl border border-black/10 bg-card p-5 shadow-sm space-y-4">
            <p className="text-sm font-medium text-foreground">기본 정보</p>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">제목 *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSuggestSlug}
                placeholder="포스트 제목"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Slug * <span className="text-muted-foreground/60">(URL에 사용됩니다)</span>
              </label>
              <div className="flex gap-2">
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="my-post-slug"
                  className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={handleSuggestSlug}
                  className="h-10 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:bg-muted transition-colors"
                >
                  자동 생성
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">요약</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="목록 카드에 표시될 짧은 요약 (150자 이내)"
                rows={2}
                maxLength={150}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">작성자</label>
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="디자이너 이름"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </section>

          {/* 태그 입력 */}
          <section className="rounded-2xl border border-black/10 bg-card p-5 shadow-sm">
            <p className="mb-2 text-sm font-medium text-foreground">태그</p>
            <p className="mb-3 text-xs text-muted-foreground">Enter 또는 쉼표로 추가</p>
            <div className="flex flex-wrap gap-1.5 rounded-lg border border-input bg-background px-3 py-2 min-h-[42px] focus-within:ring-1 focus-within:ring-primary">
              {tagNames.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {tag}
                  <button type="button" onClick={() => setTagNames((prev) => prev.filter((t) => t !== tag))} className="text-primary/60 hover:text-primary transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => tagInput.trim() && addTag(tagInput)}
                placeholder={tagNames.length === 0 ? "커트, 펌, 염색..." : ""}
                className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </section>

          {/* 본문 에디터 */}
          <section className="rounded-2xl border border-black/10 bg-card shadow-sm overflow-hidden">
            <div className="border-b border-black/8 px-5 py-3">
              <p className="text-sm font-medium text-foreground">본문</p>
            </div>
            <LexicalEditor
              key="blog-new"
              initialState={content || undefined}
              onChange={setContent}
              minHeight="300px"
            />
          </section>

          {/* 액션 버튼 */}
          <div className="flex items-center justify-end gap-3 pb-6">
            <Link
              href="/blog-management"
              className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              취소
            </Link>
            <button
              onClick={() => handleSubmit("DRAFT")}
              disabled={createPost.isPending || !title.trim() || !slug.trim()}
              className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
            >
              임시저장
            </button>
            <button
              onClick={() => handleSubmit("PUBLISHED")}
              disabled={createPost.isPending || !title.trim() || !slug.trim()}
              className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {createPost.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "발행"
              )}
            </button>
          </div>
        </div>
      </AdminShell>
    </RequireAuth>
  );
}

"use client";

import { useRef, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ImagePlus, Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { RequireAuth } from "@/widgets/guards/RequireAuth";
import { AdminShell } from "@/shared/ui/admin/AdminShell";
import { LexicalEditor } from "@/shared/ui/lexical/lexical-editor";
import { uploadImage } from "@/shared/api/upload";
import { useBlogTags, useUpdateBlogPost } from "@/entities/blog/model/useBlog";
import { blogApi } from "@/entities/blog/api/blogApi";

export default function BlogPostEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const { data: tags = [] } = useBlogTags();
  const updatePost = useUpdateBlogPost();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    blogApi.adminListAll({ page: 0, size: 200 }).then((data) => {
      const post = data.content.find((p) => p.id === id);
      if (!post) return;
      setTitle(post.title);
      setSlug(post.slug);
      setSummary(post.summary ?? "");
      setCoverImageUrl(post.coverImageUrl ?? "");
      setAuthorName(post.authorName ?? "");
      setStatus(post.status);
      setLoaded(true);
    });
  }, [id]);

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

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev: number[]) =>
      prev.includes(tagId) ? prev.filter((t: number) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = (submitStatus: "DRAFT" | "PUBLISHED") => {
    if (!title.trim() || !slug.trim()) return;
    updatePost.mutate(
      {
        id,
        body: {
          title: title.trim(),
          slug: slug.trim(),
          content,
          summary: summary.trim() || undefined,
          coverImageUrl: coverImageUrl || undefined,
          authorName: authorName.trim() || undefined,
          status: submitStatus,
          tagIds: selectedTagIds,
        },
      },
      { onSuccess: () => router.push("/blog-management") }
    );
  };

  if (!loaded) {
    return (
      <RequireAuth>
        <AdminShell eyebrow="Admin" title="포스트 수정" description="">
          <div className="space-y-4 max-w-3xl">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </AdminShell>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <AdminShell eyebrow="Admin" title="포스트 수정" description="헤어 다이어리 포스트를 수정합니다.">
        <div className="max-w-3xl space-y-6">
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
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
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
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Slug *</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">요약</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
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
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </section>

          {/* 태그 선택 */}
          {tags.length > 0 && (
            <section className="rounded-2xl border border-black/10 bg-card p-5 shadow-sm">
              <p className="mb-3 text-sm font-medium text-foreground">태그</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedTagIds.includes(tag.id)
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 본문 에디터 */}
          <section className="rounded-2xl border border-black/10 bg-card shadow-sm overflow-hidden">
            <div className="border-b border-black/8 px-5 py-3">
              <p className="text-sm font-medium text-foreground">본문</p>
            </div>
            <LexicalEditor
              key={`blog-edit-${id}`}
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
              disabled={updatePost.isPending || !title.trim() || !slug.trim()}
              className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
            >
              임시저장
            </button>
            <button
              onClick={() => handleSubmit("PUBLISHED")}
              disabled={updatePost.isPending || !title.trim() || !slug.trim()}
              className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {updatePost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "발행"}
            </button>
          </div>
        </div>
      </AdminShell>
    </RequireAuth>
  );
}

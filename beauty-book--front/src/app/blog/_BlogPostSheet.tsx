"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, Wand2 } from "lucide-react";
import { LexicalEditor } from "@/shared/ui/lexical/lexical-editor";
import { useCreateBlogPost } from "@/entities/blog/model/useBlog";
import { blogApi } from "@/entities/blog/api/blogApi";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function TagInput({
  tagNames,
  onChange,
}: {
  tagNames: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = (value: string) => {
    const trimmed = value.trim().replace(/,+$/, "").trim();
    if (trimmed && !tagNames.includes(trimmed)) onChange([...tagNames, trimmed]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    } else if (e.key === "Backspace" && input === "" && tagNames.length > 0) {
      onChange(tagNames.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 rounded-lg border border-input bg-background px-3 py-2 min-h-[40px] focus-within:ring-1 focus-within:ring-primary cursor-text">
      {tagNames.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {tag}
          <button type="button" onClick={() => onChange(tagNames.filter((t) => t !== tag))} className="text-primary/60 hover:text-primary transition-colors">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input.trim() && add(input)}
        placeholder={tagNames.length === 0 ? "커트, 펌, 염색..." : ""}
        className="flex-1 min-w-[60px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

export function BlogPostSheet({ open, onOpenChange }: Props) {
  const createPost = useCreateBlogPost();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [tagNames, setTagNames] = useState<string[]>([]);

  const reset = () => {
    setTitle(""); setSlug(""); setContent("");
    setSummary(""); setAuthorName(""); setTagNames([]);
  };

  const handleSuggestSlug = async () => {
    if (!title.trim()) return;
    try {
      const suggested = await blogApi.suggestSlug(title);
      setSlug(suggested);
    } catch { /* 무시 */ }
  };

  const handleSubmit = (status: "DRAFT" | "PUBLISHED") => {
    if (!title.trim() || !slug.trim()) return;
    createPost.mutate(
      { title: title.trim(), slug: slug.trim(), content, summary: summary.trim() || undefined, authorName: authorName.trim() || undefined, status, isPinned: false, tagNames },
      { onSuccess: () => { reset(); onOpenChange(false); } }
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-6xl h-[90vh] bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">

          {/* 헤더 */}
          <div className="flex items-center justify-between border-b border-black/8 px-6 py-4 shrink-0">
            <Dialog.Title className="text-base font-semibold text-foreground">새 포스트 작성</Dialog.Title>
            <Dialog.Close className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* 본문: 좌우 양분 */}
          <div className="flex flex-1 min-h-0">

            {/* 왼쪽 — 메타 정보 */}
            <div className="w-[340px] shrink-0 flex flex-col border-r border-black/8 overflow-y-auto px-6 py-5 space-y-5">

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
                  Slug * <span className="text-muted-foreground/50">(URL)</span>
                </label>
                <div className="flex gap-1.5">
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="my-post-slug"
                    className="h-9 flex-1 min-w-0 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={handleSuggestSlug}
                    title="자동 생성"
                    className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">요약</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="목록 카드에 표시될 짧은 요약"
                  rows={3}
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

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  태그 <span className="text-muted-foreground/50">· Enter / 쉼표</span>
                </label>
                <TagInput tagNames={tagNames} onChange={setTagNames} />
              </div>
            </div>

            {/* 오른쪽 — 본문 에디터 */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
              <div className="px-5 py-3 border-b border-black/8 shrink-0">
                <p className="text-xs font-medium text-muted-foreground">본문</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                <LexicalEditor
                  key={open ? "dialog-editor-open" : "dialog-editor-closed"}
                  initialState={content || undefined}
                  onChange={setContent}
                  minHeight="100%"
                />
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <div className="flex items-center justify-end gap-2 border-t border-black/8 px-6 py-4 shrink-0">
            <button
              onClick={() => handleSubmit("DRAFT")}
              disabled={createPost.isPending || !title.trim() || !slug.trim()}
              className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
            >
              임시저장
            </button>
            <button
              onClick={() => handleSubmit("PUBLISHED")}
              disabled={createPost.isPending || !title.trim() || !slug.trim()}
              className="inline-flex h-9 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {createPost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "발행"}
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

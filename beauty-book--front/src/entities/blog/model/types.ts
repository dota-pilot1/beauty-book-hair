export type BlogPostStatus = "DRAFT" | "PUBLISHED";

export type BlogTagItem = {
  id: number;
  name: string;
  slug: string;
};

export type BlogCategoryItem = {
  id: number;
  name: string;
  slug: string;
  displayOrder: number;
};

export type BlogPostSummary = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  contentPreview: string | null;
  previewJson: string | null;
  coverImageUrl: string | null;
  authorName: string | null;
  status: BlogPostStatus;
  isPinned: boolean;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  category: BlogCategoryItem | null;
};

export type BlogPostDetail = BlogPostSummary & {
  content: string | null;
  authorStaffId: number | null;
  tags: BlogTagItem[];
  updatedAt: string;
};

export type PageResult<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

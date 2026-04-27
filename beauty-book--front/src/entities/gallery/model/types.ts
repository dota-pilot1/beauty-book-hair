export type GalleryTag = "CUT" | "PERM" | "COLOR" | "TREATMENT" | "SCALP" | "STYLING" | "ETC";

export const GALLERY_TAG_LABEL: Record<GalleryTag, string> = {
  CUT: "커트",
  PERM: "펌",
  COLOR: "컬러",
  TREATMENT: "트리트먼트",
  SCALP: "두피케어",
  STYLING: "스타일링",
  ETC: "기타",
};

export type GalleryItem = {
  id: number;
  title: string;
  description?: string | null;
  imageUrls: string[];
  beforeImageUrl?: string | null;
  designerId?: number | null;
  designerName?: string | null;
  tag: GalleryTag;
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
};

export type PageResult<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

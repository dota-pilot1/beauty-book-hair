import type { Metadata } from "next";
import BlogPostClient from "./_BlogPostClient";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://13.209.195.64:4101";

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_BASE}/api/blog/posts?size=200`, {
      cache: "no-store",
    });
    if (!res.ok) return [{ slug: "__placeholder__" }];
    const data = await res.json();
    return (data.content as { slug: string }[]).map((p) => ({ slug: p.slug }));
  } catch {
    return [{ slug: "__placeholder__" }];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_BASE}/api/blog/posts/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { title: "포스트 없음" };
    const post = await res.json();
    return {
      title: `${post.title} | 헤어 다이어리 | BeautyBook`,
      description: post.summary ?? post.title,
      openGraph: {
        title: post.title,
        description: post.summary ?? undefined,
        images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
      },
    };
  } catch {
    return { title: "헤어 다이어리" };
  }
}

export default function BlogPostPage() {
  return <BlogPostClient />;
}

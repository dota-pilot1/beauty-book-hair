import BlogPostEditClient from "./_BlogPostEditClient";

export function generateStaticParams() {
  return [{ id: "__placeholder__" }];
}

export default function BlogPostEditPage() {
  return <BlogPostEditClient />;
}

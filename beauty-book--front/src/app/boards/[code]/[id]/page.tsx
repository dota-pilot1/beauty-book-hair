import BoardDetailClient from "./_BoardDetailClient";

export function generateStaticParams() {
  // Board detail pages use client-side data fetching; no pages pre-generated at build time
  return [{ code: "__placeholder__", id: "0" }];
}

export default function BoardDetailPage() {
  return <BoardDetailClient />;
}

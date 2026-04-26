import BoardListClient from "./_BoardListClient";

export function generateStaticParams() {
  // Board pages use client-side data fetching; no pages pre-generated at build time
  return [{ code: "__placeholder__" }];
}

export default function BoardListPage() {
  return <BoardListClient />;
}

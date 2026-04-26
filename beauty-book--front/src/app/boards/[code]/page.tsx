import BoardListClient from "./_BoardListClient";

export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://13.209.195.64:4101"}/api/boards/configs`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`${res.status}`);
    const configs: { code: string }[] = await res.json();
    return configs.map((c) => ({ code: c.code }));
  } catch {
    return [{ code: "__placeholder__" }];
  }
}

export default function BoardListPage() {
  return <BoardListClient />;
}

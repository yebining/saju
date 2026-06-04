import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl text-fg">결과를 찾을 수 없어요</h1>
      <p className="text-muted">결과가 만료되었거나 주소가 잘못됐어요.</p>
      <Link href="/" className="mt-2 rounded-xl bg-accent px-6 py-3 font-bold text-white">처음으로</Link>
    </main>
  );
}

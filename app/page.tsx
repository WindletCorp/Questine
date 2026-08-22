import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Questine</h1>
      <Link href="/test" className="text-blue-500 hover:underline">
        Go to Test Page
      </Link>
    </main>
  );
}

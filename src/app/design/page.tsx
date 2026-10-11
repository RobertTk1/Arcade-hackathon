import Link from "next/link";
import { CoverDesigner } from "@/components/CoverDesigner";

export const metadata = { title: "Design your cover | COMO" };

export default function DesignPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <Link href="/" className="text-sm text-ink-light">← COMO</Link>
      <h1 className="text-4xl">Design your cover</h1>
      <CoverDesigner />
    </main>
  );
}

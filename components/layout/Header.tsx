"use client";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-white px-4 py-3 shadow">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-xl font-semibold text-slate-800">
          BPMN Admin
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm text-slate-600"></nav>
      </div>
    </header>
  );
}

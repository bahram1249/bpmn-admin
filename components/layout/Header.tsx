"use client";
import Link from 'next/link';
import { ApiSettings } from '../ApiSettings';

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-white px-4 py-3 shadow">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-xl font-semibold text-slate-800">
          BPMN Admin
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm text-slate-600">
          <Link className="hover:text-slate-900" href="/processes">Processes</Link>
          <Link className="hover:text-slate-900" href="/activities">Activities</Link>
          <Link className="hover:text-slate-900" href="/nodes">Nodes</Link>
          <Link className="hover:text-slate-900" href="/requests">Requests</Link>
          <Link className="hover:text-slate-900" href="/request-states">Request States</Link>
        </nav>
      </div>
      <ApiSettings />
    </header>
  );
}

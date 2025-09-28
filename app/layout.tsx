import './globals.css';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-800">
        {/* Top Bar */}
        <Header />

        {/* Shell */}
        <div className="mx-auto flex w-full max-w-[1400px] gap-4 px-4 py-4">
          <Sidebar />
          <main className="flex-1 rounded-xl bg-white p-4 shadow-sm">{children}</main>
        </div>
      </body>
    </html>
  );
}

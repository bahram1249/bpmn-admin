import "./globals.css";
import { Header } from "../components/layout/Header";
import { Sidebar } from "../components/layout/Sidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "BPMN Admin",
    template: "%s - BPMN Admin",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-800">
        {/* Top Bar */}
        <Header />

        {/* Shell */}
        <div className="mx-auto flex w-full ">
          <Sidebar />
          <div className="flex-1 rounded-xl bg-white p-4 shadow-sm">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

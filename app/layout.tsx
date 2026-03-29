import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/ui/Sidebar";

export const metadata: Metadata = {
  title: "People Analytics Pal",
  description: "Executive-friendly people analytics observability and gap intelligence",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-64 min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}

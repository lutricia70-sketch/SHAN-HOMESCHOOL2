import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lesson Planner",
  description: "Notion-style lesson planner with GitHub sync and Google Classroom scaffold",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

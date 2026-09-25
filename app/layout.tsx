import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TIM COACHING – Mein Konto",
  description: "Dein Coaching, dein Abonnement und deine persönliche Betreuung.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}

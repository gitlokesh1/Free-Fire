import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BattleZone Arena — Free Fire Tournaments",
  description: "Win real money playing Free Fire tournaments. Join matches, compete, and earn!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}

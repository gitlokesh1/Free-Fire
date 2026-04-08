import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BattleZone Arena — Free Fire Tournaments",
  description: "Win real money playing Free Fire tournaments. Join matches, compete, and earn!",
  icons: {
    icon: "/images/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0A0A0A] text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}

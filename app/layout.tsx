import type { Metadata } from "next";
import { Carlito } from "next/font/google";

import "./globals.css";

const carlito = Carlito({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-carlito",
});

export const metadata: Metadata = {
  title: "NU Degree Audit",
  description: "Degree audit tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={carlito.variable}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}

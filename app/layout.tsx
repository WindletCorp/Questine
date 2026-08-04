import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Questine",
  description: "Personal productivity app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

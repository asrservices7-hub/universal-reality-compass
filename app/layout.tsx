import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ODRM — Universal Compass",
  description: "Navigate any reality with precision and clarity.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
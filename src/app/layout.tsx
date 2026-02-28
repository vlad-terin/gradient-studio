import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gradient Studio",
  description: "Paper Design Shaders - Interactive gradient and shader backgrounds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

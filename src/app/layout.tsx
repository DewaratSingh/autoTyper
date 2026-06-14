import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import AnimatedGradientBackground from "@/components/layout/AnimatedGradientBackground";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AutoTyper — Teach Code Without Typing",
  description:
    "AutoTyper automatically types your code during lectures with a single key press. The ultimate tool for programming educators.",
  openGraph: {
    title: "AutoTyper — Teach Code Without Typing",
    description:
      "Press F8. Watch your code appear. Teach better.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable}`}
    >
      <body>
        <AnimatedGradientBackground />
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}

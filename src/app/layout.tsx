import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { isClerkConfigured } from "@/lib/env";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeScript } from "@/components/theme";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "OneToMany",
  description: "AI content repurposing built for founders. Preserves your voice. No generic fluff.",
  other: {
    "google-adsense-account": "ca-pub-4851546257120071",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const body = (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );

  // Only mount Clerk when configured; in mock mode the app runs with a fake user.
  return isClerkConfigured ? <ClerkProvider>{body}</ClerkProvider> : body;
}

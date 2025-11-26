import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import SplashScreen from "@/components/ui/SplashScreen";
import { viewport } from "./viewport";

export { viewport };

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AL YAFOUR – Procurement System",
    template: "%s | AL YAFOUR"
  },
  description: "AL YAFOUR CONSTRUCTION - Complete Procurement Management System - Streamline your procurement process with our comprehensive solution",
  keywords: ["procurement", "purchase", "supply chain", "management", "system", "AL YAFOUR", "construction"],
  authors: [{ name: "AL YAFOUR CONSTRUCTION" }],
  creator: "AL YAFOUR CONSTRUCTION",
  publisher: "AL YAFOUR CONSTRUCTION",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    siteName: "AL YAFOUR Procurement System",
    title: "AL YAFOUR – Procurement System",
    description: "AL YAFOUR CONSTRUCTION - Complete Procurement Management System - Streamline your procurement process",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AL YAFOUR Procurement System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AL YAFOUR – Procurement System",
    description: "AL YAFOUR CONSTRUCTION - Complete Procurement Management System",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#F97316",
      },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#F97316" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AL YAFOUR" />
        <meta name="description" content="AL YAFOUR CONSTRUCTION - Complete Procurement Management System - Streamline your procurement process with our comprehensive solution" />
        <meta name="company" content="AL YAFOUR CONSTRUCTION" />
        <meta name="author" content="AL YAFOUR CONSTRUCTION" />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="AL YAFOUR – Procurement System" />
        <meta property="og:image:type" content="image/png" />
        {/* Light Mode Only - Dark Mode Removed */}
      </head>
      <body
        className={`${inter.variable} ${poppins.variable} antialiased`}
        style={{ fontFamily: 'var(--font-inter), var(--font-poppins), sans-serif' }}
      >
        <SplashScreen />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

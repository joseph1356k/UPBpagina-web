import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PRODUCT } from "@/lib/constants";

import "./globals.css";

const sansFont = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const serifFont = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: PRODUCT.name,
    template: `%s · ${PRODUCT.name}`,
  },
  description: PRODUCT.description,
  applicationName: PRODUCT.name,
  authors: [{ name: PRODUCT.institution }],
  keywords: [
    "UPB",
    "grados",
    "ceremonias",
    "invitados",
    "registro",
    "Universidad Pontificia Bolivariana",
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://ceremonias.upb.edu.co",
  ),
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  // Open Graph — for WhatsApp / FB / LinkedIn previews
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "/",
    siteName: PRODUCT.name,
    title: PRODUCT.name,
    description: PRODUCT.description,
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: `${PRODUCT.institutionShort} — escudo institucional`,
      },
    ],
  },
  // Twitter / X cards
  twitter: {
    card: "summary",
    title: PRODUCT.name,
    description: PRODUCT.description,
    images: ["/icon.svg"],
  },
  // Honest robots policy for a private institutional app — landing
  // is indexable, internal areas are noindex.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  // Verify Bolivariana ownership when UPB shares the domain
  // verification: { google: "..." },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a0a0e" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${sansFont.variable} ${serifFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground flex flex-col">
        {/* A11y — skip link, only visible on keyboard focus */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Saltar al contenido
        </a>

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <TooltipProvider delay={180}>
            {children}
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

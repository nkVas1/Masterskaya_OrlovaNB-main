import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["cyrillic", "latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  subsets: ["cyrillic", "latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://orlov-workshop.vercel.app"),
  title: "Мастерская Орлова Н.Б. | Магические Зеркала и Артефакты",
  description: "Эксклюзивные зеркала ручной работы, эзотерические предметы интерьера и защитные амулеты от мастера Николая Борисовича Орлова. Псковская область.",
  keywords: [
    "зеркала ручной работы",
    "магические зеркала",
    "эзотерика",
    "руны",
    "Николай Орлов",
    "Псков",
    "обереги",
    "зеркало с рунами",
    "магическая защита",
    "авторские зеркала"
  ],
  authors: [{ name: "Мастерская Орлова Н.Б." }],
  creator: "Nikolai Orlov Workshop",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://orlov-workshop.vercel.app",
    title: "Мастерская Орлова Н.Б. | Магические Зеркала и Артефакты",
    description: "Эксклюзивные зеркала ручной работы от мастера Николая Борисовича Орлова",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="scroll-smooth">
      <head>
        <meta name="theme-color" content="#050505" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={`${cormorant.variable} ${inter.variable} bg-void antialiased`}>
        <div className="grain-overlay" />
        {children}
      </body>
    </html>
  );
}

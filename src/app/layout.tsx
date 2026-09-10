import type { Metadata } from "next";
import { Instrument_Serif, Outfit, Syne } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const serif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "31 Capitals | Introducing Broker for Global Markets",
  description:
    "31 Capitals is an independent marketing and Introducing Broker brand. Premium onboarding, market insights, and personal support worldwide.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${syne.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#040404] text-[#f7f1ea]">{children}</body>
    </html>
  );
}

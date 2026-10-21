import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { Heebo } from "next/font/google";
import "./globals.css";

const gveret = localFont({
  src: "../fonts/gveret-levin.ttf",
  variable: "--font-gveret",
  display: "swap",
  weight: "400",
});
const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo" });

export const metadata: Metadata = {
  title: "Wzk.io — Who Ze Klik",
  description: "קישור אחד. כל קליק. האדם הנכון. העברה הוגנת לוואטסאפ, בלי לקרוא את השיחה.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const he = jar.get("wzk_lang")?.value !== "en";
  return (
    <html lang={he ? "he" : "en"} dir={he ? "rtl" : "ltr"}>
      <body className={`${gveret.variable} ${heebo.variable}`}>{children}</body>
    </html>
  );
}

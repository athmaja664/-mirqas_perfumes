import "./globals.css";
import { Cormorant_Garamond, Inter } from "next/font/google";
import Preloader from "@/components/Preloader";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InspectProtection from "@/components/InspectProtection";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = { title: "Mirqas Perfumes" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="bg-[#FCF8F0] font-[family-name:var(--font-sans)] text-[#111]">
        <InspectProtection />
        <Preloader />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}

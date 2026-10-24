import "./globals.css";
import { Cormorant_Garamond, Inter } from "next/font/google";
import Preloader from "@/components/Preloader";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
});
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = { title: "Mirqas Perfumes" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body className="bg-[#FCF8F0] font-[family-name:var(--font-sans)] text-[#111]">
        <Preloader />
        <Navbar/>
        {children}
        <Footer/>
      </body>
    </html>
  );
}
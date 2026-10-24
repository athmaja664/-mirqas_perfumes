import { Outfit } from "next/font/google";
import Sidebar from "@/components/admin/Sidebar";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata = { title: "Oud Arabian | Admin" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${outfit.className} min-h-screen bg-[#0b0b0c] p-3 text-[#EBD9C0] md:p-6`}>
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1500px] overflow-hidden rounded-3xl border border-white/5 bg-[#141415] shadow-[0_30px_80px_rgba(0,0,0,0.7)]">
        <Sidebar />
        <main className="flex-1 overflow-x-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
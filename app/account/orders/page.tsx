import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { Order, type OrderStatus } from "@/models/Order";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

const COPPER = "#9C5A2B";
const IVORY = "#FCF8F0";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

type Row = {
  orderNumber: string;
  items: { name: string; qty: number }[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
};

const STATUS_TEXT: Record<OrderStatus, { text: string; color: string; bg: string }> = {
  pending: { text: "Order placed", color: "#8A5A00", bg: "#F6EBCF" },
  confirmed: { text: "Confirmed", color: "#9C5A2B", bg: "#F3E7D5" },
  shipped: { text: "Shipped", color: "#1F4E8C", bg: "#E1ECF8" },
  delivered: { text: "Delivered", color: "#1F7A3A", bg: "#E3F2E6" },
  cancelled: { text: "Cancelled", color: "#A32A1F", bg: "#F8E3E0" },
};

export default async function MyOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await connectDB();
  // Only the orders of this customer. The user id comes from the session.
  const rows = (await Order.find({ userId: user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .select("orderNumber items.name items.qty total status createdAt")
    .lean()) as unknown as Row[];

  return (
    <main className="px-5 py-12 md:px-10 md:py-16" style={{ background: IVORY, fontFamily: sans }}>
      <div className="mx-auto max-w-[760px]">
        <h1
          className="m-0 text-center font-medium leading-tight"
          style={{ fontFamily: serif, color: COPPER, fontSize: "clamp(2rem, 4vw, 3rem)" }}
        >
          My Orders
        </h1>
        <p className="mb-10 mt-3 text-center text-[15px] text-black/60">Track your orders from Mirqas Perfumes.</p>

        {rows.length === 0 ? (
          <div className="border border-black/10 bg-white p-8 text-center">
            <p className="m-0 text-[15px] text-black/60">You have no orders yet.</p>
            <Link
              href="/shopallperfume"
              className="mt-5 inline-block px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#7d4720]"
              style={{ background: COPPER }}
            >
              Shop all perfumes
            </Link>
          </div>
        ) : (
          <ul className="m-0 list-none space-y-4 p-0">
            {rows.map((o) => {
              const s = STATUS_TEXT[o.status];
              const count = o.items.reduce((n, i) => n + i.qty, 0);
              const first = o.items[0]?.name ?? "";
              const more = o.items.length > 1 ? ` and ${o.items.length - 1} more` : "";
              return (
                <li key={o.orderNumber}>
                  <Link
                    href={`/account/orders/${o.orderNumber}`}
                    className="block border border-black/10 bg-white p-5 transition-colors hover:border-[#9C5A2B]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[17px] font-semibold lining-nums">{o.orderNumber}</span>
                      <span
                        className="px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em]"
                        style={{ color: s.color, background: s.bg }}
                      >
                        {s.text}
                      </span>
                    </div>
                    <p className="m-0 mt-2 text-[14px] text-black/60">
                      {first}
                      {more}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px] text-black/55">
                      <span>
                        {new Date(o.createdAt).toLocaleDateString("en-IN", {
                          dateStyle: "medium",
                          timeZone: "Asia/Kolkata",
                        })}{" "}
                        - {count} {count === 1 ? "item" : "items"}
                      </span>
                      <span className="text-[16px] font-semibold" style={{ color: COPPER }}>
                        {formatPaise(o.total)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-8 text-center">
          <Link href="/account" className="text-[13px] underline underline-offset-4">
            Back to my account
          </Link>
        </div>
      </div>
    </main>
  );
}
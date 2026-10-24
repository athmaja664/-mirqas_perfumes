import Link from "next/link";

// Paste Flaticon PNG URLs here. If empty, an emoji is shown instead.
const ICONS = {
  orders: "",
  pending: "",
  revenue: "",
  products: "",
};

type Status = "Pending" | "Shipped" | "Delivered" | "Cancelled";

type Order = {
  id: string;
  customer: string;
  email: string;
  items: number;
  total: number;
  payment: "Paid" | "COD";
  status: Status;
  date: string;
};

// Sample data. Replace with your API or database later.
const orders: Order[] = [
  { id: "#OA-1042", customer: "Rahul Menon", email: "rahul@example.com", items: 2, total: 8780, payment: "Paid", status: "Pending", date: "2026-10-23" },
  { id: "#OA-1041", customer: "Fathima Nasar", email: "fathima@example.com", items: 1, total: 6290, payment: "Paid", status: "Shipped", date: "2026-10-22" },
  { id: "#OA-1040", customer: "Arun Kumar", email: "arun@example.com", items: 3, total: 14470, payment: "COD", status: "Delivered", date: "2026-10-21" },
  { id: "#OA-1039", customer: "Sneha Thomas", email: "sneha@example.com", items: 1, total: 2490, payment: "Paid", status: "Cancelled", date: "2026-10-20" },
  { id: "#OA-1038", customer: "Nikhil Raj", email: "nikhil@example.com", items: 2, total: 11980, payment: "COD", status: "Delivered", date: "2026-10-19" },
];

const lowStock = [
  { name: "7 Moons", stock: 9 },
  { name: "A Poem", stock: 12 },
  { name: "Maliki", stock: 15 },
];

const TOTAL_PRODUCTS = 6;

const price = (n: number) => `₹ ${n.toLocaleString("en-IN")}`;

// Shared styles
const card =
  "rounded-2xl border border-white/[0.04] bg-gradient-to-b from-[#232325] to-[#19191b] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.45)]";
const label = "text-[11px] font-medium uppercase tracking-[0.18em] text-[#D9A66B]";
const gold = "bg-gradient-to-r from-[#EBCB9A] to-[#C8905A] bg-clip-text text-transparent";

const pill: Record<Status, string> = {
  Pending: "border-[#D9A66B] text-[#D9A66B]",
  Shipped: "border-[#EBD9C0]/60 text-[#EBD9C0]",
  Delivered: "border-emerald-500/60 text-emerald-400",
  Cancelled: "border-red-500/60 text-red-400",
};

function Stat({
  title,
  value,
  icon,
  fallback,
}: {
  title: string;
  value: string | number;
  icon?: string;
  fallback: string;
}) {
  return (
    <div className="flex-1">
      <div className="flex items-start justify-between">
        <p className={label}>{title}</p>
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt={title} className="h-7 w-7 object-contain" />
        ) : (
          <span className="text-lg opacity-80">{fallback}</span>
        )}
      </div>
      <p className="mt-5 text-4xl font-light text-[#F3E6D3]">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const totalOrders = orders.length;
  const pending = orders.filter((o) => o.status === "Pending").length;
  const revenue = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const statuses: Status[] = ["Pending", "Shipped", "Delivered", "Cancelled"];

  return (
    <div className="space-y-5">
      {/* Row 1: greeting + stats */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Greeting */}
        <div className={`${card} relative overflow-hidden`}>
          <h1 className="text-2xl font-medium text-[#F3E6D3]">Hello, Admin</h1>
          <p className="mt-1 text-sm text-[#C9A87E]">Ready to manage MirQas?</p>
          {/* Decorative orb (not a chart) */}
          <div className="absolute -bottom-10 -right-6 h-40 w-40 rounded-full border border-[#C8905A]/30" />
          <div className="absolute -bottom-4 right-6 h-24 w-24 rounded-full border border-[#C8905A]/40" />
          <div className="absolute bottom-3 right-12 h-14 w-14 rounded-full bg-[radial-gradient(circle_at_30%_30%,#EBCB9A,#8a6a4a_60%,#3a2c1d)] shadow-[0_0_30px_rgba(200,144,90,0.35)]" />
          <div className="h-24" />
        </div>

        {/* Orders stats */}
        <div className={`${card} flex gap-6`}>
          <Stat title="Total Orders" value={totalOrders} icon={ICONS.orders} fallback="" />
          <div className="w-px bg-white/5" />
          <Stat title="Pending" value={pending} icon={ICONS.pending} fallback="" />
        </div>

        {/* Revenue stats */}
        <div className={`${card} flex gap-6`}>
          <Stat title="Revenue" value={price(revenue)} icon={ICONS.revenue} fallback="" />
          <div className="w-px bg-white/5" />
          <Stat title="Products" value={TOTAL_PRODUCTS} icon={ICONS.products} fallback="" />
        </div>
      </div>

      {/* Row 2: recent orders + side cards */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Recent orders */}
        <div className={`${card} xl:col-span-2`}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className={`text-lg font-medium ${gold}`}>Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs uppercase tracking-[0.18em] text-[#D9A66B] hover:underline">
              View all →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={`border-b border-white/5 ${label}`}>
                  <th className="pb-3 pr-4 font-medium">Order</th>
                  <th className="pb-3 pr-4 font-medium">Customer</th>
                  <th className="pb-3 pr-4 font-medium">Items</th>
                  <th className="pb-3 pr-4 font-medium">Total</th>
                  <th className="pb-3 pr-4 font-medium">Payment</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="py-4 pr-4 text-[#F3E6D3]">{o.id}</td>
                    <td className="py-4 pr-4 text-[#F3E6D3]">
                      {o.customer}
                      <span className="block text-xs text-[#C9A87E]/70">{o.email}</span>
                    </td>
                    <td className="py-4 pr-4">{o.items}</td>
                    <td className="py-4 pr-4 text-[#F3E6D3]">{price(o.total)}</td>
                    <td className="py-4 pr-4">{o.payment}</td>
                    <td className="py-4 pr-4">
                      <span className={`rounded-full border px-3 py-1 text-[11px] ${pill[o.status]}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-4 text-[#C9A87E]">{o.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-5">
          {/* Order status list */}
          <div className={card}>
            <h2 className={`mb-4 ${label}`}>Order Status</h2>
            <ul className="divide-y divide-white/5">
              {statuses.map((s) => (
                <li key={s} className="flex items-center justify-between py-3 text-sm">
                  <span className={`rounded-full border px-3 py-1 text-[11px] ${pill[s]}`}>{s}</span>
                  <span className="text-lg font-light text-[#F3E6D3]">
                    {orders.filter((o) => o.status === s).length}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Low stock list */}
          <div className={card}>
            <h2 className={`mb-4 ${label}`}>Low Stock</h2>
            <ul className="divide-y divide-white/5">
              {lowStock.map((p) => (
                <li key={p.name} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-[#F3E6D3]">{p.name}</span>
                  <span className="text-[#D9A66B]">{p.stock} left</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
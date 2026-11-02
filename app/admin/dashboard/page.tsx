import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { connectDB, getSequelize, Op, fn, col, literal } from "@/lib/db";
import { User } from "@/models/User";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { formatPaise } from "@/lib/money";
import AdminShell from "@/components/admin/AdminShell";
import { QueryTypes } from "sequelize";

export const dynamic = "force-dynamic";

const COPPER = "#9C5A2B";
const INK = "#111111";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';

const LOW_STOCK = 5;
const DAY = 24 * 60 * 60 * 1000;
const IST = 5.5 * 60 * 60 * 1000; // India time is UTC+5:30 all year

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

const PILL: Record<string, { bg: string; fg: string }> = {
  pending: { bg: "#F3E7D5", fg: "#9C5A2B" },
  confirmed: { bg: "#FFF9F3", fg: "#7d4720" },
  shipped: { bg: "#FFF9F3", fg: "#7d4720" },
  delivered: { bg: "#E3F2E6", fg: "#1F7A3A" },
  cancelled: { bg: "#F8E3E0", fg: "#A32A1F" },
};

const BAR: Record<string, string> = {
  pending: "#D4A97A",
  confirmed: "#9C5A2B",
  shipped: "#7d4720",
  delivered: "#1F7A3A",
  cancelled: "#A32A1F",
};

type Sum = { total: number; count: number };
type DayRow = { _id: string; total: number; count: number };
type StatusRow = { _id: string; count: number };
type TopRow = { _id: string; name: string; qty: number; revenue: number };
type LowProduct = { _id: unknown; name: string; stock: number };
type RecentCustomer = { _id: unknown; name: string; email: string; createdAt: Date };
type RecentOrder = {
  _id: unknown;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: Date;
  shipping?: { name?: string };
};

const pick = (rows: Sum[]): Sum => {
  if (!rows || rows.length === 0) return { total: 0, count: 0 };
  return {
    total: Number(rows[0].total) || 0,
    count: Number(rows[0].count) || 0,
  };
};

// Short money for chart bars: 1.2k, 2.2L (lakh), 1.0Cr (crore)
function compact(paise: number) {
  const r = paise / 100;
  if (r >= 10000000) return (r / 10000000).toFixed(1) + "Cr";
  if (r >= 100000) return (r / 100000).toFixed(1) + "L";
  if (r >= 1000) return (r / 1000).toFixed(1) + "k";
  return String(Math.round(r));
}

function StatCard({
  label,
  value,
  note,
  href,
}: {
  label: string;
  value: string;
  note?: string;
  href?: string;
}) {
  const body = (
    <div className="h-full border border-black/10 bg-white p-4 transition-colors sm:p-6 hover:border-[#9C5A2B]/40">
      <p className="m-0 text-[10px] uppercase tracking-[0.15em] text-black/50 sm:text-[11px] sm:tracking-[0.25em]">
        {label}
      </p>
      <p
        className={
          "mb-0 mt-3 break-words leading-none lining-nums sm:mt-4 " +
          (value.startsWith("Rs.")
            ? "text-[24px] font-semibold sm:text-[30px]"
            : "text-3xl font-medium sm:text-5xl")
        }
        style={{ fontFamily: serif, color: COPPER }}
      >
        {value}
      </p>
      {note && <p className="mb-0 mt-2 text-[11px] text-black/45 sm:mt-3 sm:text-[12px]">{note}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block no-underline" style={{ color: INK }}>
      {body}
    </Link>
  ) : (
    body
  );
}

function Panel({
  title,
  note,
  className = "",
  children,
}: {
  title: string;
  note?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={"min-w-0 border border-black/10 bg-white p-4 sm:p-6 " + className}>
      <h2 className="m-0 text-2xl font-medium lining-nums sm:text-3xl" style={{ fontFamily: serif, color: COPPER }}>
        {title}
      </h2>
      {note && <p className="mb-0 mt-1 text-[12px] text-black/45">{note}</p>}
      <div className="mt-4 sm:mt-5">{children}</div>
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const c = PILL[status] ?? PILL.pending;
  return (
    <span
      className="inline-block shrink-0 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em]"
      style={{ background: c.bg, color: c.fg }}
    >
      {status}
    </span>
  );
}

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  await connectDB();
  const sequelize = getSequelize();

  // Start of today in India time, as a real date
  const now = Date.now();
  const todayStart = Math.floor((now + IST) / DAY) * DAY - IST;
  const weekStart = todayStart - 6 * DAY;
  const monthStart = todayStart - 29 * DAY;

  const live = { status: { [Op.ne]: "cancelled" } };

  const [
    customerCount,
    productCount,
    activeProductCount,
    orderCount,
    pendingCount,
    liveRows,
    deliveredRows,
    todayRows,
    monthRows,
    dailyRows,
    statusRows,
    topRows,
    lowCount,
    lowRows,
    recentOrderRows,
    recentCustomerRows,
  ] = await Promise.all([
    User.count({ where: { role: "customer" } }),
    Product.count(),
    Product.count({ where: { isActive: true } }),
    Order.count(),
    Order.count({ where: { status: "pending" } }),
    Order.findAll({
      attributes: [
        [fn("COALESCE", fn("SUM", col("total")), 0), "total"],
        [fn("COUNT", col("id")), "count"],
      ],
      where: live,
      raw: true,
    }) as unknown as Promise<Sum[]>,
    Order.findAll({
      attributes: [
        [fn("COALESCE", fn("SUM", col("total")), 0), "total"],
        [fn("COUNT", col("id")), "count"],
      ],
      where: { status: "delivered" },
      raw: true,
    }) as unknown as Promise<Sum[]>,
    Order.findAll({
      attributes: [
        [fn("COALESCE", fn("SUM", col("total")), 0), "total"],
        [fn("COUNT", col("id")), "count"],
      ],
      where: { ...live, createdAt: { [Op.gte]: new Date(todayStart) } },
      raw: true,
    }) as unknown as Promise<Sum[]>,
    Order.findAll({
      attributes: [
        [fn("COALESCE", fn("SUM", col("total")), 0), "total"],
        [fn("COUNT", col("id")), "count"],
      ],
      where: { ...live, createdAt: { [Op.gte]: new Date(monthStart) } },
      raw: true,
    }) as unknown as Promise<Sum[]>,
    Order.findAll({
      attributes: [
        [literal("DATE_FORMAT(CONVERT_TZ(createdAt, '+00:00', '+05:30'), '%Y-%m-%d')"), "_id"],
        [fn("COALESCE", fn("SUM", col("total")), 0), "total"],
        [fn("COUNT", col("id")), "count"],
      ],
      where: { ...live, createdAt: { [Op.gte]: new Date(weekStart) } },
      group: [literal("DATE_FORMAT(CONVERT_TZ(createdAt, '+00:00', '+05:30'), '%Y-%m-%d')") as unknown as string],
      raw: true,
    }) as unknown as Promise<DayRow[]>,
    Order.findAll({
      attributes: [["status", "_id"], [fn("COUNT", col("id")), "count"]],
      group: ["status"],
      raw: true,
    }) as unknown as Promise<StatusRow[]>,
    sequelize.query<TopRow>(
      `SELECT oi.slug AS _id, oi.name AS name, CAST(SUM(oi.qty) AS SIGNED) AS qty, CAST(SUM(oi.lineTotal) AS SIGNED) AS revenue
       FROM order_items oi
       JOIN orders o ON oi.orderId = o.id
       WHERE o.status != 'cancelled'
       GROUP BY oi.slug, oi.name
       ORDER BY qty DESC, revenue DESC
       LIMIT 5`,
      { type: QueryTypes.SELECT }
    ),
    Product.count({ where: { isActive: true, stock: { [Op.lte]: LOW_STOCK } } }),
    Product.findAll({
      where: { isActive: true, stock: { [Op.lte]: LOW_STOCK } },
      order: [["stock", "ASC"]],
      limit: 5,
      attributes: ["id", "name", "stock"],
    }),
    Order.findAll({
      order: [["createdAt", "DESC"]],
      limit: 5,
    }),
    User.findAll({
      where: { role: "customer" },
      order: [["createdAt", "DESC"]],
      limit: 5,
      attributes: ["id", "name", "email", "createdAt"],
    }),
  ]);

  const sales = pick(liveRows);
  const delivered = pick(deliveredRows);
  const today = pick(todayRows);
  const month = pick(monthRows);
  const average = sales.count > 0 ? Math.round(sales.total / sales.count) : 0;

  // Last 7 days, with 0 for days that had no orders
  const dayMap = new Map(dailyRows.map((r) => [r._id, { total: Number(r.total) || 0, count: Number(r.count) || 0 }]));
  const days = Array.from({ length: 7 }, (_, i) => {
    const t = weekStart + i * DAY;
    const shifted = new Date(t + IST);
    const row = dayMap.get(shifted.toISOString().slice(0, 10));
    return {
      label: shifted.toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" }),
      total: row?.total ?? 0,
      count: row?.count ?? 0,
    };
  });
  const maxDay = Math.max(...days.map((d) => d.total), 1);
  const weekTotal = days.reduce((s, d) => s + d.total, 0);

  const statusCount = new Map(statusRows.map((r) => [r._id, Number(r.count) || 0]));

  const low = lowRows as unknown as LowProduct[];
  const recentOrders = recentOrderRows as unknown as RecentOrder[];
  const recentCustomers = recentCustomerRows as unknown as RecentCustomer[];

  const th = "px-4 py-3 font-medium sm:px-5";
  const td = "px-4 py-3 sm:px-5";

  return (
    <AdminShell active="Dashboard">
      <p className="m-0 text-[10px] uppercase tracking-[0.2em] text-black/50 sm:text-[11px] sm:tracking-[0.3em]">
        Signed in as {user.name}
      </p>

      <h1
        className="mb-2 mt-3 break-words font-medium leading-tight"
        style={{ fontFamily: serif, color: COPPER, fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
      >
        Welcome back, {user.name}
      </h1>
      <p className="mb-6 mt-0 text-[14px] text-black/60 sm:text-[15px] md:mb-10">Here is a quick look at your store.</p>

      {/* Counts: two per row on phones */}
      <section aria-label="Store counts" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Customers" value={String(customerCount)} note="Registered accounts" href="/admin/customers" />
        <StatCard
          label="Products"
          value={String(productCount)}
          note={activeProductCount + " active"}
          href="/admin/products"
        />
        <StatCard label="Orders" value={String(orderCount)} note="All orders" href="/admin/orders" />
        <StatCard
          label="Pending orders"
          value={String(pendingCount)}
          note="Waiting to be confirmed"
          href="/admin/orders"
        />
      </section>

      {/* Sales: one per row on phones, because the amounts are wide */}
      <section
        aria-label="Sales figures"
        className="mt-3 grid grid-cols-1 gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3"
      >
        <StatCard label="Sales" value={formatPaise(sales.total)} note={"All orders except cancelled (" + sales.count + ")"} />
        <StatCard
          label="Collected"
          value={formatPaise(delivered.total)}
          note={"Delivered orders only (" + delivered.count + ")"}
        />
        <StatCard label="Average order" value={formatPaise(average)} note="Sales divided by orders" />
        <StatCard label="Today" value={formatPaise(today.total)} note={today.count + " orders today"} />
        <StatCard label="Last 30 days" value={formatPaise(month.total)} note={month.count + " orders"} />
        <StatCard
          label="Low stock"
          value={String(lowCount)}
          note={LOW_STOCK + " or fewer in stock"}
          href="/admin/products"
        />
      </section>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-3">
        <Panel
          title="Sales, last 7 days"
          note={"Total " + formatPaise(weekTotal) + " (not cancelled). Number on top = orders."}
          className="lg:col-span-2"
        >
          <div className="flex h-40 items-end gap-1.5 sm:h-44 sm:gap-3" role="img" aria-label="Bar chart of sales for the last 7 days">
            {days.map((d, i) => {
              const pct = d.total > 0 ? Math.max(4, Math.round((d.total / maxDay) * 100)) : 0;
              return (
                <div
                  key={i}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                  title={d.label + ": " + formatPaise(d.total) + ", " + d.count + " orders"}
                >
                  <span className="mb-1 text-[11px] text-black/55 lining-nums">{d.count}</span>
                  <div className="w-full" style={{ height: pct + "%", background: pct ? COPPER : "#EADFCC", minHeight: 2 }} />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-1.5 sm:gap-3">
            {days.map((d, i) => (
              <div key={i} className="min-w-0 flex-1 text-center">
                <p className="m-0 text-[10px] uppercase tracking-[0.05em] text-black/60 sm:text-[11px] sm:tracking-[0.1em]">
                  {d.label}
                </p>
                <p className="m-0 text-[10px] text-black/45 lining-nums sm:text-[11px]">{compact(d.total)}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Orders by status" note="All orders, all time">
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {STATUSES.map((s) => {
              const n = statusCount.get(s) ?? 0;
              const pct = orderCount > 0 ? Math.round((n / orderCount) * 100) : 0;
              return (
                <li key={s}>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="capitalize">{s}</span>
                    <span className="text-black/60 lining-nums">{n}</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full bg-[#F3E7D5]">
                    <div className="h-2" style={{ width: pct + "%", background: BAR[s] }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-2">
        <Panel title="Top selling perfumes" note="By units sold, cancelled orders not counted">
          {topRows.length === 0 ? (
            <p className="m-0 text-[14px] text-black/55">No sales yet.</p>
          ) : (
            <ol className="m-0 list-none p-0">
              {topRows.map((t, i) => (
                <li key={t._id} className="flex items-center gap-3 border-b border-black/5 py-3 last:border-0">
                  <span className="w-5 shrink-0 text-[13px] text-black/40 lining-nums">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-[14px]">{t.name}</span>
                  <span className="shrink-0 text-right text-[12px] text-black/55">
                    <span className="lining-nums">{t.qty}</span> sold
                    <br />
                    <span className="lining-nums">{formatPaise(t.revenue)}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Low stock" note={"Active products with " + LOW_STOCK + " or fewer left"}>
          {low.length === 0 ? (
            <p className="m-0 text-[14px] text-black/55">All active products have enough stock.</p>
          ) : (
            <ul className="m-0 list-none p-0">
              {low.map((p) => (
                <li key={String(p._id)} className="border-b border-black/5 py-3 last:border-0">
                  <Link
                    href={`/admin/products/${String(p._id)}`}
                    className="flex items-center justify-between gap-3 text-black hover:text-[#9C5A2B]"
                  >
                    <span className="min-w-0 flex-1 truncate text-[14px] hover:underline">{p.name}</span>
                    <span
                      className="shrink-0 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] lining-nums"
                      style={
                        p.stock <= 0
                          ? { background: "#F8E3E0", color: "#A32A1F" }
                          : { background: "#F3E7D5", color: "#9C5A2B" }
                      }
                    >
                      {p.stock <= 0 ? "Out of stock (0)" : p.stock + " left"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/products" className="mt-4 inline-block py-2 text-[12px] uppercase tracking-[0.15em] underline underline-offset-4" style={{ color: COPPER }}>
            Manage products
          </Link>
        </Panel>
      </div>

      {/* Recent orders */}
      <section aria-labelledby="recent-orders-title" className="mt-8 md:mt-10">
        <h2 id="recent-orders-title" className="m-0 text-2xl font-medium sm:text-3xl" style={{ fontFamily: serif, color: COPPER }}>
          Recent orders
        </h2>
        <div className="mt-4 border border-black/10 bg-white sm:mt-5">
          {recentOrders.length === 0 ? (
            <p className="m-0 p-5 text-[15px] text-black/55 sm:p-6">No orders yet.</p>
          ) : (
            <>
              <ul className="m-0 list-none p-0 md:hidden">
                {recentOrders.map((o) => (
                  <li key={String(o._id)} className="border-b border-black/5 p-4 last:border-0">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={"/admin/orders/" + String(o._id)}
                        className="min-w-0 truncate text-[14px] underline underline-offset-4 lining-nums"
                        style={{ color: COPPER }}
                      >
                        {o.orderNumber}
                      </Link>
                      <StatusPill status={o.status} />
                    </div>
                    <p className="m-0 mt-2 truncate text-[14px]">{o.shipping?.name ?? "-"}</p>
                    <div className="mt-1 flex items-center justify-between gap-3 text-[13px] text-black/60 lining-nums">
                      <span>{formatPaise(o.total)}</span>
                      <span>{new Date(o.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[560px] border-collapse text-left text-[14px]" style={{ color: INK }}>
                  <thead>
                    <tr className="border-b border-black/10 text-[11px] uppercase tracking-[0.2em] text-black/50">
                      <th className={th}>Order</th>
                      <th className={th}>Customer</th>
                      <th className={th}>Total</th>
                      <th className={th}>Status</th>
                      <th className={th}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={String(o._id)} className="border-b border-black/5 last:border-0">
                        <td className={td}>
                          <Link
                            href={"/admin/orders/" + String(o._id)}
                            className="underline underline-offset-4 lining-nums"
                            style={{ color: COPPER }}
                          >
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td className={td}>{o.shipping?.name ?? "-"}</td>
                        <td className={td + " lining-nums"}>{formatPaise(o.total)}</td>
                        <td className={td}>
                          <StatusPill status={o.status} />
                        </td>
                        <td className={td + " lining-nums"}>{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Recent customers */}
      <section aria-labelledby="recent-title" className="mt-8 md:mt-12">
        <h2 id="recent-title" className="m-0 text-2xl font-medium sm:text-3xl" style={{ fontFamily: serif, color: COPPER }}>
          Recent customers
        </h2>
        <div className="mt-4 border border-black/10 bg-white sm:mt-5">
          {recentCustomers.length === 0 ? (
            <p className="m-0 p-5 text-[15px] text-black/55 sm:p-6">No customers have registered yet.</p>
          ) : (
            <>
              <ul className="m-0 list-none p-0 md:hidden">
                {recentCustomers.map((c) => (
                  <li key={String(c._id)} className="border-b border-black/5 p-4 last:border-0">
                    <p className="m-0 text-[14px] font-medium">{c.name}</p>
                    <p className="m-0 mt-1 break-all text-[13px] text-black/60">{c.email}</p>
                    <p className="m-0 mt-1 text-[12px] text-black/45 lining-nums">
                      Joined {new Date(c.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[480px] border-collapse text-left text-[14px]" style={{ color: INK }}>
                  <thead>
                    <tr className="border-b border-black/10 text-[11px] uppercase tracking-[0.2em] text-black/50">
                      <th className={th}>Name</th>
                      <th className={th}>Email</th>
                      <th className={th}>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCustomers.map((c) => (
                      <tr key={String(c._id)} className="border-b border-black/5 last:border-0">
                        <td className={td}>{c.name}</td>
                        <td className={td}>{c.email}</td>
                        <td className={td + " lining-nums"}>{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
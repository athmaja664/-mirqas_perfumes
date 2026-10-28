import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

const COPPER = "#9C5A2B";
const INK = "#111111";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';

type RecentCustomer = { _id: unknown; name: string; email: string; createdAt: Date };

function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border border-black/10 bg-white p-5 sm:p-6">
      <p className="m-0 text-[11px] uppercase tracking-[0.25em] text-black/50">{label}</p>
      <p className="mb-0 mt-4 text-5xl font-medium leading-none" style={{ fontFamily: serif, color: COPPER }}>
        {value}
      </p>
      {note && <p className="mb-0 mt-3 text-[12px] text-black/45">{note}</p>}
    </div>
  );
}

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  await connectDB();
  const customerCount = await User.countDocuments({ role: "customer" });
  const recent = (await User.find({ role: "customer" })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("name email createdAt")
    .lean()) as unknown as RecentCustomer[];

  return (
    <AdminShell active="Dashboard">
      <p className="m-0 text-[11px] uppercase tracking-[0.3em] text-black/50">Signed in as {user.name}</p>

      <h1
        className="mb-2 mt-3 font-medium leading-tight"
        style={{ fontFamily: serif, color: COPPER, fontSize: "clamp(2rem, 4vw, 3rem)" }}
      >
        Welcome back, {user.name}
      </h1>
      <p className="mb-8 mt-0 text-[15px] text-black/60 md:mb-10">Here is a quick look at your store.</p>

      <section aria-label="Store statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Customers" value={String(customerCount)} note="Registered accounts" />
        <StatCard label="Products" value="Soon" note="Added in the products stage" />
        <StatCard label="Orders" value="Soon" note="Added in the orders stage" />
        <StatCard label="Pending orders" value="Soon" note="Added in the orders stage" />
      </section>

      <section aria-labelledby="recent-title" className="mt-10 md:mt-12">
        <h2 id="recent-title" className="m-0 text-3xl font-medium" style={{ fontFamily: serif, color: COPPER }}>
          Recent customers
        </h2>

        <div className="mt-5 overflow-x-auto border border-black/10 bg-white">
          {recent.length === 0 ? (
            <p className="m-0 p-6 text-[15px] text-black/55">No customers have registered yet.</p>
          ) : (
            <>
              {/* Phones: a simple list */}
              <ul className="m-0 list-none p-0 sm:hidden">
                {recent.map((c) => (
                  <li key={String(c._id)} className="border-b border-black/5 p-4 last:border-0">
                    <p className="m-0 text-[15px] font-medium">{c.name}</p>
                    <p className="m-0 mt-1 break-all text-[13px] text-black/60">{c.email}</p>
                    <p className="m-0 mt-1 text-[12px] text-black/45">
                      Joined {new Date(c.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </li>
                ))}
              </ul>

              {/* Larger screens: a table */}
              <table className="hidden w-full border-collapse text-left text-[14px] sm:table" style={{ color: INK }}>
                <thead>
                  <tr className="border-b border-black/10 text-[11px] uppercase tracking-[0.2em] text-black/50">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((c) => (
                    <tr key={String(c._id)} className="border-b border-black/5 last:border-0">
                      <td className="px-5 py-4">{c.name}</td>
                      <td className="px-5 py-4">{c.email}</td>
                      <td className="px-5 py-4">{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
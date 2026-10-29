import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isValidObjectId } from "mongoose";
import { getCurrentUser } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

const COPPER = "#9C5A2B";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const PAGE_SIZE = 10;

type Row = { _id: unknown; name: string; email: string; phone: string; isActive: boolean; createdAt: Date };

async function toggleActive(formData: FormData) {
  "use server";
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return;
  const id = String(formData.get("id"));
  if (!isValidObjectId(id)) return;
  await connectDB();
  // Only customers can be switched here, never admin accounts.
  const u = await User.findOne({ _id: id, role: "customer" });
  if (!u) return;
  u.isActive = !u.isActive;
  await u.save();
  if (!u.isActive) await Session.deleteMany({ userId: u._id }); // sign them out everywhere
  revalidatePath("/admin/customers");
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const sp = await searchParams;
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);

  const filter: Record<string, unknown> = { role: "customer" };
  if (sp.status === "active") filter.isActive = true;
  if (sp.status === "inactive") filter.isActive = false;
  const search = (sp.search ?? "").trim().slice(0, 80);
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = ["name", "email", "phone"].map((f) => ({ [f]: { $regex: safe, $options: "i" } }));
  }

  await connectDB();
  const [rows, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE)
      .select("name email phone isActive createdAt").lean(),
    User.countDocuments(filter),
  ]);
  const customers = rows as unknown as Row[];
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const link = (p: number) => {
    const n = new URLSearchParams();
    if (search) n.set("search", search);
    if (sp.status) n.set("status", sp.status);
    n.set("page", String(p));
    return `/admin/customers?${n.toString()}`;
  };

  return (
    <AdminShell active="Customers">
      <h1 className="mb-8 mt-0 font-medium leading-tight" style={{ fontFamily: serif, color: COPPER, fontSize: "clamp(2rem, 4vw, 3rem)" }}>
        Customers
      </h1>

      <form method="get" className="mb-5 flex flex-wrap gap-3">
        <input name="search" defaultValue={search} placeholder="Search by name, email or phone"
          className="h-11 min-w-[220px] flex-1 border border-black/20 bg-white px-4 text-[14px] outline-none focus:border-[#111]" />
        <select name="status" defaultValue={sp.status ?? ""} className="h-11 border border-black/20 bg-white px-3 text-[14px]">
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button type="submit" className="h-11 border border-black/20 bg-white px-6 text-[12px] font-semibold uppercase tracking-[0.18em] hover:bg-black/[0.03]">
          Filter
        </button>
      </form>

      <div className="overflow-x-auto border border-black/10 bg-white">
        {customers.length === 0 ? (
          <p className="m-0 p-6 text-[15px] text-black/55">No customers found.</p>
        ) : (
          <table className="w-full min-w-[760px] border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-black/10 text-[11px] uppercase tracking-[0.2em] text-black/50">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Mobile</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={String(c._id)} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3">{c.phone || "—"}</td>
                  <td className="px-4 py-3">{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">{c.isActive ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-4">
                      <Link href={`/admin/customers/${String(c._id)}`} className="underline underline-offset-4">View</Link>
                      <form action={toggleActive}>
                        <input type="hidden" name="id" value={String(c._id)} />
                        <button type="submit" className="underline underline-offset-4">
                          {c.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between text-[13px] text-black/60">
        <span>{total} customers · page {Math.min(page, pages)} of {pages}</span>
        <div className="flex gap-4">
          {page > 1 && <Link href={link(page - 1)} className="underline underline-offset-4">Previous</Link>}
          {page < pages && <Link href={link(page + 1)} className="underline underline-offset-4">Next</Link>}
        </div>
      </div>
    </AdminShell>
  );
}
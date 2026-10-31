import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isValidObjectId } from "mongoose";
import { getCurrentUser } from "@/lib/auth/session";
import { requireOwner } from "@/lib/auth/require-admin";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { deleteCustomer } from "@/lib/services/purge";
import AdminShell from "@/components/admin/AdminShell";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";

export const dynamic = "force-dynamic";

const COPPER = "#9C5A2B";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const PAGE_SIZE = 10;

type Row = { _id: unknown; name: string; email: string; phone: string; isActive: boolean; createdAt: Date };

const ERRORS: Record<string, string> = {
  forbidden: "Only the main admin can delete customers.",
  "not-found": "That customer was not found.",
  "open-orders": "This customer has open orders. Cancel or finish them first.",
};

async function toggleActive(formData: FormData) {
  "use server";
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") return;
  const id = String(formData.get("id"));
  if (!isValidObjectId(id)) return;
  await connectDB();
  const u = await User.findOne({ _id: id, role: "customer" });
  if (!u) return;
  u.isActive = !u.isActive;
  await u.save();
  if (!u.isActive) await Session.deleteMany({ userId: u._id });
  revalidatePath("/admin/customers");
}

// A form post can be sent by anyone, so the owner is checked again here on the server.
async function deleteCustomerAction(formData: FormData) {
  "use server";
  const owner = await requireOwner();
  if ("error" in owner && owner.error) redirect("/admin/customers?error=forbidden");

  const id = String(formData.get("id") ?? "");
  const result = await deleteCustomer(id);

  revalidatePath("/admin/customers");
  redirect(result.ok ? "/admin/customers?done=deleted" : "/admin/customers?error=" + result.code);
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className="inline-block shrink-0 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em]"
      style={active ? { background: "#E3F2E6", color: "#1F7A3A" } : { background: "#F8E3E0", color: "#A32A1F" }}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
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
  const errorText =
    typeof sp.error === "string" && Object.prototype.hasOwnProperty.call(ERRORS, sp.error) ? ERRORS[sp.error] : "";

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
      <h1
        className="mb-6 mt-0 break-words font-medium leading-tight md:mb-8"
        style={{ fontFamily: serif, color: COPPER, fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
      >
        Customers
      </h1>

      {sp.done === "deleted" && (
        <p role="status" className="mb-4 px-3 py-2 text-[13px]" style={{ background: "#E3F2E6", color: "#1F7A3A" }}>
          Customer deleted.
        </p>
      )}
      {errorText && (
        <p role="alert" className="mb-4 px-3 py-2 text-[13px]" style={{ background: "#F8E3E0", color: "#A32A1F" }}>
          {errorText}
        </p>
      )}

      {/* Filter: search takes the full row on phones, then the dropdown and button share the next row */}
      <form method="get" className="mb-5 flex flex-wrap gap-3">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by name, email or phone"
          className="h-11 w-full border border-black/20 bg-white px-4 text-[16px] outline-none focus:border-[#111] sm:w-auto sm:min-w-[220px] sm:flex-1 sm:text-[14px]"
        />
        <select
          name="status"
          defaultValue={sp.status ?? ""}
          className="h-11 min-w-0 flex-1 border border-black/20 bg-white px-3 text-[16px] sm:flex-none sm:text-[14px]"
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          type="submit"
          className="h-11 flex-1 border border-black/20 bg-white px-6 text-[12px] font-semibold uppercase tracking-[0.18em] hover:bg-black/[0.03] sm:flex-none"
        >
          Filter
        </button>
      </form>

      <div className="border border-black/10 bg-white">
        {customers.length === 0 ? (
          <p className="m-0 p-5 text-[15px] text-black/55 sm:p-6">No customers found.</p>
        ) : (
          <>
            {/* Phone: one card per customer */}
            <ul className="m-0 list-none p-0 md:hidden">
              {customers.map((c) => (
                <li key={String(c._id)} className="border-b border-black/5 p-4 last:border-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="m-0 min-w-0 break-words text-[15px] font-medium">{c.name}</p>
                    <StatusPill active={c.isActive} />
                  </div>
                  <p className="m-0 mt-1 break-all text-[13px] text-black/60">{c.email}</p>
                  <p className="m-0 mt-1 text-[13px] text-black/60 lining-nums">
                    {c.phone || "No mobile number"}
                  </p>
                  <p className="m-0 mt-1 text-[12px] text-black/45 lining-nums">
                    Joined {new Date(c.createdAt).toLocaleDateString("en-IN")}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px]">
                    <Link
                      href={`/admin/customers/${String(c._id)}`}
                      className="py-2 underline underline-offset-4"
                      style={{ color: COPPER }}
                    >
                      View
                    </Link>
                    <form action={toggleActive} className="m-0">
                      <input type="hidden" name="id" value={String(c._id)} />
                      <button type="submit" className="py-2 underline underline-offset-4">
                        {c.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                    {user.isOwner && (
                      <form action={deleteCustomerAction} className="m-0">
                        <input type="hidden" name="id" value={String(c._id)} />
                        <ConfirmDeleteButton
                          label={"Delete " + c.name}
                          title="Delete customer?"
                          message={
                            "Delete " + c.name + " for good?\n\nTheir orders, reviews, cart, wishlist and saved address are deleted too.\n\nThis cannot be undone."
                          }
                        />
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Tablet and desktop: table */}
            <div className="hidden overflow-x-auto md:block">
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
                      <td className="px-4 py-3">{c.phone || "-"}</td>
                      <td className="px-4 py-3">{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3">{c.isActive ? "Active" : "Inactive"}</td>
                      <td className="px-4 py-3">
                        <div className="flex h-8 items-center gap-4">
                          <Link
                            href={`/admin/customers/${String(c._id)}`}
                            className="flex h-8 w-10 items-center leading-none underline underline-offset-4"
                          >
                            View
                          </Link>
                          <form action={toggleActive} className="m-0 flex h-8 w-[92px] items-center">
                            <input type="hidden" name="id" value={String(c._id)} />
                            <button type="submit" className="leading-none underline underline-offset-4">
                              {c.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </form>
                          {user.isOwner && (
                            <form action={deleteCustomerAction} className="m-0 flex h-8 items-center">
                              <input type="hidden" name="id" value={String(c._id)} />
                              <ConfirmDeleteButton
                                label={"Delete " + c.name}
                                title="Delete customer?"
                                message={
                                  "Delete " + c.name + " for good?\n\nTheir orders, reviews, cart, wishlist and saved address are deleted too.\n\nThis cannot be undone."
                                }
                              />
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3 text-[13px] text-black/60 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {total} customers - page {Math.min(page, pages)} of {pages}
        </span>
        <div className="flex gap-5">
          {page > 1 && (
            <Link href={link(page - 1)} className="py-2 underline underline-offset-4">
              Previous
            </Link>
          )}
          {page < pages && (
            <Link href={link(page + 1)} className="py-2 underline underline-offset-4">
              Next
            </Link>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
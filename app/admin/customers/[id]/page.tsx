import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { getCurrentUser } from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

type Row = { name: string; email: string; phone: string; isActive: boolean; createdAt: Date; updatedAt: Date };

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");

  const { id } = await params;
  if (!isValidObjectId(id)) notFound();
  await connectDB();
  const c = (await User.findOne({ _id: id, role: "customer" })
    .select("name email phone isActive createdAt updatedAt").lean()) as unknown as Row | null;
  if (!c) notFound();

  const date = (d: Date) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const rows = [
    { label: "Full name", value: c.name },
    { label: "Email", value: c.email },
    { label: "Mobile number", value: c.phone || "Not added" },
    { label: "Status", value: c.isActive ? "Active" : "Inactive" },
    { label: "Joined", value: date(c.createdAt) },
    { label: "Last updated", value: date(c.updatedAt) },
  ];

  return (
    <AdminShell active="Customers">
      <h1 className="mb-8 mt-0 text-4xl font-medium" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', color: "#9C5A2B" }}>
        {c.name}
      </h1>
      <dl className="m-0 max-w-[640px] border border-black/10 bg-white">
        {rows.map((r) => (
          <div key={r.label} className="border-b border-black/10 px-6 py-5 last:border-0">
            <dt className="text-[11px] uppercase tracking-[0.25em] text-black/50">{r.label}</dt>
            <dd className="m-0 mt-2 text-[17px] text-[#111]">{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-[13px] text-black/50">Order history will appear here once orders are built.</p>
      <Link href="/admin/customers" className="mt-6 inline-block text-[13px] underline underline-offset-4">Back to customers</Link>
    </AdminShell>
  );
}

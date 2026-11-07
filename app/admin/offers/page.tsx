import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import OffersTable from "@/components/admin/OffersTable";
import { listAdminOffers } from "@/lib/services/offers";

export const dynamic = "force-dynamic";

const COPPER = "#9C5A2B";
const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';

type Props = {
  searchParams: Promise<{ search?: string; status?: string }>;
};

export default async function OffersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const urlParams = new URLSearchParams();
  if (sp.search) urlParams.set("search", sp.search);
  if (sp.status) urlParams.set("status", sp.status);

  const { offers, metrics } = await listAdminOffers(urlParams);

  return (
    <AdminShell active="/admin/offers">
      <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="m-0 text-3xl font-medium sm:text-4xl" style={{ fontFamily: serif, color: COPPER }}>
              Offers & Discounts
            </h1>
            <p className="mt-1 text-sm text-black/60">
              Create and manage special offers for your customers.
            </p>
          </div>
          <Link
            href="/admin/offers/new"
            className="inline-flex items-center justify-center gap-2 bg-[#9C5A2B] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#FFF9F3] transition-colors hover:bg-[#834920]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add New Offer
          </Link>
        </div>

        {/* Metrics Cards */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="border border-black/10 bg-white p-5 shadow-sm">
            <span className="text-[11px] uppercase tracking-[0.2em] text-black/50">Total Offers</span>
            <p className="mt-2 text-3xl font-semibold text-black/90">{metrics.total}</p>
          </div>
          <div className="border border-emerald-500/20 bg-emerald-50/50 p-5 shadow-sm">
            <span className="text-[11px] uppercase tracking-[0.2em] text-emerald-800">Active Offers</span>
            <p className="mt-2 text-3xl font-semibold text-emerald-900">{metrics.active}</p>
          </div>
          <div className="border border-blue-500/20 bg-blue-50/50 p-5 shadow-sm">
            <span className="text-[11px] uppercase tracking-[0.2em] text-blue-800">Scheduled Offers</span>
            <p className="mt-2 text-3xl font-semibold text-blue-900">{metrics.scheduled}</p>
          </div>
          <div className="border border-amber-500/20 bg-amber-50/50 p-5 shadow-sm">
            <span className="text-[11px] uppercase tracking-[0.2em] text-amber-800">Expired Offers</span>
            <p className="mt-2 text-3xl font-semibold text-amber-900">{metrics.expired}</p>
          </div>
        </div>

        {/* Offers Table with client-side filters, quick publish/unpublish and delete */}
        <div className="mt-8">
          <OffersTable initialOffers={offers} />
        </div>
      </div>
    </AdminShell>
  );
}


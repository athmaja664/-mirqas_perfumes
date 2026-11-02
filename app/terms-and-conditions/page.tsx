import Link from "next/link";

export const metadata = {
  title: "Terms and Conditions | Mirqas Perfumes",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-serif)] text-3xl font-medium text-[#9C5A2B] sm:text-4xl">
        Terms &amp; Conditions
      </h1>
      <p className="mt-2 text-sm text-black/60">Last updated: October 2026</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-black/80">
        <section>
          <h2 className="text-lg font-semibold text-[#111]">1. General</h2>
          <p className="mt-2">
            By visiting our website and purchasing products from Mirqas Perfumes, you agree to comply with and be bound by the following terms and conditions.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-[#111]">2. Product Availability &amp; Pricing</h2>
          <p className="mt-2">
            All prices are shown in Indian Rupees (₹) and include applicable taxes unless specified otherwise. We reserve the right to correct any pricing errors or adjust availability as required.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-[#111]">3. Orders &amp; Fulfillment</h2>
          <p className="mt-2">
            Upon placing an order, you will receive an order confirmation. We reserve the right to decline or cancel any order for reasons including inventory shortages or suspected fraudulent activity.
          </p>
        </section>
      </div>
      <div className="mt-12">
        <Link href="/" className="text-sm font-medium text-[#9C5A2B] hover:underline">
          &larr; Back to Home
        </Link>
      </div>
    </main>
  );
}

import Link from "next/link";

export const metadata = {
  title: "Refund & Returns Policy | Mirqas Perfumes",
};

export default function RefundPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-serif)] text-3xl font-medium text-[#9C5A2B] sm:text-4xl">
        Refund &amp; Returns Policy
      </h1>
      <p className="mt-2 text-sm text-black/60">Last updated: October 2026</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-black/80">
        <section>
          <h2 className="text-lg font-semibold text-[#111]">Returns &amp; Exchanges</h2>
          <p className="mt-2">
            Due to the hygienic nature of fragrance products, returns are accepted exclusively for items that arrive damaged, defective, or incorrect. Please notify us within 48 hours of delivery.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-[#111]">Refund Processing</h2>
          <p className="mt-2">
            Approved refunds will be processed to your original payment method within 5–7 business days after inspection.
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

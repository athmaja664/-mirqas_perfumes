import Link from "next/link";

export const metadata = {
  title: "Shipping Policy | Mirqas Perfumes",
};

export default function ShippingPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-serif)] text-3xl font-medium text-[#9C5A2B] sm:text-4xl">
        Shipping Policy
      </h1>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-black/80">
        <p>
          We deliver across India. Orders are processed and dispatched within 24–48 hours. Standard delivery typically takes 3–7 business days depending on destination.
        </p>
      </div>
      <div className="mt-12">
        <Link href="/" className="text-sm font-medium text-[#9C5A2B] hover:underline">
          &larr; Back to Home
        </Link>
      </div>
    </main>
  );
}

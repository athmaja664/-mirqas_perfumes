import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Mirqas Perfumes",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-serif)] text-3xl font-medium text-[#9C5A2B] sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-black/60">Last updated: October 2026</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-black/80">
        <section>
          <h2 className="text-lg font-semibold text-[#111]">1. Information We Collect</h2>
          <p className="mt-2">
            At Mirqas Perfumes, we collect details necessary to fulfill your orders, including your name, email address, shipping address, and phone number when you register an account or make a purchase.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-[#111]">2. How We Use Your Information</h2>
          <p className="mt-2">
            We use your data strictly to process and deliver your orders, send order status updates, and provide customer assistance. We never sell your personal information to third parties.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-[#111]">3. Security</h2>
          <p className="mt-2">
            We protect your data with modern encryption and secure standards. Your payment details are processed through encrypted payment gateways and never stored on our servers.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-[#111]">4. Contact</h2>
          <p className="mt-2">
            If you have questions regarding our privacy practices, reach us at{" "}
            <a href="mailto:mirqasperfumes@gmail.com" className="text-[#9C5A2B] underline">
              mirqasperfumes@gmail.com
            </a>.
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

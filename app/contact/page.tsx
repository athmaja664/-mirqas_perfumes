import Link from "next/link";

export const metadata = {
  title: "Contact Us | Mirqas Perfumes",
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-serif)] text-3xl font-medium text-[#9C5A2B] sm:text-4xl">
        Contact Us
      </h1>
      <p className="mt-2 text-sm text-black/60">We would love to hear from you.</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-black/80">
        <p>
          <strong>Email:</strong>{" "}
          <a href="mailto:mirqasperfumes@gmail.com" className="text-[#9C5A2B] underline">
            mirqasperfumes@gmail.com
          </a>
        </p>
        <p>
          <strong>Phone:</strong>{" "}
          <a href="tel:+919946185557" className="text-[#9C5A2B] underline">
            +91 99461 85557
          </a>
        </p>
        <p>
          <strong>WhatsApp:</strong>{" "}
          <a href="https://wa.me/919946185557" target="_blank" rel="noopener noreferrer" className="text-[#9C5A2B] underline">
            +91 99461 85557
          </a>
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


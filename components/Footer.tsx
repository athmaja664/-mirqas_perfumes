"use client";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUp,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
} from "react-icons/fa";

// ---- Fonts and colours: same as the "Choose Your Bottle" section ----
const COPPER = "#9C5A2B";
const COPPER_LINE = "rgba(156,90,43,0.3)";
const IVORY = "#FCF8F0";
const INK = "#111111";

const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

// Put your logo without background in public/images and write its file name here.
const LOGO_SRC = "/images/logo.jpeg";

const informationLinks = [
  { label: "Refund and Returns Policy", href: "/refund-policy" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-and-conditions" },
  { label: "Contact Us", href: "/contact" },
  { label: "Shipping Policy", href: "/shipping-policy" },
];

const shopLinks = [
  { label: "Search", href: "/search" },
  { label: "All Perfumes", href: "/collections/all" },
  { label: "Best Sellers", href: "/collections/best-sellers" },
  { label: "Discovery Set", href: "/collections/discovery-set" },
  { label: "Perfume Combos", href: "/collections/combos" },
];

// The white badges get a thin border so they are visible on the ivory background.
const paymentMethods = [
  { label: "VISA", className: "bg-[#1434cb] text-white font-bold italic" },
  { label: "●●", className: "border border-[#EADFCC] bg-white text-[#eb001b] font-bold" },
  { label: "UPI", className: "border border-[#EADFCC] bg-white text-[#2874f0] font-bold" },
  { label: "G Pay", className: "border border-[#EADFCC] bg-white text-[#4285f4] font-semibold" },
];

// Shared classes (phones are small and tight, from md up the sizes grow)
const headingClass = "m-0 text-[15px] font-normal leading-tight md:text-[22px] lg:text-[26px]";
const linkClass =
  "text-[11px] leading-snug tracking-[0.03em] transition-colors hover:text-[#9C5A2B] hover:underline md:text-[15px] md:tracking-[0.04em]";
const iconClass = "shrink-0 h-[13px] w-[13px] md:h-[18px] md:w-[18px]";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      // A thin line on top shows it is a different section. Make it thicker with 2px.
      style={{
        background: IVORY,
        color: INK,
        fontFamily: sans,
        // Thin letters: 300 = light. Use 400 for normal weight.
        fontWeight: 300,
        borderTop: `1px solid ${COPPER_LINE}`,
      }}
    >
      <div className="mx-auto max-w-[1440px] px-4 pb-5 pt-8 sm:px-10 sm:pt-12 md:pb-8 lg:px-[7%] lg:pt-14">
        {/* Phones: logo block on top, then the 3 link columns side by side (like the reference).
            Large screens: 4 columns in one row. */}
        <div className="grid grid-cols-[1fr_1fr_1.35fr] gap-x-3 gap-y-6 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-12 lg:gap-y-10">
          {/* Brand */}
          <div className="col-span-3 flex flex-col items-center text-center lg:col-span-1 lg:items-start lg:text-left">
            <Link
              href="/"
              aria-label="Mirqas Perfumes home"
              className="inline-flex items-center"
            >
              <Image
                src={LOGO_SRC}
                alt="Mirqas Perfumes"
                width={400}
                height={143}
                priority
                className="h-auto w-56 object-contain sm:w-64 lg:w-80"
              />
            </Link>

            <p className="mt-3 max-w-xs text-[12px] leading-5 tracking-[0.03em] md:mt-5 md:text-[15px] md:leading-6 md:tracking-[0.04em]">
              Discover captivating fragrances crafted to express your
              personality and leave a lasting impression.
            </p>

            <p
              className="mt-2 text-[17px] font-normal leading-tight md:mt-5 md:text-[22px]"
              style={{ fontFamily: serif, color: COPPER }}
            >
              Discover Your Signature Scent.
            </p>

            <div className="mt-3 flex items-center gap-5 md:mt-5" style={{ color: COPPER }}>
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="transition-colors hover:text-[#7D4720]"
              >
                <FaFacebookF size={18} />
              </a>

              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="transition-colors hover:text-[#7D4720]"
              >
                <FaInstagram size={18} />
              </a>
            </div>
          </div>

          {/* Information */}
          <div>
            <h2 className={headingClass} style={{ fontFamily: serif, color: COPPER }}>
              Information
            </h2>

            <nav
              aria-label="Information"
              className="mt-2.5 flex flex-col items-start gap-2 md:mt-5 md:gap-3"
            >
              {informationLinks.map((link) => (
                <Link key={link.label} href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Shop */}
          <div>
            <h2 className={headingClass} style={{ fontFamily: serif, color: COPPER }}>
              Explore
            </h2>

            <nav
              aria-label="Shop"
              className="mt-2.5 flex flex-col items-start gap-2 md:mt-5 md:gap-3"
            >
              {shopLinks.map((link) => (
                <Link key={link.label} href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h2 className={headingClass} style={{ fontFamily: serif, color: COPPER }}>
              Need Help?
            </h2>

            <div className="mt-2.5 space-y-2.5 text-[11px] leading-snug tracking-[0.03em] md:mt-5 md:space-y-4 md:text-[15px] md:tracking-[0.04em]">
              <a
                href="mailto:mirqasperfumes@gmail.com"
                className="flex items-start gap-1.5 transition-colors hover:text-[#9C5A2B] md:items-center md:gap-2"
              >
                <Mail className={`${iconClass} mt-px md:mt-0`} style={{ color: COPPER }} />
                <span className="break-all">mirqasperfumes@gmail.com</span>
              </a>

              <a
                href="tel:+919946185557"
                className="flex items-start gap-1.5 transition-colors hover:text-[#9C5A2B] md:items-center md:gap-2"
              >
                <Phone className={`${iconClass} mt-px md:mt-0`} style={{ color: COPPER }} />
                <span>Phone: +91 99461 85557</span>
              </a>

              <a
                href="https://wa.me/YOUR_WHATSAPP_NUMBER"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-1.5 transition-colors hover:text-[#9C5A2B] md:items-center md:gap-2"
              >
                <MessageCircle className={`${iconClass} mt-px md:mt-0`} style={{ color: COPPER }} />
                <span>WhatsApp: 9946185557</span>
              </a>

              <p className="m-0 md:leading-6">
                Questions about a fragrance or your order? We&apos;re
                here to help.
              </p>
            </div>
          </div>
        </div>

        {/* Back to top */}
        <div className="mt-6 flex justify-center md:mt-10">
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-[#7D4720] md:h-12 md:w-12"
            style={{ background: COPPER }}
          >
            <ArrowUp size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Payment methods — show only methods your store accepts */}
        <div
          className="mt-4 flex flex-wrap items-center justify-center gap-2"
          aria-label="Payment methods"
        >
          {paymentMethods.map((method) => (
            <span
              key={method.label}
              className={`flex h-6 min-w-10 items-center justify-center rounded px-2 text-[11px] md:h-7 md:text-xs ${method.className}`}
            >
              {method.label}
            </span>
          ))}
        </div>

        <div className="mt-5 border-t md:mt-8" style={{ borderColor: COPPER_LINE }} />

        {/* Copyright */}
        <div className="flex flex-col gap-2 pt-4 text-[11px] tracking-[0.03em] md:gap-4 md:pt-6 md:text-[13px] md:tracking-[0.04em] lg:flex-row lg:items-center lg:justify-between">
          <p className="m-0 text-center lg:text-left">
            © {new Date().getFullYear()} Mirqas Perfumes. All rights reserved.
          </p>

          <nav
            aria-label="Legal links"
            className="flex flex-wrap justify-center gap-x-4 gap-y-1"
          >
            <Link
              href="/privacy-policy"
              className="transition-colors hover:text-[#9C5A2B]"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms-and-conditions"
              className="transition-colors hover:text-[#9C5A2B]"
            >
              Terms &amp; Conditions
            </Link>

            <Link
              href="/contact"
              className="transition-colors hover:text-[#9C5A2B]"
            >
              Contact Us
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
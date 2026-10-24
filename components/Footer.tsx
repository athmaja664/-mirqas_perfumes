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

const paymentMethods = [
  { label: "VISA", className: "bg-[#1434cb] text-white font-bold italic" },
  { label: "●●", className: "bg-white text-[#eb001b] font-bold" },
  { label: "UPI", className: "bg-white text-[#2874f0] font-bold" },
  { label: "G Pay", className: "bg-white text-[#4285f4] font-semibold" },
];

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-black text-[#C9954F]">
      <div className="mx-auto max-w-[1440px] px-6 pb-8 pt-14 sm:px-10 sm:pt-16 lg:px-[7%]">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand */}
          <div>
            <Link
              href="/"
              aria-label="Mirqas Perfumes home"
              className="inline-flex items-center"
            >
              <Image
                src="/images/logo.jpeg"
                alt="Mirqas Perfumes"
                width={280}
                height={100}
                priority
                className="h-auto w-56 object-contain sm:w-64"
              />
            </Link>

            <p className="mt-5 max-w-xs text-base leading-6 text-neutral-300">
              Discover captivating fragrances crafted to express your
              personality and leave a lasting impression.
            </p>

            <p className="mt-5 text-sm text-neutral-300">
              Discover Your Signature Scent.
            </p>

            <div className="mt-5 flex items-center gap-5">
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="transition-colors hover:text-neutral-400"
              >
                <FaFacebookF size={21} />
              </a>

              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="transition-colors hover:text-neutral-400"
              >
                <FaInstagram size={21} />
              </a>
            </div>
          </div>

          {/* Information */}
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">
              Information
            </h2>

            <nav
              aria-label="Information"
              className="mt-5 flex flex-col items-start gap-3"
            >
              {informationLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-base text-neutral-300 transition-colors hover:text-white hover:underline"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Shop */}
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">
              Explore
            </h2>

            <nav
              aria-label="Shop"
              className="mt-5 flex flex-col items-start gap-3"
            >
              {shopLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-base text-neutral-300 transition-colors hover:text-white hover:underline"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">
              Need Help?
            </h2>

            <div className="mt-5 space-y-4 text-base text-neutral-300">
              <a
                href="mailto:mirqasperfumes@gmail.com"
                className="flex items-center gap-2 font-semibold transition-colors hover:text-white"
              >
                <Mail size={18} className="shrink-0" />
                <span className="break-all">
                 mirqasperfumes@gmail.com
                </span>
              </a>

              <a
                href="tel:+919946185557"
                 className="flex items-center gap-2 font-semibold transition-colors hover:text-white"
              >
                <Phone size={18} className="shrink-0" />
                Phone: +91 99461 85557
              </a>

              <a
                href="https://wa.me/YOUR_WHATSAPP_NUMBER"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition-colors hover:text-white"
              >
                <MessageCircle size={19} className="shrink-0" />
                WhatsApp: 9946185557
              </a>

              <p className="leading-6">
                Questions about a fragrance or your order? We&apos;re
                here to help.
              </p>
            </div>
          </div>
        </div>

        {/* Back to top */}
        <div className="mt-14 flex justify-center">
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform hover:-translate-y-1"
          >
            <ArrowUp size={23} strokeWidth={2.5} />
          </button>
        </div>

        {/* Payment methods — show only methods your store accepts */}
        <div
          className="mt-5 flex flex-wrap items-center justify-center gap-2"
          aria-label="Payment methods"
        >
          {paymentMethods.map((method) => (
            <span
              key={method.label}
              className={`flex h-7 min-w-10 items-center justify-center rounded px-2 text-xs ${method.className}`}
            >
              {method.label}
            </span>
          ))}
        </div>

        <div className="mt-8 border-t border-neutral-800" />

        {/* Copyright */}
        <div className="flex flex-col gap-4 pt-6 text-sm text-neutral-400 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-center lg:text-left">
            © {new Date().getFullYear()} Mirqas Perfumes. All rights reserved.
          </p>

          <nav
            aria-label="Legal links"
            className="flex flex-wrap justify-center gap-x-4 gap-y-2"
          >
            <Link
              href="/privacy-policy"
              className="transition-colors hover:text-white"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms-and-conditions"
              className="transition-colors hover:text-white"
            >
              Terms &amp; Conditions
            </Link>

            <Link
              href="/contact"
              className="transition-colors hover:text-white"
            >
              Contact Us
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
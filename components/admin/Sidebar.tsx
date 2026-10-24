"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const svg = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const links = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <svg {...svg}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: (
      <svg {...svg}>
        <path d="M6 7h12l1 13H5L6 7z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
    ),
  },
  {
    href: "/admin/products",
    label: "Products (Edit / Delete)",
    icon: (
      <svg {...svg}>
        <path d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    ),
  },
  {
    href: "/admin/products/new",
    label: "Add New Product",
    icon: (
      <svg {...svg}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    href: "/oud-arabian",
    label: "View the Site",
    external: true,
    icon: (
      <svg {...svg}>
        <path d="M14 4h6v6" />
        <path d="M20 4l-9 9" />
        <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
      </svg>
    ),
  },
];

function Tooltip({ text }: { text: string }) {
  return (
    <span className="pointer-events-none absolute left-full z-50 ml-4 whitespace-nowrap rounded-lg border border-white/5 bg-[#232325] px-3 py-1.5 text-xs text-[#E0B27A] opacity-0 shadow-lg transition group-hover:opacity-100">
      {text}
    </span>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative z-20 flex w-[84px] shrink-0 flex-col items-center border-r border-white/5 bg-[#101011] py-6">
      {/* Home button */}
      <Link
        href="/admin"
        className="group relative mb-10 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#EBCB9A] to-[#B8804A] text-[#1a1208] shadow-[0_6px_18px_rgba(200,144,90,0.35)]"
      >
        <svg {...svg}>
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10h14V10" />
        </svg>
        <Tooltip text="Admin Home" />
      </Link>

      {/* Menu icons */}
      <nav className="flex flex-1 flex-col items-center gap-3">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              target={l.external ? "_blank" : undefined}
              className={`group relative flex h-12 w-12 items-center justify-center rounded-xl transition ${
                active
                  ? "bg-[#232325] text-[#EBCB9A]"
                  : "text-[#C8905A]/70 hover:bg-[#1b1b1d] hover:text-[#EBCB9A]"
              }`}
            >
              {active && (
                <span className="absolute -left-[18px] h-6 w-1 rounded-r-full bg-gradient-to-b from-[#EBCB9A] to-[#B8804A]" />
              )}
              {l.icon}
              <Tooltip text={l.label} />
            </Link>
          );
        })}
      </nav>

      {/* Bottom: bell + avatar */}
      <div className="flex flex-col items-center gap-4">
        <button className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-white/5 bg-[#1b1b1d] text-[#C8905A]">
          <svg {...svg} width={20} height={20}>
            <path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4l2-2z" />
            <path d="M10 21h4" />
          </svg>
          <Tooltip text="Notifications" />
        </button>
        <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#C8905A] bg-[#232325] text-sm font-medium text-[#EBCB9A]">
          A
        </div>
      </div>
    </aside>
  );
}
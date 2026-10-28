// Colours and fonts match the "Choose Your Bottle" section.
const COPPER = "#9C5A2B";
const COPPER_SOFT = "rgba(156,90,43,0.45)";
const INK = "#111111";

const serif = '"Cormorant Garamond", "Playfair Display", Georgia, serif';
const sans = "Inter, system-ui, sans-serif";

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  // Smaller icon on phones, original size from tablet up.
  className: "h-[11px] w-[11px] md:h-[20px] md:w-[20px]",
};

const TruckIcon = () => (
  <svg {...svgProps}>
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M15 18H9" />
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
    <circle cx="17" cy="18" r="2" />
    <circle cx="7" cy="18" r="2" />
  </svg>
);

const ReturnIcon = () => (
  <svg {...svgProps}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const CardIcon = () => (
  <svg {...svgProps}>
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
);

const ShieldIcon = () => (
  <svg {...svgProps}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const StarIcon = () => (
  <svg {...svgProps}>
    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
  </svg>
);

const benefits = [
  { title: "Free Shipping", text: "On all orders over ₹1,500", Icon: TruckIcon },
  { title: "Easy Return", text: "3-day conditional return", Icon: ReturnIcon },
  { title: "COD Available", text: "Pay when it arrives", Icon: CardIcon },
  { title: "Genuine Products", text: "100% authentic, always", Icon: ShieldIcon },
  { title: "4.8★ Rated", text: "on Google & Website", Icon: StarIcon },
];

export default function TrustBenefits() {
  return (
    <section
      aria-label="Why shop with Mirqas Perfumes"
      className="w-full"
      style={{ background: "#FCF8F0", fontFamily: sans }}
    >
      {/* Phones: 3 items per row, smaller icons, tighter spacing, so the section is much shorter.
          Tablet and desktop keep the original look. */}
      <ul className="mx-auto flex max-w-[1600px] flex-wrap justify-center gap-y-2 px-2 py-3 md:gap-y-6 md:px-8 md:py-8 lg:px-12 lg:py-10">
        {benefits.map(({ title, text, Icon }) => (
          <li
            key={title}
            className="group flex w-1/3 flex-col items-center px-1 text-center md:w-1/3 md:px-2 lg:w-1/5"
          >
            <span
              className="flex h-[24px] w-[24px] items-center justify-center rounded-full border bg-transparent transition-all duration-300 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100 md:h-[48px] md:w-[48px]"
              style={{ borderColor: COPPER_SOFT, color: COPPER }}
            >
              <span className="transition-colors duration-300 group-hover:text-[#7D4720] motion-reduce:transition-none">
                <Icon />
              </span>
            </span>

            <h3
              className="mt-1 text-[12px] font-medium leading-tight md:mt-3 md:text-[20px] md:leading-snug lg:text-[22px]"
              style={{
                fontFamily: serif,
                color: COPPER,
                // Cormorant Garamond uses old-style numbers (the 4 drops below the line). This makes them straight.
                fontVariantNumeric: "lining-nums",
                fontFeatureSettings: '"lnum" 1',
              }}
            >
              {title}
            </h3>
            <p
              className="mt-0.5 max-w-[18ch] text-[9px] leading-tight md:mt-1 md:max-w-[22ch] md:text-[14px] md:leading-snug"
              style={{ fontFamily: sans, color: INK, letterSpacing: "0.06em" }}
            >
              {text}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
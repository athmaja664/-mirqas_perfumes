import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/models/Order";

export const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-[#F3E7D5] text-[#7d4720]",
  confirmed: "bg-[#E3EEF8] text-[#1F4E79]",
  shipped: "bg-[#EDE7F6] text-[#4A2C7A]",
  delivered: "bg-[#E3F2E6] text-[#1F7A3A]",
  cancelled: "bg-[#F8E3E0] text-[#A32A1F]",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${STATUS_STYLE[status]}`}
    >
      {label(status)}
    </span>
  );
}

export function paymentText(method: PaymentMethod, status: PaymentStatus) {
  const m = method === "cod" ? "Cash on delivery" : "Razorpay";
  return `${m} · ${label(status)}`;
}
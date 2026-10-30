// Money is saved in PAISE. This shows it like Rs. 1,499.00
export const formatPaise = (paise: number) =>
  "Rs. " + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
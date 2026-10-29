// Prices are stored in paise (149900 = ₹1,499). Use this everywhere a price is shown.
export const rupees = (paise: number) => "₹" + (paise / 100).toLocaleString("en-IN");
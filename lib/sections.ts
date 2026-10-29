// One list that matches the navbar. Edit here and the form, validation and API all follow.
export const SHOP_SECTIONS = [
  { value: "shop-all", label: "Shop All Perfumes" },
  { value: "men", label: "Men (For Him)" },
  { value: "women", label: "Women (For Her)" },
  { value: "unisex", label: "Unisex" },
  { value: "luxury", label: "Luxury Collection" },
  { value: "oud-arabian", label: "Oud & Arabian" },
  { value: "gift-sets", label: "Gift Sets" },
  // { value: "new-arrivals", label: "New Arrivals" },
];

// The Collections mega menu (fragrance families)
export const COLLECTION_SECTIONS = [
  { value: "oud-woody", label: "Oud & Woody" },
  { value: "fresh-aquatic", label: "Fresh & Aquatic" },
  { value: "floral", label: "Floral" },
  { value: "citrus-fruity", label: "Citrus & Fruity" },
  { value: "amber-spicy", label: "Amber & Spicy" },
  { value: "musk-powdery", label: "Musk & Powdery" },
  { value: "sweet-gourmand", label: "Sweet & Gourmand" },
];

export const SECTION_VALUES = [...SHOP_SECTIONS.map((s) => s.value), "new-arrivals"];
export const COLLECTION_VALUES = COLLECTION_SECTIONS.map((s) => s.value);
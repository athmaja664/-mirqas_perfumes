export const CATEGORIES = [
  "Best Sellers",
  "Oud & Woody",
  "Fresh & Aquatic",
  "Floral",
  "Citrus & Fruity",
  "Amber & Spicy",
  "Musk & Powdery",
  "Sweet & Gourmand",
] as const;

export type Category = (typeof CATEGORIES)[number];
export type FragranceFamily = Exclude<Category, "Best Sellers">;

export interface Product {
  id?: string;
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  image: string; // default static image
  video?: string; // optional hover video (plays on hover, image shows otherwise)
  rating?: number;
  reviewCount?: number;
  category: FragranceFamily;
  isBestSeller?: boolean;
  href?: string;
}

// Drawn placeholder bottle, used only when an image field is empty or missing
const bottle = (tint: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 130"><rect x="38" y="4" width="24" height="16" rx="3" fill="#B87333"/><rect x="44" y="20" width="12" height="10" fill="#8F5230"/><rect x="14" y="30" width="72" height="96" rx="12" fill="${tint}" stroke="#B87333" stroke-width="2"/><rect x="26" y="62" width="48" height="36" fill="none" stroke="#FFFFFF" stroke-opacity=".75"/></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
};

interface Item {
  name: string;
  image?: string; // this card's own image (URL or /images/xxx.jpg)
  video?: string; // this card's own hover video (/videos/xxx.mp4). Leave out = image only
  price?: number;
  originalPrice?: number;
  bestSeller?: boolean;
}

// ---------- EDIT EACH CARD: its own image + (optional) its own video ----------
// To add a video to a card, add:  video: "/videos/your-file.mp4"
// Save the file in  public/videos/
const families: Record<FragranceFamily, { tint: string; items: Item[] }> = {
  "Oud & Woody": {
    tint: "#D9BFA0",
    items: [
      {
        name: "Royal Oud",
        image: "/images/perfume-one.png",
        video: "/videos/perfume-one.mp4", 
        bestSeller: true,
      },
      { name: "Smoked Cedar", image: "/images/perfume-two.png",  video: "/videos/perfume-two.mp4"},
      { name: "Amber Wood", image: "/images/perfume-three.png",  video: "/videos/perfume-three.mp4" },
      { name: "Dark Sandal", image: "/images/perfume-four.png",  video: "/videos/perfume-four.mp4" },
      { name: "Oud Noir", image: "/images/perfume-five.png",  video: "/videos/perfume-five.mp4" },
    ],
  },
  "Fresh & Aquatic": {
    tint: "#CFE0E4",
    items: [
         { name: "Smoked Cedar", image: "/images/perfume-two.png",  video: "/videos/perfume-two.mp4", bestSeller: true,},
    
        {
        name: "Royal Oud",
        image: "/images/perfume-one.png",
        video: "/videos/perfume-one.mp4", 
       
      },
      { name: "Amber Wood", image: "/images/perfume-three.png",  video: "/videos/perfume-three.mp4" },
      { name: "Dark Sandal", image: "/images/perfume-four.png",  video: "/videos/perfume-four.mp4" },
      { name: "Oud Noir", image: "/images/perfume-five.png",  video: "/videos/perfume-five.mp4" },
    ],
  },
  Floral: {
    tint: "#F1D5D8",
    items: [
     {
        name: "Royal Oud",
        image: "/images/perfume-one.png",
        video: "/videos/perfume-one.mp4", 
       
      },
      { name: "Smoked Cedar", image: "/images/perfume-two.png",  video: "/videos/perfume-two.mp4"},
      { name: "Amber Wood", image: "/images/perfume-three.png",  video: "/videos/perfume-three.mp4" , bestSeller: true,},
      { name: "Dark Sandal", image: "/images/perfume-four.png",  video: "/videos/perfume-four.mp4" },
      { name: "Oud Noir", image: "/images/perfume-five.png",  video: "/videos/perfume-five.mp4" },
    ],
  },
  "Citrus & Fruity": {
    tint: "#F3E2A9",
    items: [
      {
        name: "Royal Oud",
        image: "/images/perfume-one.png",
        video: "/videos/perfume-one.mp4", 
       
      },
      { name: "Smoked Cedar", image: "/images/perfume-two.png",  video: "/videos/perfume-two.mp4"},
      { name: "Amber Wood", image: "/images/perfume-three.png",  video: "/videos/perfume-three.mp4" },
      { name: "Dark Sandal", image: "/images/perfume-four.png",  video: "/videos/perfume-four.mp4", bestSeller: true },
      { name: "Oud Noir", image: "/images/perfume-five.png",  video: "/videos/perfume-five.mp4" },
    ],
  },
  "Amber & Spicy": {
    tint: "#E2B27A",
    items: [
    {
        name: "Royal Oud",
        image: "/images/perfume-one.png",
        video: "/videos/perfume-one.mp4", 
        
      },
      { name: "Smoked Cedar", image: "/images/perfume-two.png",  video: "/videos/perfume-two.mp4"},
      { name: "Amber Wood", image: "/images/perfume-three.png",  video: "/videos/perfume-three.mp4" },
      { name: "Dark Sandal", image: "/images/perfume-four.png",  video: "/videos/perfume-four.mp4" },
      { name: "Oud Noir", image: "/images/perfume-five.png",  video: "/videos/perfume-five.mp4" , bestSeller: true,},
    ],
  },
  "Musk & Powdery": {
    tint: "#EADFD3",
    items: [
     {
        name: "Royal Oud",
        image: "/images/perfume-one.png",
        video: "/videos/perfume-one.mp4", 
        bestSeller: true,
      },
      { name: "Smoked Cedar", image: "/images/perfume-two.png",  video: "/videos/perfume-two.mp4"},
      { name: "Amber Wood", image: "/images/perfume-three.png",  video: "/videos/perfume-three.mp4" },
      { name: "Dark Sandal", image: "/images/perfume-four.png",  video: "/videos/perfume-four.mp4" },
      { name: "Oud Noir", image: "/images/perfume-five.png",  video: "/videos/perfume-five.mp4" },
    ],
  },
  "Sweet & Gourmand": {
    tint: "#E7C9B0",
    items: [
     {
        name: "Royal Oud",
        image: "/images/perfume-one.png",
        video: "/videos/perfume-one.mp4", 
        bestSeller: true,
      },
      { name: "Smoked Cedar", image: "/images/perfume-two.png",  video: "/videos/perfume-two.mp4"},
      { name: "Amber Wood", image: "/images/perfume-three.png",  video: "/videos/perfume-three.mp4" },
      { name: "Dark Sandal", image: "/images/perfume-four.png",  video: "/videos/perfume-four.mp4" },
      { name: "Oud Noir", image: "/images/perfume-five.png",  video: "/videos/perfume-five.mp4" },
    ],
  },
};

// ---------- Builds the final product list (no need to edit below) ----------
export const products: Product[] = (Object.keys(families) as FragranceFamily[]).flatMap(
  (family) =>
    families[family].items.map((item, i) => {
      const price = item.price ?? 1499 + i * 400;
      return {
        name: item.name,
        brand: "Mirqas",
        price,
        originalPrice: item.originalPrice ?? price + 800,
        image: (item.image ?? "").trim() || bottle(families[family].tint),
        video: item.video?.trim() || undefined, // missing or "" = no video
        rating: Math.round((4.4 + (i % 5) * 0.1) * 10) / 10,
        reviewCount: 12 + i * 7,
        category: family,
        isBestSeller: item.bestSeller === true,
      };
    })
);
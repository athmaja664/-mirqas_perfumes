import { Schema, model, models, type Model } from "mongoose";

export interface IProduct {
  name: string;
  slug: string;
  brand: string;
  description: string;
  price: number; // paise
  salePrice?: number | null; // paise
  category: string;
  images: string[];
  video?: string;
  stock: number;
  isActive: boolean;
  isBestSeller: boolean;
  gender: "Men" | "Women" | "Unisex";
  occasion: string[];
  family: string;
  notes: string[];
  badge: string;
  isFeatured: boolean;
  sales: number;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    brand: { type: String, default: "Mirqas", trim: true, maxlength: 80 },
    description: { type: String, default: "", trim: true, maxlength: 3000 },
    price: { type: Number, required: true, min: 1, validate: Number.isInteger },
    salePrice: { type: Number, min: 1, validate: (v: number | null) => v == null || Number.isInteger(v), default: null },
    category: { type: String, required: true, index: true },
    images: { type: [String], default: [] },
    video: { type: String, default: "" },
    stock: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    isActive: { type: Boolean, default: true, index: true },
    isBestSeller: { type: Boolean, default: false },
    gender: { type: String, enum: ["Men", "Women", "Unisex"], default: "Unisex", index: true },
    occasion: { type: [String], default: [] },
    family: { type: String, default: "" },
    notes: { type: [String], default: [] },
    badge: { type: String, default: "", maxlength: 40 },
    isFeatured: { type: Boolean, default: false },
    sales: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

ProductSchema.index({ name: "text", brand: "text" });

export const Product: Model<IProduct> =
  (models.Product as Model<IProduct>) || model<IProduct>("Product", ProductSchema);
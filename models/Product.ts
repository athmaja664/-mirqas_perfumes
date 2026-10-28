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
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    brand: { type: String, default: "Mirqas", trim: true, maxlength: 80 },
    description: { type: String, default: "", trim: true, maxlength: 3000 },
    price: { type: Number, required: true, min: 1, validate: Number.isInteger },
    salePrice: { type: Number, min: 1, validate: Number.isInteger, default: null },
    category: { type: String, required: true, index: true },
    images: { type: [String], default: [] },
    video: { type: String, default: "" },
    stock: { type: Number, default: 0, min: 0, validate: Number.isInteger },
    isActive: { type: Boolean, default: true, index: true },
    isBestSeller: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ProductSchema.index({ name: "text", brand: "text" });

export const Product: Model<IProduct> =
  (models.Product as Model<IProduct>) || model<IProduct>("Product", ProductSchema);
import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IReview {
  product: Types.ObjectId;
  user: Types.ObjectId;
  userName: string; // the customer's name when the review was written
  rating: number; // 1 to 5
  title: string;
  comment: string;
  images: string[]; // /api/uploads/<name>.jpg|png|webp
  video: string; // /api/uploads/<name>.mp4|webm, or ""
  status: "published" | "hidden"; // "hidden" lets an admin remove a review later without deleting it
}

const ReviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true, trim: true, maxlength: 80 },
    rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
    title: { type: String, default: "", trim: true, maxlength: 100 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
    images: { type: [String], default: [] },
    video: { type: String, default: "" },
    status: { type: String, enum: ["published", "hidden"], default: "published", index: true },
  },
  { timestamps: true }
);

// One review per customer per product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });
ReviewSchema.index({ product: 1, status: 1, createdAt: -1 });

export const Review: Model<IReview> =
  (models.Review as Model<IReview>) || model<IReview>("Review", ReviewSchema);
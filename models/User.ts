import { Schema, model, models, type Model } from "mongoose";

export interface IUser {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: "customer" | "admin";
  // true only for the main admin (the owner). The owner can always manage admins.
  isOwner: boolean;
  // true when the owner has allowed this admin to add and remove admins.
  canManageAdmins: boolean;
  isActive: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    isOwner: { type: Boolean, default: false },
    canManageAdmins: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User: Model<IUser> = (models.User as Model<IUser>) || model<IUser>("User", UserSchema);
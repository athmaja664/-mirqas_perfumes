import { Schema, model, models, type Model, type Types } from "mongoose";

// One saved delivery address for each customer
export interface IAddress {
  userId: Types.ObjectId;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

const AddressSchema = new Schema<IAddress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, default: "", trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    state: { type: String, required: true, trim: true, maxlength: 80 },
    pincode: { type: String, required: true, trim: true, maxlength: 10 },
  },
  { timestamps: true }
);

export const Address: Model<IAddress> =
  (models.Address as Model<IAddress>) || model<IAddress>("Address", AddressSchema);
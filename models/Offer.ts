import { DataTypes, Model, type Optional } from "sequelize";
import { getSequelize } from "@/lib/db";
import { Product } from "./Product";

export type OfferType = "quantity" | "percentage" | "fixed";
export type OfferStatus = "draft" | "published" | "unpublished";

export interface IOffer {
  id: string;
  title: string;
  description: string;
  offerType: OfferType;
  offerPrice: number | null; // in paise (for quantity-based bundle price)
  discountValue: number | null; // percentage e.g. 15 for 15%, or fixed amount in paise
  percentageIncrease: number | null; // percentage price scaling for each subsequent bottle size (15ml, 30ml, 50ml, 100ml)
  requiredQuantity: number;
  eligibleSizes: string[];
  allowMixedVariants: boolean;
  applicableToAll: boolean;
  displayHomepage: boolean;
  displayListing: boolean;
  displayProductDetails: boolean;
  bannerImage: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: OfferStatus;
  products?: Product[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type OfferCreationAttributes = Optional<
  IOffer,
  | "id"
  | "description"
  | "offerPrice"
  | "discountValue"
  | "percentageIncrease"
  | "requiredQuantity"
  | "eligibleSizes"
  | "allowMixedVariants"
  | "applicableToAll"
  | "displayHomepage"
  | "displayListing"
  | "displayProductDetails"
  | "bannerImage"
  | "startDate"
  | "endDate"
  | "status"
  | "products"
  | "createdAt"
  | "updatedAt"
>;

function ensureArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return val ? [val] : [];
    }
  }
  return [];
}

export class Offer extends Model<IOffer, OfferCreationAttributes> implements IOffer {
  declare id: string;
  declare title: string;
  declare description: string;
  declare offerType: OfferType;
  declare offerPrice: number | null;
  declare discountValue: number | null;
  declare percentageIncrease: number | null;
  declare requiredQuantity: number;
  declare eligibleSizes: string[];
  declare allowMixedVariants: boolean;
  declare applicableToAll: boolean;
  declare displayHomepage: boolean;
  declare displayListing: boolean;
  declare displayProductDetails: boolean;
  declare bannerImage: string | null;
  declare startDate: Date | null;
  declare endDate: Date | null;
  declare status: OfferStatus;
  declare products?: Product[];
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export interface IOfferProduct {
  id: string;
  offerId: string;
  productId: string;
  createdAt?: Date;
}

export type OfferProductCreationAttributes = Optional<IOfferProduct, "id" | "createdAt">;

export class OfferProduct extends Model<IOfferProduct, OfferProductCreationAttributes> implements IOfferProduct {
  declare id: string;
  declare offerId: string;
  declare productId: string;
  declare readonly createdAt: Date;
}

const sequelize = getSequelize();

Offer.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "",
    },
    offerType: {
      type: DataTypes.ENUM("quantity", "percentage", "fixed"),
      allowNull: false,
      defaultValue: "quantity",
    },
    offerPrice: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      get() {
        const val = this.getDataValue("discountValue");
        return val != null ? Number(val) : null;
      },
    },
    percentageIncrease: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: null,
      get() {
        const val = this.getDataValue("percentageIncrease");
        return val != null ? Number(val) : null;
      },
    },
    requiredQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    eligibleSizes: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      get() {
        return ensureArray(this.getDataValue("eligibleSizes"));
      },
      set(val: unknown) {
        this.setDataValue("eligibleSizes", ensureArray(val));
      },
    },
    allowMixedVariants: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    applicableToAll: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    displayHomepage: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    displayListing: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    displayProductDetails: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    bannerImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    status: {
      type: DataTypes.ENUM("draft", "published", "unpublished"),
      allowNull: false,
      defaultValue: "draft",
    },
  },
  {
    sequelize,
    modelName: "Offer",
    tableName: "offers",
    timestamps: true,
  }
);

OfferProduct.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    offerId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    productId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "OfferProduct",
    tableName: "offer_products",
    timestamps: true,
    updatedAt: false,
  }
);

// Define associations
Offer.belongsToMany(Product, {
  through: OfferProduct,
  foreignKey: "offerId",
  otherKey: "productId",
  as: "products",
});

Product.belongsToMany(Offer, {
  through: OfferProduct,
  foreignKey: "productId",
  otherKey: "offerId",
  as: "offers",
});

Offer.hasMany(OfferProduct, { foreignKey: "offerId", as: "offerProducts" });
OfferProduct.belongsTo(Offer, { foreignKey: "offerId", as: "offer" });
OfferProduct.belongsTo(Product, { foreignKey: "productId", as: "product" });


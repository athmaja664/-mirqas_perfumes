import { DataTypes, Model, type Optional } from "sequelize";
import { getSequelize } from "@/lib/db";

export interface IProduct {
  id: string;
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
  sections: string[];
  collections: string[];
  showInNewArrivals: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ProductCreationAttributes = Optional<
  IProduct,
  | "id"
  | "brand"
  | "description"
  | "salePrice"
  | "images"
  | "video"
  | "stock"
  | "isActive"
  | "isBestSeller"
  | "gender"
  | "occasion"
  | "family"
  | "notes"
  | "badge"
  | "isFeatured"
  | "sales"
  | "sections"
  | "collections"
  | "showInNewArrivals"
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

export class Product extends Model<IProduct, ProductCreationAttributes> implements IProduct {
  declare id: string;
  declare name: string;
  declare slug: string;
  declare brand: string;
  declare description: string;
  declare price: number;
  declare salePrice: number | null;
  declare category: string;
  declare images: string[];
  declare video: string;
  declare stock: number;
  declare isActive: boolean;
  declare isBestSeller: boolean;
  declare gender: "Men" | "Women" | "Unisex";
  declare occasion: string[];
  declare family: string;
  declare notes: string[];
  declare badge: string;
  declare isFeatured: boolean;
  declare sales: number;
  declare sections: string[];
  declare collections: string[];
  declare showInNewArrivals: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  get _id(): string {
    return this.id;
  }

  // Compatibility helpers
  static async exists(filter: Record<string, unknown>): Promise<boolean> {
    const where: Record<string, unknown> = {};
    if (filter._id) where.id = filter._id;
    if (filter.id) where.id = filter.id;
    if (filter.slug) where.slug = filter.slug;
    const count = await Product.count({ where });
    return count > 0;
  }

  static async findById(id: string): Promise<Product | null> {
    return Product.findByPk(id);
  }
}

const sequelize = getSequelize();

Product.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    brand: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: "Mirqas",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "",
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    salePrice: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    category: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    images: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      get() {
        return ensureArray(this.getDataValue("images"));
      },
      set(val: unknown) {
        this.setDataValue("images", ensureArray(val));
      },
    },
    video: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "",
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isBestSeller: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    gender: {
      type: DataTypes.ENUM("Men", "Women", "Unisex"),
      allowNull: false,
      defaultValue: "Unisex",
    },
    occasion: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      get() {
        return ensureArray(this.getDataValue("occasion"));
      },
      set(val: unknown) {
        this.setDataValue("occasion", ensureArray(val));
      },
    },
    family: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: "",
    },
    notes: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      get() {
        return ensureArray(this.getDataValue("notes"));
      },
      set(val: unknown) {
        this.setDataValue("notes", ensureArray(val));
      },
    },
    badge: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: "",
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    sales: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    sections: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: ["shop-all"],
      get() {
        const arr = ensureArray(this.getDataValue("sections"));
        return arr.length ? arr : ["shop-all"];
      },
      set(val: unknown) {
        this.setDataValue("sections", ensureArray(val));
      },
    },
    collections: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      get() {
        return ensureArray(this.getDataValue("collections"));
      },
      set(val: unknown) {
        this.setDataValue("collections", ensureArray(val));
      },
    },
    showInNewArrivals: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "Product",
    tableName: "products",
    timestamps: true,
  }
);
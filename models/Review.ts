import { DataTypes, Model, type Optional } from "sequelize";
import { getSequelize } from "@/lib/db";
import { Product } from "./Product";
import { User } from "./User";

export interface IReview {
  id?: string;
  product?: string;
  productId: string;
  user?: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  video: string;
  status: "published" | "hidden";
  createdAt?: Date;
  updatedAt?: Date;
}

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

export type ReviewCreationAttributes = Optional<
  IReview,
  "id" | "title" | "images" | "video" | "status" | "createdAt" | "updatedAt" | "product" | "user"
>;

export class Review extends Model<IReview, ReviewCreationAttributes> implements IReview {
  declare id: string;
  declare productId: string;
  declare userId: string;
  declare userName: string;
  declare rating: number;
  declare title: string;
  declare comment: string;
  declare images: string[];
  declare video: string;
  declare status: "published" | "hidden";
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  get _id(): string {
    return this.id;
  }

  get product(): string {
    return this.productId;
  }

  set product(val: string) {
    this.productId = val;
  }

  get user(): string {
    return this.userId;
  }

  set user(val: string) {
    this.userId = val;
  }
}

const sequelize = getSequelize();

Review.init(
    {
      id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      productId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
          model: Product,
          key: "id",
        },
        onDelete: "CASCADE",
      },
      userId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
          model: User,
          key: "id",
        },
        onDelete: "CASCADE",
      },
      userName: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      rating: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "",
      },
      comment: {
        type: DataTypes.TEXT,
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
      status: {
        type: DataTypes.ENUM("published", "hidden"),
        allowNull: false,
        defaultValue: "published",
      },
    },
    {
      sequelize,
      tableName: "reviews",
      timestamps: true,
    }
  );

  Review.belongsTo(Product, { foreignKey: "productId" });
  Review.belongsTo(User, { foreignKey: "userId" });
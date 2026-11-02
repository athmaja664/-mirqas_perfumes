import { DataTypes, Model, type Optional } from "sequelize";
import { getSequelize } from "@/lib/db";
import { User } from "./User";
import { Product } from "./Product";

export interface IWishlist {
  id?: string;
  userId: string;
  productIds?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Wishlist extends Model<IWishlist, Optional<IWishlist, "id" | "productIds" | "createdAt" | "updatedAt">> implements IWishlist {
  declare id: string;
  declare userId: string;
  declare items?: WishlistItem[];
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  get _id(): string {
    return this.id;
  }

  get productIds(): string[] {
    return this.items ? this.items.map((i) => i.productId) : [];
  }
}

export class WishlistItem extends Model<{ id?: string; wishlistId: string; productId: string; createdAt?: Date }, Optional<{ id?: string; wishlistId: string; productId: string; createdAt?: Date }, "id" | "createdAt">> {
  declare id: string;
  declare wishlistId: string;
  declare productId: string;
  declare readonly createdAt: Date;
}

const sequelize = getSequelize();

Wishlist.init(
    {
      id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      userId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        unique: true,
        references: {
          model: User,
          key: "id",
        },
        onDelete: "CASCADE",
      },
    },
    {
      sequelize,
      tableName: "wishlists",
      timestamps: true,
    }
  );

  WishlistItem.init(
    {
      id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      wishlistId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
          model: Wishlist,
          key: "id",
        },
        onDelete: "CASCADE",
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
    },
    {
      sequelize,
      tableName: "wishlist_items",
      timestamps: true,
      updatedAt: false,
    }
  );

  Wishlist.hasMany(WishlistItem, { as: "items", foreignKey: "wishlistId", onDelete: "CASCADE" });
  WishlistItem.belongsTo(Wishlist, { foreignKey: "wishlistId" });
  WishlistItem.belongsTo(Product, { foreignKey: "productId" });
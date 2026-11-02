import { DataTypes, Model, type Optional } from "sequelize";
import { getSequelize } from "@/lib/db";
import { User } from "./User";
import { Product } from "./Product";

export const MAX_QTY_PER_LINE = 10;

export interface ICartItem {
  id?: string;
  cartId?: string;
  productId: string;
  ml: number;
  qty: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICart {
  id: string;
  userId: string;
  items?: ICartItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Cart extends Model<ICart, Optional<ICart, "id" | "items" | "createdAt" | "updatedAt">> implements ICart {
  declare id: string;
  declare userId: string;
  declare items: CartItem[];
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  get _id(): string {
    return this.id;
  }
}

export class CartItem extends Model<ICartItem, Optional<ICartItem, "id" | "createdAt" | "updatedAt">> implements ICartItem {
  declare id: string;
  declare cartId: string;
  declare productId: string;
  declare ml: number;
  declare qty: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  get _id(): string {
    return this.id;
  }
}

const sequelize = getSequelize();

Cart.init(
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
      tableName: "carts",
      timestamps: true,
    }
  );

  CartItem.init(
    {
      id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      cartId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
          model: Cart,
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
      ml: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "cart_items",
      timestamps: true,
    }
  );

  Cart.hasMany(CartItem, { as: "items", foreignKey: "cartId", onDelete: "CASCADE" });
  CartItem.belongsTo(Cart, { foreignKey: "cartId" });
  CartItem.belongsTo(Product, { foreignKey: "productId" });
import { DataTypes, Model, type Optional } from "sequelize";
import { getSequelize } from "@/lib/db";

export interface IUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: "customer" | "admin";
  isOwner: boolean;
  canManageAdmins: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserCreationAttributes = Optional<
  IUser,
  "id" | "phone" | "role" | "isOwner" | "canManageAdmins" | "isActive" | "createdAt" | "updatedAt"
>;

export class User extends Model<IUser, UserCreationAttributes> implements IUser {
  declare id: string;
  declare name: string;
  declare email: string;
  declare phone: string;
  declare passwordHash: string;
  declare role: "customer" | "admin";
  declare isOwner: boolean;
  declare canManageAdmins: boolean;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  get _id(): string {
    return this.id;
  }

  // Compatibility helpers for Mongoose API
  static async exists(filter: Record<string, unknown>): Promise<boolean> {
    const where: Record<string, unknown> = {};
    if (filter._id) where.id = filter._id;
    if (filter.id) where.id = filter.id;
    if (filter.email) where.email = filter.email;
    const count = await User.count({ where });
    return count > 0;
  }

  static async findById(id: string): Promise<User | null> {
    return User.findByPk(id);
  }
}

const sequelize = getSequelize();

User.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "",
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("customer", "admin"),
      allowNull: false,
      defaultValue: "customer",
    },
    isOwner: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    canManageAdmins: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
  }
);
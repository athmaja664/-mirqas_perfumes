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
  emailVerified?: boolean;
  phoneVerified?: boolean;
  resetTokenHash?: string | null;
  resetTokenExpiry?: Date | null;
  phoneOtpHash?: string | null;
  phoneOtpExpiry?: Date | null;
  phoneOtpAttempts?: number;
  verificationTokenHash?: string | null;
  verificationTokenExpiry?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserCreationAttributes = Optional<
  IUser,
  | "id"
  | "phone"
  | "role"
  | "isOwner"
  | "canManageAdmins"
  | "isActive"
  | "emailVerified"
  | "phoneVerified"
  | "resetTokenHash"
  | "resetTokenExpiry"
  | "phoneOtpHash"
  | "phoneOtpExpiry"
  | "phoneOtpAttempts"
  | "verificationTokenHash"
  | "verificationTokenExpiry"
  | "createdAt"
  | "updatedAt"
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
  declare emailVerified: boolean;
  declare phoneVerified: boolean;
  declare resetTokenHash: string | null;
  declare resetTokenExpiry: Date | null;
  declare phoneOtpHash: string | null;
  declare phoneOtpExpiry: Date | null;
  declare phoneOtpAttempts: number;
  declare verificationTokenHash: string | null;
  declare verificationTokenExpiry: Date | null;
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
    if (filter.phone) where.phone = filter.phone;
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
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    phoneVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    resetTokenHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: null,
    },
    resetTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    phoneOtpHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: null,
    },
    phoneOtpExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    phoneOtpAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    verificationTokenHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: null,
    },
    verificationTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
  }
);

let userColumnsChecked = false;
export async function ensureUserAuthColumns() {
  if (userColumnsChecked) return;
  try {
    const seq = getSequelize();
    const columns = [
      "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `emailVerified` TINYINT(1) NOT NULL DEFAULT 0",
      "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `phoneVerified` TINYINT(1) NOT NULL DEFAULT 0",
      "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `resetTokenHash` VARCHAR(64) NULL DEFAULT NULL",
      "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `resetTokenExpiry` DATETIME(3) NULL DEFAULT NULL",
      "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `phoneOtpHash` VARCHAR(64) NULL DEFAULT NULL",
      "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `phoneOtpExpiry` DATETIME(3) NULL DEFAULT NULL",
      "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `phoneOtpAttempts` INT NOT NULL DEFAULT 0",
      "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `verificationTokenHash` VARCHAR(64) NULL DEFAULT NULL",
      "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `verificationTokenExpiry` DATETIME(3) NULL DEFAULT NULL",
    ];
    for (const sql of columns) {
      await seq.query(sql).catch(() => {});
    }
    userColumnsChecked = true;
  } catch {
    // Ignore migration catch
  }
}

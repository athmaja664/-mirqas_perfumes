import { DataTypes, Model, type Optional } from "sequelize";
import { getSequelize } from "@/lib/db";
import { User } from "./User";

export interface ISession {
  id?: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SessionCreationAttributes = Optional<ISession, "id" | "createdAt" | "updatedAt">;

export class Session extends Model<ISession, SessionCreationAttributes> implements ISession {
  declare id: string;
  declare userId: string;
  declare tokenHash: string;
  declare expiresAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  get _id(): string {
    return this.id;
  }
}

const sequelize = getSequelize();

Session.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    tokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Session",
    tableName: "sessions",
    timestamps: true,
  }
);
import { DataTypes, Model, type Optional } from "sequelize";
import { getSequelize } from "@/lib/db";
import { User } from "./User";

export interface IAddress {
  id?: string;
  userId: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AddressCreationAttributes = Optional<IAddress, "id" | "line2" | "createdAt" | "updatedAt">;

export class Address extends Model<IAddress, AddressCreationAttributes> implements IAddress {
  declare id: string;
  declare userId: string;
  declare name: string;
  declare phone: string;
  declare line1: string;
  declare line2: string;
  declare city: string;
  declare state: string;
  declare pincode: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  get _id(): string {
    return this.id;
  }
}

const sequelize = getSequelize();

Address.init(
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
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      line1: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      line2: {
        type: DataTypes.STRING(200),
        allowNull: false,
        defaultValue: "",
      },
      city: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      pincode: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "addresses",
      timestamps: true,
    }
  );

  Address.belongsTo(User, { foreignKey: "userId" });
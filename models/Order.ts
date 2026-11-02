import { DataTypes, Model, type Optional } from "sequelize";
import { getSequelize } from "@/lib/db";
import { User } from "./User";
import { Product } from "./Product";

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
export const PAYMENT_METHODS = ["cod", "razorpay"] as const;
export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface IOrderItem {
  id?: string;
  orderId?: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  ml: number;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  createdAt?: Date;
}

export interface IOrderShipping {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IStatusStep {
  id?: string;
  orderId?: string;
  status: OrderStatus;
  at: Date;
}

export interface IOrder {
  id: string;
  orderNumber: string;
  userId: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  shippingName?: string;
  shippingPhone?: string;
  shippingLine1?: string;
  shippingLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPincode?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  note: string;
  idempotencyKey?: string | null;
  items?: IOrderItem[];
  shipping?: IOrderShipping;
  statusHistory?: IStatusStep[];
  payment?: {
    method: PaymentMethod;
    status: PaymentStatus;
    razorpayOrderId: string;
    razorpayPaymentId: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export type OrderCreationAttributes = Optional<
  IOrder,
  | "id"
  | "shippingFee"
  | "status"
  | "paymentMethod"
  | "paymentStatus"
  | "razorpayOrderId"
  | "razorpayPaymentId"
  | "note"
  | "idempotencyKey"
  | "items"
  | "shipping"
  | "statusHistory"
  | "payment"
  | "createdAt"
  | "updatedAt"
>;

export class Order extends Model<IOrder, OrderCreationAttributes> implements IOrder {
  declare id: string;
  declare orderNumber: string;
  declare userId: string;
  declare subtotal: number;
  declare shippingFee: number;
  declare total: number;
  declare status: OrderStatus;
  declare shippingName: string;
  declare shippingPhone: string;
  declare shippingLine1: string;
  declare shippingLine2: string;
  declare shippingCity: string;
  declare shippingState: string;
  declare shippingPincode: string;
  declare paymentMethod: PaymentMethod;
  declare paymentStatus: PaymentStatus;
  declare razorpayOrderId: string;
  declare razorpayPaymentId: string;
  declare note: string;
  declare idempotencyKey: string | null;
  declare items?: IOrderItem[];
  declare statusHistory?: IStatusStep[];
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  get _id(): string {
    return this.id;
  }

  get shipping(): IOrderShipping {
    return {
      name: this.getDataValue("shippingName") || "",
      phone: this.getDataValue("shippingPhone") || "",
      line1: this.getDataValue("shippingLine1") || "",
      line2: this.getDataValue("shippingLine2") || "",
      city: this.getDataValue("shippingCity") || "",
      state: this.getDataValue("shippingState") || "",
      pincode: this.getDataValue("shippingPincode") || "",
    };
  }

  set shipping(val: IOrderShipping | undefined) {
    if (val) {
      this.setDataValue("shippingName", val.name || "");
      this.setDataValue("shippingPhone", val.phone || "");
      this.setDataValue("shippingLine1", val.line1 || "");
      this.setDataValue("shippingLine2", val.line2 || "");
      this.setDataValue("shippingCity", val.city || "");
      this.setDataValue("shippingState", val.state || "");
      this.setDataValue("shippingPincode", val.pincode || "");
    }
  }

  get payment(): {
    method: PaymentMethod;
    status: PaymentStatus;
    razorpayOrderId: string;
    razorpayPaymentId: string;
  } {
    return {
      method: this.getDataValue("paymentMethod") || "cod",
      status: this.getDataValue("paymentStatus") || "pending",
      razorpayOrderId: this.getDataValue("razorpayOrderId") || "",
      razorpayPaymentId: this.getDataValue("razorpayPaymentId") || "",
    };
  }

  set payment(val: { method?: PaymentMethod; status?: PaymentStatus; razorpayOrderId?: string; razorpayPaymentId?: string } | undefined) {
    if (val) {
      if (val.method) this.setDataValue("paymentMethod", val.method);
      if (val.status) this.setDataValue("paymentStatus", val.status);
      if (val.razorpayOrderId !== undefined) this.setDataValue("razorpayOrderId", val.razorpayOrderId);
      if (val.razorpayPaymentId !== undefined) this.setDataValue("razorpayPaymentId", val.razorpayPaymentId);
    }
  }

  static async findById(id: string): Promise<Order | null> {
    return Order.findByPk(id, {
      include: [
        { model: OrderItem, as: "items" },
        { model: OrderStatusHistory, as: "statusHistory" },
      ],
    });
  }
}

export class OrderItem extends Model<IOrderItem, Optional<IOrderItem, "id" | "createdAt">> implements IOrderItem {
  declare id: string;
  declare orderId: string;
  declare productId: string;
  declare slug: string;
  declare name: string;
  declare image: string;
  declare ml: number;
  declare qty: number;
  declare unitPrice: number;
  declare lineTotal: number;
  declare readonly createdAt: Date;

  get _id(): string {
    return this.id;
  }
}

export class OrderStatusHistory extends Model<IStatusStep, Optional<IStatusStep, "id">> implements IStatusStep {
  declare id: string;
  declare orderId: string;
  declare status: OrderStatus;
  declare at: Date;

  get _id(): string {
    return this.id;
  }
}

const sequelize = getSequelize();

Order.init(
    {
      id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      orderNumber: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },
      userId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
          model: User,
          key: "id",
        },
      },
      subtotal: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      shippingFee: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...ORDER_STATUSES),
        allowNull: false,
        defaultValue: "pending",
      },
      paymentMethod: {
        type: DataTypes.ENUM(...PAYMENT_METHODS),
        allowNull: false,
        defaultValue: "cod",
      },
      paymentStatus: {
        type: DataTypes.ENUM(...PAYMENT_STATUSES),
        allowNull: false,
        defaultValue: "pending",
      },
      razorpayOrderId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "",
      },
      razorpayPaymentId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "",
      },
      shippingName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "",
      },
      shippingPhone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "",
      },
      shippingLine1: {
        type: DataTypes.STRING(200),
        allowNull: false,
        defaultValue: "",
      },
      shippingLine2: {
        type: DataTypes.STRING(200),
        allowNull: false,
        defaultValue: "",
      },
      shippingCity: {
        type: DataTypes.STRING(80),
        allowNull: false,
        defaultValue: "",
      },
      shippingState: {
        type: DataTypes.STRING(80),
        allowNull: false,
        defaultValue: "",
      },
      shippingPincode: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "",
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      idempotencyKey: {
        type: DataTypes.STRING(64),
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      tableName: "orders",
      timestamps: true,
    }
  );

  OrderItem.init(
    {
      id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      orderId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
          model: Order,
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
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      image: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "",
      },
      ml: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      unitPrice: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      lineTotal: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "order_items",
      timestamps: true,
      updatedAt: false,
    }
  );

  OrderStatusHistory.init(
    {
      id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      orderId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
          model: Order,
          key: "id",
        },
        onDelete: "CASCADE",
      },
      status: {
        type: DataTypes.ENUM(...ORDER_STATUSES),
        allowNull: false,
      },
      at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "order_status_history",
      timestamps: false,
    }
  );

  Order.hasMany(OrderItem, { as: "items", foreignKey: "orderId", onDelete: "CASCADE" });
  OrderItem.belongsTo(Order, { foreignKey: "orderId" });

  Order.hasMany(OrderStatusHistory, { as: "statusHistory", foreignKey: "orderId", onDelete: "CASCADE" });
  OrderStatusHistory.belongsTo(Order, { foreignKey: "orderId" });

  Order.belongsTo(User, { foreignKey: "userId" });
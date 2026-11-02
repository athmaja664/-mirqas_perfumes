import { DataTypes, Model } from "sequelize";
import { getSequelize } from "@/lib/db";

export interface IMediaUpload {
  name: string;
  mimeType: string;
  data: Buffer;
  size: number;
}

export class MediaUpload extends Model<IMediaUpload> implements IMediaUpload {
  declare name: string;
  declare mimeType: string;
  declare data: Buffer;
  declare size: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

let initialized = false;

export function initMediaUpload(): typeof MediaUpload {
  if (initialized) return MediaUpload;

  const sequelize = getSequelize();
  MediaUpload.init(
    {
      name: {
        type: DataTypes.STRING(64),
        primaryKey: true,
      },
      mimeType: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      data: {
        type: DataTypes.BLOB("long"),
        allowNull: false,
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      tableName: "media_uploads",
      timestamps: true,
    }
  );

  initialized = true;
  return MediaUpload;
}

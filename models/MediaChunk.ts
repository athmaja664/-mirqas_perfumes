import { DataTypes, Model } from "sequelize";
import { getSequelize } from "@/lib/db";

export interface IMediaChunk {
  id?: string;
  uploadId: string;
  chunkIndex: number;
  data: Buffer;
}

export class MediaChunk extends Model<IMediaChunk> implements IMediaChunk {
  declare id: string;
  declare uploadId: string;
  declare chunkIndex: number;
  declare data: Buffer;
  declare createdAt: Date;
}

let initialized = false;

export function initMediaChunk(): typeof MediaChunk {
  if (initialized) return MediaChunk;

  const sequelize = getSequelize();
  MediaChunk.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      uploadId: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      chunkIndex: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      data: {
        type: DataTypes.BLOB("medium"), // up to 16MB per chunk
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "media_chunks",
      timestamps: true,
      updatedAt: false,
      indexes: [
        {
          fields: ["uploadId", "chunkIndex"],
        },
      ],
    }
  );

  initialized = true;
  return MediaChunk;
}

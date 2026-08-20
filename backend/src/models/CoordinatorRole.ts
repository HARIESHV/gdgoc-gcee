import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

const coordinatorRoleSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

coordinatorRoleSchema.index({ order: 1 });

export type CoordinatorRoleDoc = Document & InferSchemaType<typeof coordinatorRoleSchema>;

export const CoordinatorRole: Model<CoordinatorRoleDoc> =
  (models.CoordinatorRole as Model<CoordinatorRoleDoc>) ||
  model<CoordinatorRoleDoc>('CoordinatorRole', coordinatorRoleSchema);

import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

const adminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type AdminDoc = Document & InferSchemaType<typeof adminSchema>;

export const Admin: Model<AdminDoc> = (models.Admin as Model<AdminDoc>) ||
  model<AdminDoc>('Admin', adminSchema);

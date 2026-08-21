import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

const adminNotificationSchema = new Schema(
  {
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

adminNotificationSchema.index({ isRead: 1 });
adminNotificationSchema.index({ createdAt: -1 });

export type AdminNotificationDoc = Document & InferSchemaType<typeof adminNotificationSchema>;

export const AdminNotification: Model<AdminNotificationDoc> =
  (models.AdminNotification as Model<AdminNotificationDoc>) ||
  model<AdminNotificationDoc>('AdminNotification', adminNotificationSchema);

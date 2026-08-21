import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    subject: { type: String, default: 'General Inquiry', trim: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

contactMessageSchema.index({ createdAt: -1 });
contactMessageSchema.index({ isRead: 1 });

export type ContactMessageDoc = Document & InferSchemaType<typeof contactMessageSchema>;

export const ContactMessage: Model<ContactMessageDoc> =
  (models.ContactMessage as Model<ContactMessageDoc>) ||
  model<ContactMessageDoc>('ContactMessage', contactMessageSchema);

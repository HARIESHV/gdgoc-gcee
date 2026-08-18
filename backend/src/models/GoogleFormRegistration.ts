import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

const googleFormRegistrationSchema = new Schema(
  {
    responseId: { type: String, sparse: true },
    formData: { type: Schema.Types.Mixed, required: true },
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    rollNumber: { type: String, default: '' },
    department: { type: String, default: '' },
    year: { type: String, default: '' },
    college: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    submittedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

googleFormRegistrationSchema.index({ responseId: 1 }, { unique: true, sparse: true });
googleFormRegistrationSchema.index({ email: 1 });
googleFormRegistrationSchema.index({ isRead: 1 });
googleFormRegistrationSchema.index({ submittedAt: -1 });

export type GoogleFormRegistrationDoc = Document & InferSchemaType<typeof googleFormRegistrationSchema>;

export const GoogleFormRegistration: Model<GoogleFormRegistrationDoc> =
  (models.GoogleFormRegistration as Model<GoogleFormRegistrationDoc>) ||
  model<GoogleFormRegistrationDoc>('GoogleFormRegistration', googleFormRegistrationSchema);

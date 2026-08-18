import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

const googleFormSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    formUrl: { type: String, required: true, trim: true },
    type: { type: String, enum: ['registration', 'participation'], required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type GoogleFormDoc = Document & InferSchemaType<typeof googleFormSchema>;

export const GoogleForm: Model<GoogleFormDoc> =
  (models.GoogleForm as Model<GoogleFormDoc>) ||
  model<GoogleFormDoc>('GoogleForm', googleFormSchema);

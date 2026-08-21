import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

export const RESOURCE_CATEGORIES = [
  'Web Development',
  'AI/ML',
  'Cloud',
  'Git & GitHub',
  'Android',
  'Cybersecurity',
  'Open Source',
  'Programming',
  'Other',
] as const;

const resourceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    url: { type: String, required: true },
    category: { type: String, enum: RESOURCE_CATEGORIES, default: 'Other' },
    uploadedBy: { type: String, default: 'GDGoC GCEE' },
    type: { type: String, default: 'link' },
  },
  { timestamps: true }
);

resourceSchema.index({ category: 1, createdAt: -1 });

export type ResourceDoc = Document & InferSchemaType<typeof resourceSchema>;

export const Resource: Model<ResourceDoc> = (models.Resource as Model<ResourceDoc>) ||
  model<ResourceDoc>('Resource', resourceSchema);

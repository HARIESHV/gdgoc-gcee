import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

const siteSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'main' },
    membersImage: { type: String, default: '' },
  },
  { timestamps: true }
);

export type SiteSettingsDoc = Document & InferSchemaType<typeof siteSettingsSchema>;

export const SiteSettings: Model<SiteSettingsDoc> =
  (models.SiteSettings as Model<SiteSettingsDoc>) || model<SiteSettingsDoc>('SiteSettings', siteSettingsSchema);

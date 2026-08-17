import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

const campaignSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    minimumAttendancePercentage: { type: Number, default: 75, min: 0, max: 100 },
    minimumEligibleEvents: { type: Number, default: 1, min: 0 },
    releaseDate: { type: String, default: '' },
    certificateTemplate: { type: String, default: 'default' },
    status: { type: String, enum: ['DRAFT', 'ACTIVE', 'CLOSED'], default: 'DRAFT' },
    generatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

campaignSchema.index({ startDate: 1, endDate: 1 });

export type CertificateCampaignDoc = Document & InferSchemaType<typeof campaignSchema>;

export const CertificateCampaign: Model<CertificateCampaignDoc> =
  (models.CertificateCampaign as Model<CertificateCampaignDoc>) ||
  model<CertificateCampaignDoc>('CertificateCampaign', campaignSchema);

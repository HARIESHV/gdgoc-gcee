import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

export const CERTIFICATE_STATUSES = ['VALID', 'REVOKED'] as const;

const certificateSchema = new Schema(
  {
    certificateId: { type: String, required: true, unique: true, trim: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'CertificateCampaign', default: null },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', default: null },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, default: '' },
    organization: { type: String, default: 'GDGoC GCEE' },
    institution: { type: String, default: 'Government College of Engineering, Erode' },

    eventDate: { type: String, default: '' },
    eventName: { type: String, default: '' },

    issueDate: { type: String, default: '' },
    verificationUrl: { type: String, default: '' },
    qrCode: { type: String, default: '' },
    pdfBuffer: { type: Buffer, default: null },

    status: { type: String, enum: CERTIFICATE_STATUSES, default: 'VALID' },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: String, default: '' },
    revokeReason: { type: String, default: '' },
  },
  { timestamps: true }
);

certificateSchema.index({ certificateId: 1 }, { unique: true });
certificateSchema.index({ studentId: 1 });
certificateSchema.index({ status: 1 });

export type CertificateDoc = Document & InferSchemaType<typeof certificateSchema>;

export const Certificate: Model<CertificateDoc> = (models.Certificate as Model<CertificateDoc>) ||
  model<CertificateDoc>('Certificate', certificateSchema);

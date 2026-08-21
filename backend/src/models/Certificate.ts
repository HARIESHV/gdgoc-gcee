import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

export const CERTIFICATE_STATUSES = ['VALID', 'REVOKED'] as const;

const certificateSchema = new Schema(
  {
    certificateId: { type: String, required: true, unique: true, trim: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'CertificateCampaign', default: null },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String, required: true },
    studentEmail: { type: String, default: '' },
    organization: { type: String, default: 'GDGoC GCEE' },
    institution: { type: String, default: 'Government College of Engineering, Erode' },

    // Event-based certificates (single event linked via the student's registration + participation)
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', default: null },
    eventRegistrationId: { type: Schema.Types.ObjectId, ref: 'Registration', default: null },
    participationStatus: { type: String, enum: ['PARTICIPATED', 'NOT_PARTICIPATED'], default: 'PARTICIPATED' },
    issuedBy: { type: String, default: 'admin' },

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
// Campaign certificates: one per student per campaign.
certificateSchema.index({ studentId: 1, campaignId: 1 }, { unique: true, sparse: true });
// Event certificates: one per student per event (prevents duplicate issuance).
certificateSchema.index({ studentId: 1, eventId: 1 }, { unique: true, sparse: true });
certificateSchema.index({ eventId: 1 });
certificateSchema.index({ status: 1 });

export type CertificateDoc = Document & InferSchemaType<typeof certificateSchema>;

export const Certificate: Model<CertificateDoc> = (models.Certificate as Model<CertificateDoc>) ||
  model<CertificateDoc>('Certificate', certificateSchema);

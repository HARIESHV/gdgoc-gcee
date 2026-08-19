import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

const bulkEmailLogSchema = new Schema(
  {
    subject: { type: String, required: true },
    sentBy: { type: String, required: true },
    totalRecipients: { type: Number, required: true },
    successfulSends: { type: Number, default: 0 },
    failedSends: { type: Number, default: 0 },
    status: { type: String, enum: ['sending', 'completed', 'partial'], default: 'sending' },
    errorDetails: [
      {
        email: { type: String },
        error: { type: String },
      },
    ],
    sentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

bulkEmailLogSchema.index({ sentAt: -1 });

export type BulkEmailLogDoc = Document & InferSchemaType<typeof bulkEmailLogSchema>;

export const BulkEmailLog: Model<BulkEmailLogDoc> =
  (models.BulkEmailLog as Model<BulkEmailLogDoc>) ||
  model<BulkEmailLogDoc>('BulkEmailLog', bulkEmailLogSchema);

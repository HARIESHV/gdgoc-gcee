import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

const emailLogSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', default: null },
    eventTitle: { type: String, default: '' },
    sender: { type: String, default: 'admin' },
    recipientsCount: { type: Number, default: 0 },
    subject: { type: String, required: true },
    message: { type: String, default: '' },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    status: { type: String, enum: ['Success', 'Partial', 'Failure'], default: 'Success' },
    failedEmails: { type: [String], default: [] },
  },
  { timestamps: true }
);

emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ eventId: 1 });

export type EmailLogDoc = Document & InferSchemaType<typeof emailLogSchema>;

export const EmailLog: Model<EmailLogDoc> =
  (models.EmailLog as Model<EmailLogDoc>) || model<EmailLogDoc>('EmailLog', emailLogSchema);

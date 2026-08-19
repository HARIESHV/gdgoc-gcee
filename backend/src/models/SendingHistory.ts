import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

const sendingHistorySchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    eventType: { type: String, enum: ['registration-list-pdf', 'event-email'], required: true },
    recipientEmail: { type: String, required: true },
    recipientName: { type: String, default: '' },
    subject: { type: String, required: true },
    status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'pending' },
    resendId: { type: String, default: '' },
    errorMessage: { type: String, default: '' },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

sendingHistorySchema.index({ eventId: 1, sentAt: -1 });
sendingHistorySchema.index({ eventId: 1, eventType: 1 });

export type SendingHistoryDoc = Document & InferSchemaType<typeof sendingHistorySchema>;

export const SendingHistory: Model<SendingHistoryDoc> =
  (models.SendingHistory as Model<SendingHistoryDoc>) ||
  model<SendingHistoryDoc>('SendingHistory', sendingHistorySchema);

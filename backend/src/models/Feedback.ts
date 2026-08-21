import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

const feedbackSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', default: null },
    name: { type: String, default: 'Anonymous' },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '' },
  },
  { timestamps: true }
);

feedbackSchema.index({ eventId: 1, createdAt: -1 });
feedbackSchema.index({ eventId: 1, studentId: 1 });

export type FeedbackDoc = Document & InferSchemaType<typeof feedbackSchema>;

export const Feedback: Model<FeedbackDoc> =
  (models.Feedback as Model<FeedbackDoc>) ||
  model<FeedbackDoc>('Feedback', feedbackSchema);

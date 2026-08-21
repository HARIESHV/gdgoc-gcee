import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

const eventRegistrationSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', default: null },
    studentName: { type: String, default: '' },
    email: { type: String, required: true, lowercase: true, trim: true },
    googleFormResponseId: { type: String, default: '' },
    registeredAt: { type: Date, default: () => new Date() },
    status: { type: String, enum: ['REGISTERED', 'CANCELLED', 'ATTENDED'], default: 'REGISTERED' },
  },
  { timestamps: true }
);

eventRegistrationSchema.index({ eventId: 1, email: 1 }, { unique: true });
eventRegistrationSchema.index({ eventId: 1, studentId: 1 });

export type EventRegistrationDoc = Document & InferSchemaType<typeof eventRegistrationSchema>;

export const EventRegistration: Model<EventRegistrationDoc> =
  (models.EventRegistration as Model<EventRegistrationDoc>) ||
  model<EventRegistrationDoc>('EventRegistration', eventRegistrationSchema);

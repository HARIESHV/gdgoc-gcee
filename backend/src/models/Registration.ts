import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

const registrationSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: ['REGISTERED', 'CANCELLED'], default: 'REGISTERED' },
    registeredAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

registrationSchema.index({ studentId: 1, eventId: 1 }, { unique: true });

export type RegistrationDoc = Document & InferSchemaType<typeof registrationSchema>;

export const Registration: Model<RegistrationDoc> = (models.Registration as Model<RegistrationDoc>) ||
  model<RegistrationDoc>('Registration', registrationSchema);

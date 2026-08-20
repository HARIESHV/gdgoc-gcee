import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

export const EVENT_CATEGORIES = [
  'Workshop',
  'Hackathon',
  'Technical Talk',
  'Seminar',
  'Coding Session',
  'Hands-on Session',
  'Project Showcase',
  'Community Meetup',
  'Other',
] as const;

export const EVENT_STATUSES = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'] as const;

const eventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String, default: '' },
    banner: { type: String, default: '' },
    date: { type: String, required: true },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    venue: { type: String, default: '' },
    speaker: { type: String, default: '' },
    speakerBio: { type: String, default: '' },
    category: { type: String, enum: EVENT_CATEGORIES, default: 'Workshop' },
    technologies: { type: [String], default: [] },
    registrationEnabled: { type: Boolean, default: true },
    registrationDeadline: { type: String, default: '' },
    capacity: { type: Number, default: 0 },
    googleFormUrl: { type: String, default: '' },
    registrationLink: { type: String, default: '' },
    responseSheetId: { type: String, default: '' },
    responseSheetName: { type: String, default: '' },
    lastSyncedAt: { type: Date, default: null },
    manualRegistrationCount: { type: Number, default: 0 },
    isCertificateEligible: { type: Boolean, default: false },
    isInauguration: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date, default: null },
    emailSentCount: { type: Number, default: 0 },
    emailFailedCount: { type: Number, default: 0 },
    status: { type: String, enum: EVENT_STATUSES, default: 'UPCOMING' },
  },
  { timestamps: true }
);

eventSchema.index({ eventId: 1 }, { unique: true });
eventSchema.index({ date: 1 });
eventSchema.index({ category: 1 });

export type EventDoc = Document & InferSchemaType<typeof eventSchema>;

export const EventModel: Model<EventDoc> = (models.Event as Model<EventDoc>) ||
  model<EventDoc>('Event', eventSchema);

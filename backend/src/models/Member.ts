import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

export const TEAMS = [
  'Core Team',
  'Student Coordinators',
  'Technical Team',
  'Design Team',
  'Event Team',
  'Community Members',
] as const;

export const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Information Technology',
  'Instrumentation and Control Engineering',
  'Other',
] as const;

const memberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    team: { type: String, enum: TEAMS, default: 'Community Members' },
    role: { type: String, default: 'Member' },
    department: { type: String, default: '' },
    year: { type: String, default: '' },
    photo: { type: String, default: '' },
    socialLinks: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

memberSchema.index({ team: 1, order: 1 });

export type MemberDoc = Document & InferSchemaType<typeof memberSchema>;

export const Member: Model<MemberDoc> = (models.Member as Model<MemberDoc>) ||
  model<MemberDoc>('Member', memberSchema);

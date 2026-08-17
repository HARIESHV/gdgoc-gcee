import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

const studentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    college: { type: String, default: 'Government College of Engineering, Erode' },
    department: { type: String, trim: true },
    year: { type: String, trim: true },
    rollNumber: { type: String, trim: true },
    profileImage: { type: String, default: '' },
    passwordHash: { type: String, required: true },
    joinedAt: { type: Date, default: () => new Date() },
    isActive: { type: Boolean, default: true },
    points: { type: Number, default: 0 },
    bio: { type: String, default: '' },
    socialLinks: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

studentSchema.index({ email: 1 }, { unique: true });
studentSchema.index({ rollNumber: 1 }, { unique: true, sparse: true });

export type StudentDoc = Document & InferSchemaType<typeof studentSchema>;

export const Student: Model<StudentDoc> = (models.Student as Model<StudentDoc>) ||
  model<StudentDoc>('Student', studentSchema);

import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT'] as const;
export const ATTENDANCE_METHODS = ['ADMIN', 'QR'] as const;

const attendanceSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    eventDate: { type: String, required: true },
    status: { type: String, enum: ATTENDANCE_STATUSES, default: 'PRESENT' },
    method: { type: String, enum: ATTENDANCE_METHODS, default: 'ADMIN' },
    markedAt: { type: Date, default: () => new Date() },
    markedBy: { type: String, default: 'system' },
  },
  { timestamps: true }
);

// Unique constraint: one attendance record per student per event.
attendanceSchema.index({ studentId: 1, eventId: 1 }, { unique: true });

export type AttendanceDoc = Document & InferSchemaType<typeof attendanceSchema>;

export const Attendance: Model<AttendanceDoc> = (models.Attendance as Model<AttendanceDoc>) ||
  model<AttendanceDoc>('Attendance', attendanceSchema);

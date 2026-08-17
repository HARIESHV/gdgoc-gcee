import { Schema, model, models, type Document, type InferSchemaType, type Model } from 'mongoose';

export const GALLERY_CATEGORIES = ['All', 'Workshops', 'Hackathons', 'Meetups', 'Team'] as const;

const gallerySchema = new Schema(
  {
    title: { type: String, default: '' },
    category: { type: String, enum: GALLERY_CATEGORIES.slice(1), default: 'Meetups' },
    image: { type: String, required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', default: null },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'Admin', default: null },
  },
  { timestamps: true }
);

gallerySchema.index({ category: 1, createdAt: -1 });

export type GalleryItemDoc = Document & InferSchemaType<typeof gallerySchema>;

export const GalleryItem: Model<GalleryItemDoc> = (models.GalleryItem as Model<GalleryItemDoc>) ||
  model<GalleryItemDoc>('GalleryItem', gallerySchema);

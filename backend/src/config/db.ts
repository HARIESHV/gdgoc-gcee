import mongoose from 'mongoose';
import { env } from './env';

const MONGODB_URI = env.mongodbUri;

if (!MONGODB_URI) {
  console.error('[db] MONGODB_URI environment variable is not configured');
  throw new Error('MONGODB_URI environment variable is not configured.');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };
global.mongooseCache = cached;

export function isConnected(): boolean {
  return cached.conn !== null && mongoose.connection.readyState === 1;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    console.log('[db] Connecting to MongoDB...');
    cached.promise = mongoose
      .connect(MONGODB_URI!, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
      })
      .then((m) => {
        console.log('[db] MongoDB connected successfully');
        return m;
      })
      .catch((err) => {
        console.error('[db] MongoDB connection failed:', err.message);
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

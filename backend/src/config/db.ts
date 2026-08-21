import mongoose from 'mongoose';
import { env } from './env';

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

export function getMongoUri(): string {
  return (process.env.MONGODB_URI || env.mongodbUri || '').trim();
}

export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function connectDB(): Promise<typeof mongoose> {
  const uri = getMongoUri();

  if (!uri || uri === 'mongodb://127.0.0.1:27017/gdgoc-gcee' && process.env.NODE_ENV === 'production') {
    const msg = '[db] MONGODB_URI is not configured in production environment variables (e.g. Vercel dashboard).';
    console.error(msg);
    throw new Error(msg);
  }

  // If already connected, reuse connection
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return mongoose;
  }

  // If connection is in progress, wait for it
  if (cached.promise && mongoose.connection.readyState === 2) {
    cached.conn = await cached.promise;
    return cached.conn;
  }

  // Reset in case of prior disconnection or error
  cached.promise = null;
  cached.conn = null;

  console.log('[db] Establishing connection to MongoDB...');

  const opts: mongoose.ConnectOptions = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 1,
    bufferCommands: false,
  };

  cached.promise = mongoose
    .connect(uri, opts)
    .then((m) => {
      console.log('[db] MongoDB connected successfully');
      cached.conn = m;
      return m;
    })
    .catch((err) => {
      console.error('[db] MongoDB connection failed:', err.message);
      cached.promise = null;
      cached.conn = null;
      throw err;
    });

  cached.conn = await cached.promise;
  return cached.conn;
}

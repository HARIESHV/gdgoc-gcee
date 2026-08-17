import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb+srv://harieshvenkatachalam_db_user:gdggcee2007@gdggcee.zgrbwgs.mongodb.net/gdgoc_gcee?appName=gdggcee';

const adminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, index: true },
  passwordHash: String,
  role: String,
}, { timestamps: true });

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('[seed] Connected to MongoDB');

  const email = 'admin@gdgocgcee.in';
  const password = 'Admin@123';

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log('[seed] Admin already exists:', email);
    await mongoose.disconnect();
    return;
  }

  await Admin.create({
    name: 'GDGoC GCEE Admin',
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: 'superadmin',
  });

  console.log('[seed] Admin created successfully!');
  console.log('[seed] Email:', email);
  console.log('[seed] Password:', password);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});

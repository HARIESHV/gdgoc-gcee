import type { Response } from 'express';
import { Member, TEAMS, SiteSettings } from '../models';
import { connectDB } from '../config/db';

export function getDefaultMembersImage(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#090d16"/>
    </linearGradient>
    <linearGradient id="g-blue" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#4285F4"/>
      <stop offset="100%" stop-color="#34A853"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="200" cy="150" r="180" fill="#4285F4" opacity="0.15"/>
  <circle cx="1000" cy="450" r="220" fill="#34A853" opacity="0.15"/>
  <rect x="40" y="40" width="1120" height="550" rx="24" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2"/>
  <g transform="translate(600, 260)" text-anchor="middle">
    <text font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="52" fill="#ffffff" letter-spacing="-0.02em">GDGoC GCEE Core &amp; Community Team</text>
    <text y="50" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="24" fill="#94a3b8">Government College of Engineering, Erode</text>
  </g>
  <g transform="translate(600, 420)" text-anchor="middle">
    <rect x="-180" y="-30" width="360" height="60" rx="30" fill="url(#g-blue)"/>
    <text y="8" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="20" fill="#ffffff">Google Developer Groups on Campus</text>
  </g>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function serialize(m: any) {
  return {
    _id: m._id,
    name: m.name,
    team: m.team,
    role: m.role,
    department: m.department,
    year: m.year,
    photo: m.photo,
    socialLinks: m.socialLinks,
  };
}

// GET /api/members/image  (public)
export async function getMembersImage(_: any, res: Response) {
  try {
    await connectDB();
    const settings = await SiteSettings.findOne({ key: 'main' }).lean();
    const membersImage = settings?.membersImage || getDefaultMembersImage();
    res.json({ success: true, membersImage });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/admin/members-image  (admin)
export async function updateMembersImage(req: any, res: Response) {
  try {
    await connectDB();
    let membersImage = req.body.membersImage;
    
    // If sent as file upload
    if (req.file) {
      const mime = req.file.mimetype || 'image/png';
      membersImage = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
    }

    if (membersImage === undefined) {
      res.status(400).json({ success: false, message: 'membersImage is required.' });
      return;
    }

    const settings = await SiteSettings.findOneAndUpdate(
      { key: 'main' },
      { $set: { membersImage } },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Full members image updated successfully.',
      membersImage: settings.membersImage,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/members  (public)
export async function listMembers(_: any, res: Response) {
  try {
    await connectDB();
    const members = await Member.find({ isActive: true }).sort({ team: 1, order: 1, name: 1 }).lean();
    const settings = await SiteSettings.findOne({ key: 'main' }).lean();
    const membersImage = settings?.membersImage || getDefaultMembersImage();

    const grouped: Record<string, any[]> = {};
    for (const t of TEAMS) grouped[t] = [];
    for (const m of members) {
      if (!grouped[m.team]) grouped[m.team] = [];
      grouped[m.team].push(serialize(m));
    }
    res.json({ success: true, grouped, teams: TEAMS, members: members.map(serialize), membersImage });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/admin/members
export async function adminListMembers(_: any, res: Response) {
  try {
    await connectDB();
    const members = await Member.find().sort({ team: 1, order: 1, name: 1 }).lean();
    const settings = await SiteSettings.findOne({ key: 'main' }).lean();
    const membersImage = settings?.membersImage || getDefaultMembersImage();
    res.json({ success: true, members: members.map(serialize), membersImage });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/admin/members
export async function createMember(req: any, res: Response) {
  try {
    await connectDB();
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Member name is required.' });
      return;
    }
    const member = await Member.create({
      name,
      team: req.body.team || 'Community Members',
      role: req.body.role || 'Member',
      department: req.body.department || '',
      year: req.body.year || '',
      photo: req.body.photo || '',
      socialLinks: req.body.socialLinks || {},
      order: Number(req.body.order) || 0,
    });
    res.status(201).json({ success: true, message: 'Member added.', member: serialize(member) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/admin/members/:id
export async function updateMember(req: any, res: Response) {
  try {
    await connectDB();
    const member = await Member.findById(req.params.id);
    if (!member) {
      res.status(404).json({ success: false, message: 'Member not found.' });
      return;
    }
    const allowed = ['name', 'team', 'role', 'department', 'year', 'photo', 'socialLinks', 'order', 'isActive'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) (member as any)[key] = req.body[key];
    }
    await member.save();
    res.json({ success: true, message: 'Member updated.', member: serialize(member) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/admin/members/:id
export async function deleteMember(req: any, res: Response) {
  try {
    await connectDB();
    await Member.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Member removed.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

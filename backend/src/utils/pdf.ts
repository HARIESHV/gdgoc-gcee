import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { formatFullDate } from './dates';

export interface CertificatePdfData {
  certificateId: string;
  studentName: string;
  eventName: string;
  eventDate: string;
  issueDate: string;
  qrCodeDataURL: string;
  verificationUrl: string;
}

const NAVY   = '#0b2559';   // deep navy blue
const GOLD   = '#c8902a';   // warm gold
const LGOLD  = '#e8c96b';   // light gold for accents
const BLUE   = '#1a3a7c';   // medium blue for headings
const GRAY   = '#6b7280';   // soft gray
const LGRAY  = '#d1d5db';   // light gray lines
const WHITE  = '#ffffff';

function drawCorner(doc: PDFKit.PDFDocument, cx: number, cy: number, dirX: number, dirY: number) {
  const len = 36;
  doc.save();
  doc.lineWidth(2.5).moveTo(cx, cy).lineTo(cx + dirX * len, cy).stroke(GOLD);
  doc.lineWidth(2.5).moveTo(cx, cy).lineTo(cx, cy + dirY * len).stroke(GOLD);
  doc.lineWidth(1).moveTo(cx + dirX * 7, cy + dirY * 7).lineTo(cx + dirX * (len - 4), cy + dirY * 7).stroke(NAVY);
  doc.lineWidth(1).moveTo(cx + dirX * 7, cy + dirY * 7).lineTo(cx + dirX * 7, cy + dirY * (len - 4)).stroke(NAVY);
  doc.restore();
}

function drawDiamond(doc: PDFKit.PDFDocument, x: number, y: number, size: number = 4) {
  doc.save();
  doc.moveTo(x, y - size).lineTo(x + size, y).lineTo(x, y + size).lineTo(x - size, y).closePath().fill(GOLD);
  doc.restore();
}

function drawOrnamentalRule(doc: PDFKit.PDFDocument, cx: number, y: number, halfW: number) {
  doc.save();
  doc.lineWidth(0.8).moveTo(cx - halfW, y).lineTo(cx - 10, y).stroke(GOLD);
  doc.lineWidth(0.8).moveTo(cx + 10, y).lineTo(cx + halfW, y).stroke(GOLD);
  drawDiamond(doc, cx, y, 4);
  doc.restore();
}

/**
 * Professional A4 landscape certificate PDF using official GDGoC GCEE certificate design.
 */
export async function generateCertificatePDF(data: CertificatePdfData): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 0,
    autoFirstPage: true,
    bufferPages: true,
  });

  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const W = doc.page.width;   // 841.89
  const H = doc.page.height;  // 595.28
  const cx = W / 2;

  // Search for background image
  const samplePaths = [
    path.join(__dirname, '../assets/certificate-sample.jpg'),
    path.join(process.cwd(), 'backend/src/assets/certificate-sample.jpg'),
    path.join(process.cwd(), 'src/assets/certificate-sample.jpg'),
    path.join(process.cwd(), 'frontend/public/certificate-sample.jpg'),
    path.join(process.cwd(), 'public/certificate-sample.jpg'),
  ];
  const bgImagePath = samplePaths.find((p) => fs.existsSync(p));

  if (bgImagePath) {
    // ── Template Image Background ─────────────────────────────────
    doc.image(bgImagePath, 0, 0, { width: W, height: H });

    // ── Overlay Dynamic Text ──────────────────────────────────────
    // 1. Student Name
    const nameSize = data.studentName.length > 22 ? 32 : data.studentName.length > 16 ? 36 : 42;
    doc.font('Helvetica-BoldOblique').fontSize(nameSize).fillColor('#0b2559');
    doc.text(data.studentName, 120, 270, { align: 'center', width: W - 240 });

    // 2. Event Name
    const evSize = data.eventName.length > 40 ? 14 : data.eventName.length > 28 ? 16 : 18;
    doc.font('Helvetica-Bold').fontSize(evSize).fillColor('#0b2559');
    doc.text(data.eventName, 120, 366, { align: 'center', width: W - 240 });

    // 3. Date
    const formattedDate = formatFullDate(data.eventDate);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#0b2559');
    doc.text(formattedDate, 0, 436, { align: 'center', width: W });

    // 4. QR Code inside Gold Circle (bottom right)
    if (data.qrCodeDataURL) {
      doc.image(data.qrCodeDataURL, 696, 432, { width: 66, height: 66 });
    }

    // 5. Certificate ID
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0b2559');
    doc.text(data.certificateId.toUpperCase(), 355, 562, { width: 300, align: 'left', characterSpacing: 0.5 });

  } else {
    // ── Clean & Elegant Minimalist PDF Generator ──────────────────
    doc.rect(0, 0, W, H).fill(WHITE);

    // Perimeter Thin Navy & Gold Borders
    doc.rect(20, 20, W - 40, H - 40).lineWidth(1.5).stroke(NAVY);
    doc.rect(25, 25, W - 50, H - 50).lineWidth(0.8).stroke(GOLD);

    drawCorner(doc, 20, 20, 1, 1);
    drawCorner(doc, W - 20, 20, -1, 1);
    drawCorner(doc, 20, H - 20, 1, -1);
    drawCorner(doc, W - 20, H - 20, -1, -1);

    // Header Top Line
    doc.moveTo(40, 75).lineTo(W - 40, 75).lineWidth(0.8).stroke(LGRAY);

    // Top Left Logo Text: GDGoC GCEE
    doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY).text('Google Developer Groups', 45, 36);
    doc.font('Helvetica').fontSize(9.5).fillColor(BLUE).text('on Campus', 45, 49);
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(GOLD).text('GDGoC GCEE', 45, 61);

    // Top Right Logo Text: Government College of Engineering, Erode
    doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY).text('GOVERNMENT COLLEGE', W - 245, 36, { width: 200, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY).text('OF ENGINEERING, ERODE', W - 245, 49, { width: 200, align: 'right' });
    doc.font('Helvetica').fontSize(7.5).fillColor(GOLD).text('LEARN  •  BUILD  •  IMPACT', W - 245, 62, { width: 200, align: 'right' });

    // Center Headings
    doc.font('Helvetica-Bold').fontSize(46).fillColor(NAVY).text('CERTIFICATE', 0, 105, { align: 'center', width: W, characterSpacing: 2 });
    doc.font('Helvetica-Bold').fontSize(14).fillColor(GOLD).text('OF  PARTICIPATION', 0, 158, { align: 'center', width: W, characterSpacing: 4 });

    drawOrnamentalRule(doc, cx, 185, 140);

    // Presenter line
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(GRAY);
    doc.text('THIS IS PROUDLY PRESENTED TO', 0, 198, { align: 'center', width: W, characterSpacing: 2 });

    // Student Name (Prominent & Elegant Script / Oblique)
    const nameSize = data.studentName.length > 22 ? 34 : data.studentName.length > 16 ? 38 : 44;
    doc.font('Helvetica-BoldOblique').fontSize(nameSize).fillColor(NAVY);
    doc.text(data.studentName, 100, 222, { align: 'center', width: W - 200 });

    const nameBottom = 222 + nameSize + 6;
    doc.moveTo(cx - 120, nameBottom).lineTo(cx + 120, nameBottom).lineWidth(1).stroke(GOLD);

    // Event Info
    doc.font('Helvetica').fontSize(10.5).fillColor(GRAY);
    doc.text('for actively participating in the event', 0, nameBottom + 12, { align: 'center', width: W });

    const evSize = data.eventName.length > 40 ? 14 : data.eventName.length > 28 ? 16 : 18;
    doc.font('Helvetica-Bold').fontSize(evSize).fillColor(NAVY);
    doc.text(data.eventName, 100, nameBottom + 28, { align: 'center', width: W - 200 });

    doc.font('Helvetica').fontSize(10).fillColor(GRAY);
    doc.text('organized by GDGoC GCEE', 0, nameBottom + 48, { align: 'center', width: W });

    const formattedDate = formatFullDate(data.eventDate);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(NAVY);
    doc.text(`📅  ${formattedDate}`, 0, nameBottom + 66, { align: 'center', width: W });

    // Bottom Coordinator Signature Area
    const sigY = H - 85;
    doc.moveTo(70, sigY).lineTo(210, sigY).lineWidth(1).stroke(NAVY);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY).text('Faculty / Lead Coordinator', 70, sigY + 5, { width: 140, align: 'center' });
    doc.font('Helvetica').fontSize(8).fillColor(GRAY).text('GDGoC GCEE', 70, sigY + 17, { width: 140, align: 'center' });

    // QR Code & Verification (Bottom Right)
    const qrX = W - 110;
    const qrY = H - 98;
    if (data.qrCodeDataURL) {
      doc.rect(qrX, qrY, 56, 56).lineWidth(1).stroke(GOLD);
      doc.image(data.qrCodeDataURL, qrX + 3, qrY + 3, { width: 50, height: 50 });
      doc.font('Helvetica-Bold').fontSize(5.5).fillColor(NAVY);
      doc.text('SCAN TO VERIFY', qrX - 10, qrY + 58, { width: 76, align: 'center' });
    }

    // Bottom Footer Line & Certificate ID
    doc.moveTo(40, H - 36).lineTo(W - 40, H - 36).lineWidth(0.5).stroke(LGRAY);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(NAVY);
    doc.text(`CERTIFICATE ID:  ${data.certificateId.toUpperCase()}`, 45, H - 30, { width: W - 90, characterSpacing: 0.5 });
  }

  doc.end();
  return done;
}

export interface StudentRegistrationPdfRow {
  registrationId?: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  year?: string;
  college?: string;
  registeredAt?: Date | string;
}

export async function generateRegistrationListPDFBuffer(opts: {
  eventName: string;
  eventDate: string;
  venue?: string;
  students: StudentRegistrationPdfRow[];
}): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'portrait',
    margin: 36,
    bufferPages: true,
  });

  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const W = doc.page.width - 72;
  const generatedTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  doc.rect(0, 0, doc.page.width, 88).fill(NAVY);
  doc.font('Helvetica-Bold').fontSize(16).fillColor('#ffffff').text('GDGoC GCEE', 36, 18, { width: W });
  doc.font('Helvetica').fontSize(9.5).fillColor('#94a3b8').text('Google Developer Groups on Campus — Government College of Engineering, Erode', 36, 38, { width: W });
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#38bdf8').text('STUDENT REGISTRATION REPORT', 36, 56, { width: W });
  doc.font('Helvetica').fontSize(8).fillColor('#cbd5e1').text(`Generated: ${generatedTime} IST`, 36, 70, { width: W, align: 'right' });

  let y = 104;
  doc.font('Helvetica-Bold').fontSize(13).fillColor(NAVY).text(opts.eventName, 36, y, { width: W });
  y += 18;
  doc.font('Helvetica').fontSize(9).fillColor(GRAY);
  doc.text(`Date: ${opts.eventDate}   |   Venue: ${opts.venue || 'TBA'}   |   Total Registered: ${opts.students.length}`, 36, y, { width: W });
  y += 18;

  doc.moveTo(36, y).lineTo(36 + W, y).lineWidth(1).stroke(NAVY);
  y += 10;

  const cols = [
    { label: '# / Reg ID', x: 36, w: 72 },
    { label: 'Student Name', x: 112, w: 105 },
    { label: 'Year', x: 220, w: 40 },
    { label: 'Dept', x: 263, w: 55 },
    { label: 'Email', x: 322, w: 120 },
    { label: 'College / Institution', x: 445, w: 114 },
  ];

  function drawTableHeader(curY: number) {
    doc.rect(36, curY - 3, W, 18).fill('#0f172a');
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
    for (const col of cols) {
      doc.text(col.label, col.x, curY + 2, { width: col.w, ellipsis: true });
    }
    return curY + 18;
  }

  y = drawTableHeader(y);

  for (let i = 0; i < opts.students.length; i++) {
    const s = opts.students[i];
    if (y > 750) {
      doc.addPage();
      y = 36;
      doc.rect(0, 0, doc.page.width, 30).fill(NAVY);
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff').text(`GDGoC GCEE — ${opts.eventName} (Registration List)`, 36, 10, { width: W });
      y = 44;
      y = drawTableHeader(y);
    }

    if (i % 2 === 0) {
      doc.rect(36, y - 2, W, 16).fill('#f8fafc');
    }

    doc.font('Helvetica').fontSize(7.5).fillColor('#1e293b');
    const idLabel = s.registrationId ? s.registrationId.replace(/^REG-/, '') : String(i + 1);
    doc.text(idLabel, cols[0].x, y + 2, { width: cols[0].w, ellipsis: true });
    doc.font('Helvetica-Bold').fontSize(7.5).text(s.name || '—', cols[1].x, y + 2, { width: cols[1].w, ellipsis: true });
    doc.font('Helvetica').fontSize(7.5).text(s.year || '—', cols[2].x, y + 2, { width: cols[2].w, ellipsis: true });
    doc.text(s.department || '—', cols[3].x, y + 2, { width: cols[3].w, ellipsis: true });
    doc.text(s.email || '—', cols[4].x, y + 2, { width: cols[4].w, ellipsis: true });
    doc.text(s.college || 'GCE Erode', cols[5].x, y + 2, { width: cols[5].w, ellipsis: true });

    y += 16;
  }

  const pageRange = doc.bufferedPageRange();
  for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
    doc.switchToPage(i);
    doc.moveTo(36, 800).lineTo(36 + W, 800).lineWidth(0.5).stroke('#cbd5e1');
    doc.font('Helvetica').fontSize(7.5).fillColor('#64748b');
    doc.text('GDGoC GCEE — Google Developer Groups on Campus, Government College of Engineering, Erode', 36, 808, { width: W / 2 + 100 });
    doc.text(`Page ${i + 1} of ${pageRange.count}`, 36, 808, { width: W, align: 'right' });
  }

  doc.end();
  return done;
}

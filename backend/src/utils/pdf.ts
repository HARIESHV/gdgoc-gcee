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

function drawMedalBadge(doc: PDFKit.PDFDocument, cx: number, cy: number) {
  doc.save();
  doc.circle(cx, cy, 44).lineWidth(3).stroke(GOLD);
  doc.circle(cx, cy, 40).fill(NAVY);
  doc.circle(cx, cy, 40).lineWidth(1.5).stroke(LGOLD);
  doc.circle(cx, cy, 34).lineWidth(0.8).stroke(LGOLD);

  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12;
    const r = 37;
    const sx = cx + r * Math.cos(angle);
    const sy = cy + r * Math.sin(angle);
    doc.circle(sx, sy, 1.2).fill(LGOLD);
  }

  doc.font('Helvetica-Bold').fontSize(7).fillColor(WHITE);
  doc.text('BUILD', cx - 40, cy - 18, { width: 80, align: 'center' });
  doc.text('CONNECT', cx - 40, cy - 7, { width: 80, align: 'center' });
  doc.text('INSPIRE', cx - 40, cy + 4, { width: 80, align: 'center' });

  doc.font('Helvetica').fontSize(6).fillColor(LGOLD);
  doc.text('★  ★  ★', cx - 40, cy + 14, { width: 80, align: 'center' });

  const ribW = 22;
  const ribTop = cy + 44;
  const ribH = 30;

  doc.save();
  doc.moveTo(cx - ribW, ribTop).lineTo(cx - 4, ribTop).lineTo(cx - 4, ribTop + ribH).lineTo(cx - ribW, ribTop + ribH - 8).lineTo(cx - ribW, ribTop).closePath().fill(BLUE);
  doc.restore();

  doc.save();
  doc.moveTo(cx + 4, ribTop).lineTo(cx + ribW, ribTop).lineTo(cx + ribW, ribTop + ribH - 8).lineTo(cx + 4, ribTop + ribH).lineTo(cx + 4, ribTop).closePath().fill(BLUE);
  doc.restore();

  doc.restore();
}

function drawBuildingWatermark(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number) {
  doc.save();
  doc.opacity(0.06);
  doc.strokeColor(NAVY).fillColor(NAVY);

  const bx = x + w * 0.4;
  const by = y + h * 0.05;

  doc.rect(bx - 30, by + h * 0.2, 60, h * 0.7).lineWidth(1.5).stroke();
  doc.moveTo(bx - 35, by + h * 0.2).lineTo(bx, by).lineTo(bx + 35, by + h * 0.2).stroke();
  doc.circle(bx, by + h * 0.35, 18).stroke();
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      doc.rect(bx - 25 + col * 20, by + h * 0.45 + row * 20, 10, 12).stroke();
    }
  }
  doc.rect(bx - 10, by + h * 0.78, 20, 20).stroke();

  doc.rect(bx - 60, by + h * 0.4, 20, h * 0.5).stroke();
  doc.rect(bx + 40, by + h * 0.4, 20, h * 0.5).stroke();
  doc.moveTo(bx - 60, by + h * 0.4).lineTo(bx - 50, by + h * 0.25).lineTo(bx - 40, by + h * 0.4).stroke();
  doc.moveTo(bx + 40, by + h * 0.4).lineTo(bx + 50, by + h * 0.25).lineTo(bx + 60, by + h * 0.4).stroke();

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
    // ── Fallback Procedural Background ────────────────────────────
    doc.rect(0, 0, W, H).fill(WHITE);

    doc.save();
    doc.opacity(0.08);
    doc.moveTo(W - 120, 0).lineTo(W, 0).lineTo(W, 120).closePath().fill(NAVY);
    doc.moveTo(0, H - 120).lineTo(120, H).lineTo(0, H).closePath().fill(NAVY);
    doc.restore();

    doc.rect(18, 18, W - 36, H - 36).lineWidth(2.5).stroke(GOLD);
    doc.rect(24, 24, W - 48, H - 48).lineWidth(1).stroke(NAVY);
    doc.rect(28, 28, W - 56, H - 56).lineWidth(0.5).stroke(GOLD);

    drawCorner(doc, 18, 18, 1, 1);
    drawCorner(doc, W - 18, 18, -1, 1);
    drawCorner(doc, 18, H - 18, 1, -1);
    drawCorner(doc, W - 18, H - 18, -1, -1);

    doc.moveTo(40, 80).lineTo(W - 40, 80).lineWidth(1).stroke(GOLD);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY).text('Google Developer Groups', 50, 38);
    doc.font('Helvetica').fontSize(9).fillColor(BLUE).text('on Campus', 50, 51);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(GOLD).text('GDGoC GCEE', 50, 63);

    const sealX = cx;
    const sealY = 55;
    doc.circle(sealX, sealY, 26).lineWidth(1.5).stroke(NAVY);
    doc.circle(sealX, sealY, 22).lineWidth(0.5).stroke(GOLD);
    doc.font('Helvetica-Bold').fontSize(5.5).fillColor(NAVY);
    doc.text('GCEE', sealX - 20, sealY - 8, { width: 40, align: 'center' });
    doc.font('Helvetica').fontSize(4.5).fillColor(GRAY);
    doc.text('KNOWLEDGE IS POWER', sealX - 20, sealY + 2, { width: 40, align: 'center' });

    doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY).text('GOVERNMENT COLLEGE', W - 240, 34, { width: 200, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY).text('OF ENGINEERING, ERODE', W - 240, 47, { width: 200, align: 'right' });
    doc.font('Helvetica').fontSize(7.5).fillColor(GOLD).text('LEARN  •  BUILD  •  IMPACT', W - 240, 63, { width: 200, align: 'right' });

    drawBuildingWatermark(doc, cx + 100, 85, 280, 380);
    drawMedalBadge(doc, 100, 360);

    doc.font('Helvetica-Bold').fontSize(52).fillColor(NAVY).text('CERTIFICATE', 0, 90, { align: 'center', width: W });
    doc.moveTo(cx - 80, 148).lineTo(cx + 80, 148).lineWidth(1).stroke(GOLD);
    drawDiamond(doc, cx - 85, 148, 4);
    drawDiamond(doc, cx + 85, 148, 4);

    doc.font('Helvetica').fontSize(16).fillColor(BLUE);
    doc.text('OF  PARTICIPATION', 0, 156, { align: 'center', width: W, characterSpacing: 4 });
    drawOrnamentalRule(doc, cx, 185, 180);

    doc.font('Helvetica').fontSize(10).fillColor(GRAY);
    doc.text('THIS IS PROUDLY PRESENTED TO', 0, 193, { align: 'center', width: W, characterSpacing: 2 });

    drawDiamond(doc, cx, 215, 4);
    const nameSize = data.studentName.length > 22 ? 34 : data.studentName.length > 16 ? 38 : 44;
    doc.font('Helvetica-BoldOblique').fontSize(nameSize).fillColor(NAVY);
    doc.text(data.studentName, 120, 220, { align: 'center', width: W - 240 });

    const nameBottom = 220 + nameSize + 6;
    doc.moveTo(cx - 140, nameBottom).lineTo(cx + 140, nameBottom).lineWidth(1.2).stroke(GOLD);
    drawDiamond(doc, cx, nameBottom + 6, 4);

    doc.font('Helvetica').fontSize(10).fillColor(GRAY);
    doc.text('for actively participating in the event', 0, nameBottom + 16, { align: 'center', width: W });

    const evSize = data.eventName.length > 40 ? 13 : data.eventName.length > 28 ? 15 : 17;
    doc.font('Helvetica-Bold').fontSize(evSize).fillColor(NAVY);
    doc.text(data.eventName, 120, nameBottom + 30, { align: 'center', width: W - 240 });

    doc.font('Helvetica').fontSize(10).fillColor(GRAY);
    doc.text('organized by GDGoC GCEE', 0, nameBottom + 50, { align: 'center', width: W });

    drawOrnamentalRule(doc, cx, nameBottom + 68, 100);

    const formattedDate = formatFullDate(data.eventDate);
    doc.font('Helvetica-Bold').fontSize(12).fillColor(NAVY);
    doc.text(`📅  ${formattedDate}`, 0, nameBottom + 78, { align: 'center', width: W });

    const qrX = W - 100;
    const qrY = H - 105;
    if (data.qrCodeDataURL) {
      doc.circle(qrX, qrY, 42).lineWidth(2).stroke(GOLD);
      doc.circle(qrX, qrY, 38).lineWidth(0.5).stroke(LGOLD);
      doc.image(data.qrCodeDataURL, qrX - 30, qrY - 30, { width: 60, height: 60 });
      doc.font('Helvetica-Bold').fontSize(5.5).fillColor(NAVY);
      doc.text('SCAN TO DOWNLOAD', qrX - 40, qrY + 46, { width: 80, align: 'center', characterSpacing: 0.5 });
      doc.text('YOUR CERTIFICATE', qrX - 40, qrY + 54, { width: 80, align: 'center', characterSpacing: 0.5 });
    }

    const flourishY = H - 60;
    doc.font('Helvetica').fontSize(14).fillColor(GOLD).text('— ❧ ❦ ❧ —', 0, flourishY - 8, { align: 'center', width: W });

    doc.moveTo(40, H - 48).lineTo(W - 40, H - 48).lineWidth(0.5).stroke(LGRAY);
    doc.font('Helvetica').fontSize(8).fillColor(NAVY);
    doc.text(`CERTIFICATE ID:  ${data.certificateId.toUpperCase()}`, 50, H - 40, { width: W - 100, characterSpacing: 0.5 });
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

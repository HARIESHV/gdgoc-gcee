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

const NAVY = '#0b1b33';
const GOLD = '#c5a53a';
const GRAY = '#5f6b7a';

function drawCorner(doc: PDFKit.PDFDocument, cx: number, cy: number, dirX: number, dirY: number) {
  const len = 40;
  const goldW = 3;
  const navyW = 2;

  const x2 = cx + dirX * len;
  const y3 = cy + dirY * len;

  doc.save();

  doc.lineWidth(goldW).moveTo(cx, cy).lineTo(x2, cy).stroke(GOLD);
  doc.lineWidth(goldW).moveTo(cx, cy).lineTo(cx, y3).stroke(GOLD);

  doc.lineWidth(navyW).moveTo(cx + dirX * 6, cy + dirY * 6).lineTo(x2 - dirX * 4, cy + dirY * 6).stroke(NAVY);
  doc.lineWidth(navyW).moveTo(cx + dirX * 6, cy + dirY * 6).lineTo(cx + dirX * 6, y3 - dirY * 4).stroke(NAVY);

  doc.restore();
}

/**
 * Build a premium A4 landscape certificate PDF and resolve with a Buffer.
 *
 * Design: navy/gold color scheme, thin gold border, geometric corner decorations,
 * GDGoC GCEE branding, CERTIFICATE OF PARTICIPATION heading, gold badge, QR code.
 * No signatures, no website URL, no email, no social icons.
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

  const W = doc.page.width; // 841.89
  const H = doc.page.height; // 595.28
  const center = W / 2;

  // White background
  doc.rect(0, 0, W, H).fill('#ffffff');

  // Outer thin gold border
  doc.rect(20, 20, W - 40, H - 40).lineWidth(2).stroke(GOLD);
  // Inner thin navy border
  doc.rect(26, 26, W - 52, H - 52).lineWidth(1).stroke(NAVY);

  // Geometric corner decorations
  drawCorner(doc, 20, 20, 1, 1);
  drawCorner(doc, W - 20, 20, -1, 1);
  drawCorner(doc, 20, H - 20, 1, -1);
  drawCorner(doc, W - 20, H - 20, -1, -1);

  // GDGoC GCEE header
  doc
    .font('Helvetica-Bold')
    .fontSize(24)
    .fillColor(NAVY)
    .text('GDGoC GCEE', center, 70, { align: 'center' });

  // Institution subheader
  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor(GRAY)
    .text('Government College of Engineering, Erode', center, 96, { align: 'center' });

  // Main heading
  doc
    .font('Helvetica-Bold')
    .fontSize(28)
    .fillColor(NAVY)
    .text('CERTIFICATE OF PARTICIPATION', center, 135, { align: 'center' });

  // Gold decorative line under heading
  doc
    .moveTo(center - 130, 170)
    .lineTo(center + 130, 170)
    .lineWidth(2)
    .stroke(GOLD);

  // Presentation line
  doc
    .font('Helvetica')
    .fontSize(11.5)
    .fillColor(GRAY)
    .text('This certificate is proudly presented to', center, 190, { align: 'center' });

  // Student name
  doc
    .font('Helvetica-Bold')
    .fontSize(30)
    .fillColor(NAVY)
    .text(data.studentName.toUpperCase(), center, 215, { align: 'center', width: W - 200, ellipsis: true });

  // Participation line
  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor(GRAY)
    .text('for outstanding participation in', center, 260, { align: 'center' });

  // Event name
  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor(NAVY)
    .text(data.eventName, center, 282, { align: 'center', width: W - 240, ellipsis: true });

  // Single event date
  const formattedDate = formatFullDate(data.eventDate);
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(NAVY)
    .text(formattedDate, center, 310, { align: 'center' });

  // Gold badge/seal at bottom left
  const badgeX = 130;
  const badgeY = 440;
  const badgeR = 42;

  doc.save();
  doc.circle(badgeX, badgeY, badgeR).lineWidth(2.5).stroke(GOLD);
  doc.circle(badgeX, badgeY, badgeR - 6).lineWidth(1).stroke(GOLD);

  // Star inside badge
  const starPoints = 5;
  const outerR = 22;
  const innerR = 10;
  doc.moveTo(badgeX, badgeY - outerR);
  for (let i = 0; i < starPoints * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI * i) / starPoints - Math.PI / 2;
    doc.lineTo(badgeX + r * Math.cos(angle), badgeY + r * Math.sin(angle));
  }
  doc.closePath().lineWidth(1.5).fillAndStroke(GOLD, GOLD);

  // Text around badge
  doc
    .font('Helvetica-Bold')
    .fontSize(7)
    .fillColor(NAVY)
    .text('GDGoC GCEE', badgeX, badgeY + badgeR + 8, { align: 'center', width: badgeR * 2 });
  doc
    .font('Helvetica')
    .fontSize(6)
    .fillColor(GRAY)
    .text('Certificate of Participation', badgeX, badgeY + badgeR + 18, { align: 'center', width: badgeR * 2 });
  doc.restore();

  // QR code at bottom right
  if (data.qrCodeDataURL) {
    doc.image(data.qrCodeDataURL, W - 130, 420, { width: 80, height: 80 });
  }

  // Certificate ID at bottom center
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(NAVY)
    .text(`Certificate ID: ${data.certificateId}`, center, 530, { align: 'center' });

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

  const W = doc.page.width - 72; // 595.28 - 72 = 523.28
  const generatedTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // Header band
  doc.rect(0, 0, doc.page.width, 88).fill(NAVY);

  doc.font('Helvetica-Bold').fontSize(16).fillColor('#ffffff').text('GDGoC GCEE', 36, 18, { width: W });
  doc.font('Helvetica').fontSize(9.5).fillColor('#94a3b8').text('Google Developer Groups on Campus — Government College of Engineering, Erode', 36, 38, { width: W });
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#38bdf8').text('STUDENT REGISTRATION REPORT', 36, 56, { width: W });
  doc.font('Helvetica').fontSize(8).fillColor('#cbd5e1').text(`Generated: ${generatedTime} IST`, 36, 70, { width: W, align: 'right' });

  // Event info box
  let y = 104;
  doc.font('Helvetica-Bold').fontSize(13).fillColor(NAVY).text(opts.eventName, 36, y, { width: W });
  y += 18;
  doc.font('Helvetica').fontSize(9).fillColor(GRAY);
  doc.text(`Date: ${opts.eventDate}   |   Venue: ${opts.venue || 'TBA'}   |   Total Registered: ${opts.students.length}`, 36, y, { width: W });
  y += 18;

  doc.moveTo(36, y).lineTo(36 + W, y).lineWidth(1).stroke(NAVY);
  y += 10;

  // Table columns
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

  // Table rows
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

  // Footer on each page
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


import PDFDocument from 'pdfkit';
import { formatDotDate } from './dates';

export interface CertificatePdfData {
  certificateId: string;
  studentName: string;
  organization: string;
  institution: string;
  firstEligibleEventDate: string;
  lastEligibleEventDate: string;
  eventsAttended: number;
  attendancePercentage: number;
  issueDate: string;
  qrCodeDataURL: string;
  verificationUrl: string;
}

const NAVY = '#0b1b33';
const GRAY = '#5f6b7a';
const LIGHT = '#9aa5b1';
const BLUE = '#4285F4';
const GREEN = '#34A853';
const YELLOW = '#FBBC05';
const RED = '#EA4335';

/**
 * Build a premium A4 landscape certificate PDF and resolve with a Buffer.
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

  // Outer background
  doc.rect(0, 0, W, H).fill('#ffffff');

  // Decorative frame
  doc.rect(18, 18, W - 36, H - 36).lineWidth(1.4).stroke(NAVY);
  doc.rect(26, 26, W - 52, H - 52).lineWidth(0.6).stroke(LIGHT);

  // Top 4-color bar (Google-inspired accent)
  const bar = 10;
  const seg = (W - 36) / 4;
  const colors = [BLUE, GREEN, YELLOW, RED];
  colors.forEach((c, i) => {
    doc.rect(18 + i * seg, 18, seg, bar).fill(c);
  });

  const center = W / 2;

  // Organization header
  doc.font('Helvetica-Bold').fontSize(22).fillColor(NAVY).text('GDGoC GCEE', center, 74, { align: 'center' });
  doc.font('Helvetica').fontSize(11).fillColor(GRAY).text('Google Developer Groups on Campus', center, 100, {
    align: 'center',
  });
  doc
    .font('Helvetica')
    .fontSize(10.5)
    .fillColor(GRAY)
    .text(data.institution, center, 115, { align: 'center' });

  // Main heading
  doc
    .font('Helvetica-Bold')
    .fontSize(27)
    .fillColor(BLUE)
    .text('CERTIFICATE OF PARTICIPATION', center, 152, { align: 'center' });

  doc.moveTo(center - 120, 190).lineTo(center + 120, 190).lineWidth(1.2).stroke(GREEN);

  // Presentation line
  doc
    .font('Helvetica')
    .fontSize(11.5)
    .fillColor(GRAY)
    .text('This certificate is proudly presented to', center, 208, { align: 'center' });

  // Student name
  doc
    .font('Helvetica-Bold')
    .fontSize(30)
    .fillColor(NAVY)
    .text(data.studentName.toUpperCase(), center, 228, { align: 'center', width: W - 200, ellipsis: true });

  // Description
  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor(GRAY)
    .text(
      'for active participation and contribution to the GDGoC GCEE community and its eligible technical events.',
      center,
      278,
      { align: 'center', width: W - 240 }
    );

  // Participation period
  const period = `${formatDotDate(data.firstEligibleEventDate)} — ${formatDotDate(data.lastEligibleEventDate)}`;
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(NAVY)
    .text(`Participation Period: ${period}`, center, 330, { align: 'center' });

  // Stats
  doc
    .font('Helvetica')
    .fontSize(11.5)
    .fillColor(GRAY)
    .text(
      `Events Attended: ${data.eventsAttended}      |      Attendance: ${data.attendancePercentage}%`,
      center,
      356,
      { align: 'center' }
    );

  // Signature area
  const sigY = 416;
  doc.moveTo(120, sigY + 30).lineTo(300, sigY + 30).lineWidth(0.8).stroke(LIGHT);
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(GRAY)
    .text('Community Lead', 120, sigY + 34, { align: 'center', width: 180 });

  doc.moveTo(W - 300, sigY + 30).lineTo(W - 120, sigY + 30).lineWidth(0.8).stroke(LIGHT);
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(GRAY)
    .text('Faculty Coordinator', W - 300, sigY + 34, { align: 'center', width: 180 });

  // Footer: certificate ID (left)
  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor(NAVY)
    .text(`Certificate ID: ${data.certificateId}`, 60, H - 64, { align: 'left' });
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(GRAY)
    .text(`Issued On: ${formatDotDate(data.issueDate)}`, 60, H - 50, { align: 'left' });

  // Footer: verification URL (center)
  doc
    .font('Helvetica-Oblique')
    .fontSize(9)
    .fillColor(BLUE)
    .text(data.verificationUrl, center, H - 60, { align: 'center', width: 400 });

  // QR code (right)
  if (data.qrCodeDataURL) {
    doc.image(data.qrCodeDataURL, W - 130, H - 108, { width: 72, height: 72 });
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(GRAY)
      .text('Scan to verify', W - 130, H - 32, { align: 'center', width: 72 });
  }

  doc.end();
  return done;
}

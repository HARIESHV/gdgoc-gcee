import { Router } from 'express';
import { adminProtect } from '../middleware/adminAuth';
import { uploadMemory } from '../middleware/upload';

import {
  adminListEvents,
  adminGetEvent,
  adminCreateEvent,
  adminUpdateEvent,
  adminDeleteEvent,
} from '../controllers/event.controller';
import {
  adminGetEventAttendance,
  adminMarkAttendance,
  adminGetAttendanceQrToken,
  adminListAttendance,
} from '../controllers/attendance.controller';
import {
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  calculateEligibility,
  generateCertificates,
  generateSingleCertificate,
} from '../controllers/campaign.controller';
import {
  adminListCertificates,
  revokeCertificate,
  restoreCertificate,
  adminCertificateStats,
} from '../controllers/certificate.controller';
import {
  adminListStudents,
  adminGetStudent,
  adminToggleStudentStatus,
  adminUpdateStudentPoints,
  adminDeleteStudent,
} from '../controllers/studentAdmin.controller';
import {
  adminListMembers,
  createMember,
  updateMember,
  deleteMember,
} from '../controllers/member.controller';
import {
  createGalleryItem,
  deleteGalleryItem,
} from '../controllers/gallery.controller';
import {
  adminListResources,
  createResource,
  updateResource,
  deleteResource,
} from '../controllers/resource.controller';
import { adminDashboard } from '../controllers/dashboard.controller';
import { exportEventRegistrations, exportStudents } from '../controllers/export.controller';
import {
  adminListContactMessages,
  adminMarkMessageRead,
  adminDeleteMessage,
  adminListGoogleForms,
  adminCreateGoogleForm,
  adminUpdateGoogleForm,
  adminDeleteGoogleForm,
  adminListRegistrations,
  adminListAttended,
} from '../controllers/adminDashboard.controller';

const router = Router();

router.use(adminProtect);

// Dashboard
router.get('/dashboard', adminDashboard);

// Events
router.get('/events', adminListEvents);
router.get('/events/:eventId', adminGetEvent);
router.post('/events', adminCreateEvent);
router.put('/events/:eventId', adminUpdateEvent);
router.delete('/events/:eventId', adminDeleteEvent);

// Event attendance
router.get('/events/:eventId/attendance', adminGetEventAttendance);
router.post('/events/:eventId/attendance', adminMarkAttendance);
router.get('/events/:eventId/attendance/qr-token', adminGetAttendanceQrToken);
router.get('/attendance/records', adminListAttendance);

// Students
router.get('/students', adminListStudents);
router.get('/students/export', exportStudents);
router.get('/students/:id', adminGetStudent);
router.patch('/students/:id/status', adminToggleStudentStatus);
router.patch('/students/:id/points', adminUpdateStudentPoints);
router.delete('/students/:id', adminDeleteStudent);

// Members
router.get('/members', adminListMembers);
router.post('/members', createMember);
router.put('/members/:id', updateMember);
router.delete('/members/:id', deleteMember);

// Certificate campaigns
router.get('/certificate-campaigns', listCampaigns);
router.get('/certificate-campaigns/:id', getCampaign);
router.post('/certificate-campaigns', createCampaign);
router.put('/certificate-campaigns/:id', updateCampaign);
router.delete('/certificate-campaigns/:id', deleteCampaign);
router.post('/certificate-campaigns/:id/calculate', calculateEligibility);
router.post('/certificate-campaigns/:id/generate', generateCertificates);
router.post('/certificate-campaigns/:id/generate/:studentId', generateSingleCertificate);

// Certificates
router.get('/certificates', adminListCertificates);
router.get('/certificates/stats', adminCertificateStats);
router.post('/certificates/:certificateId/revoke', revokeCertificate);
router.post('/certificates/:certificateId/restore', restoreCertificate);

// Gallery
router.post('/gallery', uploadMemory.single('image'), createGalleryItem);
router.delete('/gallery/:id', deleteGalleryItem);

// Resources
router.get('/resources', adminListResources);
router.post('/resources', createResource);
router.put('/resources/:id', updateResource);
router.delete('/resources/:id', deleteResource);

// Contact messages
router.get('/contact-messages', adminListContactMessages);
router.patch('/contact-messages/:id/read', adminMarkMessageRead);
router.delete('/contact-messages/:id', adminDeleteMessage);

// Google Forms (admin only)
router.get('/google-forms', adminListGoogleForms);
router.post('/google-forms', adminCreateGoogleForm);
router.put('/google-forms/:id', adminUpdateGoogleForm);
router.delete('/google-forms/:id', adminDeleteGoogleForm);

// Registrations list
router.get('/registrations', adminListRegistrations);

// Attended list
router.get('/attended', adminListAttended);

// Exports
router.get('/events/:eventId/export', exportEventRegistrations);

export default router;

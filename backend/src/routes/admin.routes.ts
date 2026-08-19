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
  adminDeleteStudent,
} from '../controllers/studentAdmin.controller';
import {
  adminListMembers,
  createMember,
  updateMember,
  deleteMember,
  getMembersImage,
  updateMembersImage,
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
import { exportStudents } from '../controllers/export.controller';
import {
  adminListRegistrations,
  adminListAttended,
} from '../controllers/adminDashboard.controller';
import {
  adminListFormRegistrations,
  adminGetFormRegistration,
  adminMarkFormRegistrationRead,
} from '../controllers/formRegistration.controller';
import {
  listEventsWithRegistrationCounts,
  listEventRegistrations,
  eventRegistrationCount,
  exportEventRegistrationsAsCsv,
  bulkAddRegistrations,
} from '../controllers/registration.controller';
import {
  generateRegistrationListPDF,
  sendEventRegistrationPDFToAll,
  sendEventEmails,
  getEventSendingHistory,
} from '../controllers/eventDistribution.controller';
import {
  deleteEventRegistration,
} from '../controllers/registration.controller';
import {
  getBulkEmailRecipients,
  sendBulkEmailToAll,
  getBulkEmailLogs,
} from '../controllers/bulkEmail.controller.js';

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

// Event registrations (Google Form webhook submissions per event)
router.get('/events-with-registrations', listEventsWithRegistrationCounts);
router.get('/events/:eventId/registrations', listEventRegistrations);
router.get('/events/:eventId/registration-count', eventRegistrationCount);
router.get('/events/:eventId/registrations/export', exportEventRegistrationsAsCsv);
router.post('/events/:eventId/registrations/bulk', bulkAddRegistrations);

// Event distribution — PDF generation + email sending + history
router.get('/events/:eventId/registration-list', generateRegistrationListPDF);
router.post('/events/:eventId/send-pdf', sendEventRegistrationPDFToAll);
router.post('/events/:eventId/send-emails', sendEventEmails);
router.get('/events/:eventId/sending-history', getEventSendingHistory);

// Delete a single event registration
router.delete('/events/:eventId/registrations/:registrationId', deleteEventRegistration);

// Registrations & Attendance (per event)
router.get('/registrations', adminListRegistrations);
router.get('/attended', adminListAttended);

// Students
router.get('/students', adminListStudents);
router.get('/students/export', exportStudents);
router.get('/students/:id', adminGetStudent);
router.patch('/students/:id/status', adminToggleStudentStatus);
router.delete('/students/:id', adminDeleteStudent);

// Members
router.get('/members', adminListMembers);
router.get('/members-image', getMembersImage);
router.put('/members-image', uploadMemory.single('image'), updateMembersImage);
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

// Form registrations (generic Google Form webhook submissions)
router.get('/form-registrations', adminListFormRegistrations);
router.get('/form-registrations/:id', adminGetFormRegistration);
router.patch('/form-registrations/:id/read', adminMarkFormRegistrationRead);

// Bulk email to all registered students
router.get('/bulk-email/recipients', getBulkEmailRecipients);
router.post('/bulk-email/send', sendBulkEmailToAll);
router.get('/bulk-email/logs', getBulkEmailLogs);

export default router;

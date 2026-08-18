import { Router } from 'express';
import { publicStats, contactForm } from '../controllers/public.controller';
import { publicGoogleForms } from '../controllers/adminDashboard.controller';

const router = Router();

router.get('/stats', publicStats);
router.post('/contact', contactForm);
router.get('/google-forms', publicGoogleForms);

export default router;

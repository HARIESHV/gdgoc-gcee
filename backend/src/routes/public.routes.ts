import { Router } from 'express';
import { publicStats, contactForm, emailStatus } from '../controllers/public.controller';

const router = Router();

router.get('/stats', publicStats);
router.get('/email-status', emailStatus);
router.post('/contact', contactForm);

export default router;

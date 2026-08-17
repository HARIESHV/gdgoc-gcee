import { Router } from 'express';
import { publicStats, contactForm } from '../controllers/public.controller';

const router = Router();

router.get('/stats', publicStats);
router.post('/contact', contactForm);

export default router;

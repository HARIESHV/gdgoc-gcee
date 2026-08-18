import { Router } from 'express';
import { googleFormWebhook, googleFormTest } from '../controllers/webhook.controller';

const router = Router();

router.post('/webhook', googleFormWebhook);
router.post('/test', googleFormTest);

export default router;

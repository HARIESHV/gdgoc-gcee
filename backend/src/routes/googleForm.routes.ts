import { Router } from 'express';
import { googleFormWebhook } from '../controllers/webhook.controller';

const router = Router();

router.post('/webhook', googleFormWebhook);

export default router;

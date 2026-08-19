import { Router } from 'express';
import { listMembers, getMembersImage } from '../controllers/member.controller';

const router = Router();

router.get('/image', getMembersImage);
router.get('/', listMembers);

export default router;

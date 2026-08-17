import { Router } from 'express';
import { register, login, logout, me, updateProfile, changePassword } from '../controllers/auth.controller';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, me);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

export default router;

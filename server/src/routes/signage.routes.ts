import { Router } from 'express';
import { getActiveSignage } from '../controllers/signage.controller';

const router = Router();

router.get('/active', getActiveSignage);

export default router;

import { Router } from 'express';
import { getNearestFacilities, listAllFacilities } from '../controllers/facility.controller';

const router = Router();

router.get('/nearest', getNearestFacilities);
router.get('/', listAllFacilities);

export default router;

import { Router } from 'express';
import {
  analyzeAndCreateIncident,
  listIncidents,
  getIncidentById,
  updateIncidentStatus,
} from '../controllers/incident.controller';
import { uploadMedia } from '../middlewares/upload';
import { analyzeRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post(
  '/analyze',
  analyzeRateLimiter,
  uploadMedia.fields([
    { name: 'image', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
  ]),
  analyzeAndCreateIncident
);

router.get('/', listIncidents);
router.get('/:id', getIncidentById);
router.patch('/:id/status', updateIncidentStatus);

export default router;

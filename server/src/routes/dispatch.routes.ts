import { Router } from 'express';
import {
  listResponseUnits,
  updateResponseUnit,
  assignUnitToIncident,
  listDispatchLogs,
} from '../controllers/dispatch.controller';

const router = Router();

router.get('/units', listResponseUnits);
router.patch('/units/:id/status', updateResponseUnit);
router.post('/assign', assignUnitToIncident);
router.get('/logs', listDispatchLogs);

export default router;

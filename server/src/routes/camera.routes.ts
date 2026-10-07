import { Router } from 'express';
import {
  listCameras,
  getCameraById,
  createCameraSession,
  registerCamera,
  updateCameraGPS,
  setCameraOffline,
  analyzeCameraFrame,
  getCameraAIEvents,
  verifyCameraIncident,
} from '../controllers/camera.controller';

const router = Router();

router.get('/', listCameras);
router.get('/events/ai', getCameraAIEvents);
router.post('/events/verify', verifyCameraIncident);
router.post('/session', createCameraSession);
router.post('/register', registerCamera);
router.get('/:id', getCameraById);
router.post('/:id/gps', updateCameraGPS);
router.post('/:id/status', setCameraOffline);
router.post('/:id/analyze', analyzeCameraFrame);

export default router;

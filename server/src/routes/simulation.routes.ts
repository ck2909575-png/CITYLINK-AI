import { Router } from 'express';
import { seedSimulationFeed } from '../controllers/simulation.controller';

const router = Router();

router.post('/seed-feed', seedSimulationFeed);

export default router;

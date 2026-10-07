import { Request, Response, NextFunction } from 'express';
import { db } from '../lib/supabaseAdmin';
import { analyzeIncidentMultimodal } from '../lib/gemini';
import { UserRole, CameraAIEvent } from '@urbanshield/shared';
import crypto from 'crypto';

export async function listCameras(req: Request, res: Response, next: NextFunction) {
  try {
    const role = (req.query.role as UserRole) || (req.headers['x-user-role'] as UserRole);
    if (role === 'citizen') {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'Citizens are not authorized to view municipal operational surveillance cameras.',
      });
    }

    const cameras = await db.getCameras(role);
    return res.json({
      success: true,
      count: cameras.length,
      data: cameras,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCameraById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const role = (req.query.role as UserRole) || (req.headers['x-user-role'] as UserRole);
    if (role === 'citizen') {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'Citizens are not authorized to view municipal operational cameras.',
      });
    }

    const camera = await db.getCameraById(id);
    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    return res.json({
      success: true,
      data: camera,
    });
  } catch (err) {
    next(err);
  }
}

export async function createCameraSession(req: Request, res: Response, next: NextFunction) {
  try {
    const cameraId = req.body.cameraId || 'CAMERA-07';
    const session = await db.createCameraSession(cameraId);

    return res.status(201).json({
      success: true,
      session,
    });
  } catch (err) {
    next(err);
  }
}

export async function registerCamera(req: Request, res: Response, next: NextFunction) {
  try {
    const { cameraId, token, latitude, longitude, accuracy } = req.body;

    if (!cameraId || !token) {
      return res.status(400).json({ error: 'cameraId and token are required' });
    }

    const isValid = await db.validateCameraSession(cameraId, token);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid or expired registration token',
        message: 'Please request a new QR registration token from Command Center.',
      });
    }

    // Set camera online with real GPS
    const updated = await db.updateCamera(cameraId, {
      status: 'ONLINE',
      is_live: true,
      gps_active: latitude !== undefined && longitude !== undefined,
      latitude: latitude !== undefined ? parseFloat(latitude) : null,
      longitude: longitude !== undefined ? parseFloat(longitude) : null,
      accuracy: accuracy !== undefined ? parseFloat(accuracy) : null,
    });

    console.log(`[CITYNEXUS Camera] Phone registered ${cameraId} ONLINE with GPS: ${latitude}, ${longitude}`);

    return res.json({
      success: true,
      message: `${cameraId} successfully registered and ONLINE`,
      camera: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCameraGPS(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { latitude, longitude, accuracy } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'latitude and longitude are required' });
    }

    const updated = await db.updateCamera(id, {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy !== undefined ? parseFloat(accuracy) : null,
      gps_active: true,
      status: 'ONLINE',
      is_live: true,
    });

    return res.json({
      success: true,
      camera: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function setCameraOffline(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const updated = await db.setCameraOffline(id);

    console.log(`[CITYNEXUS Camera] ${id} set to OFFLINE`);

    return res.json({
      success: true,
      message: `${id} is now OFFLINE`,
      camera: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function analyzeCameraFrame(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const rawFrame = req.body.frame || req.body.frameBase64;
    const rawLat = req.body.latitude !== undefined ? req.body.latitude : req.body.lat;
    const rawLng = req.body.longitude !== undefined ? req.body.longitude : req.body.lng;
    const accuracy = req.body.accuracy;

    const camera = await db.getCameraById(id);
    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    let imageBuffer: Buffer | undefined;
    let imageMimeType: string | undefined;

    if (rawFrame && rawFrame.startsWith('data:image')) {
      const matches = rawFrame.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (matches) {
        imageMimeType = matches[1];
        imageBuffer = Buffer.from(matches[2], 'base64');
      }
    }

    const lat = rawLat !== undefined ? parseFloat(rawLat) : camera.latitude || 17.6868;
    const lng = rawLng !== undefined ? parseFloat(rawLng) : camera.longitude || 83.2185;

    // Call Gemini multimodal vision triage
    const promptDescription = `Live video telemetry from smart city mobile camera ${id}. Real GPS coordinates: ${lat}, ${lng}.
Assess whether this frame reveals any of:
1. Possible vehicle accident
2. Fire
3. Smoke
4. Heavy traffic / congestion
5. Road blockage
6. Flood / water accumulation
7. Visible structural damage
8. Possible person requiring assistance`;

    const aiAnalysis = await analyzeIncidentMultimodal({
      description: promptDescription,
      categoryHint: 'TRAFFIC_ACCIDENT',
      imageBuffer,
      imageMimeType,
    });

    const isThreat =
      aiAnalysis.severity === 'CRITICAL' ||
      aiAnalysis.severity === 'HIGH' ||
      aiAnalysis.domain === 'TRAFFIC_ACCIDENT' ||
      aiAnalysis.confidence_score >= 0.7;

    const event: CameraAIEvent = {
      id: `ai-evt-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      cameraId: id,
      timestamp: new Date().toISOString(),
      incidentType: aiAnalysis.domain.replace('_', ' '),
      confidence: aiAnalysis.confidence_score,
      evidenceFrame: rawFrame || '',
      location: {
        latitude: lat,
        longitude: lng,
        accuracy: accuracy ? parseFloat(accuracy) : undefined,
      },
      status: 'AWAITING_VERIFICATION',
      aiAnalysis,
    };

    await db.addCameraAIEvent(event);

    return res.status(201).json({
      success: true,
      event,
      threatDetected: isThreat,
      label: aiAnalysis.domain.replace('_', ' '),
      confidence: aiAnalysis.confidence_score,
      eventId: event.id,
      evidenceFrame: rawFrame || '',
    });
  } catch (err) {
    next(err);
  }
}

export async function getCameraAIEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const { cameraId } = req.query as { cameraId?: string };
    const events = await db.getCameraAIEvents(cameraId);

    return res.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyCameraIncident(req: Request, res: Response, next: NextFunction) {
  try {
    const { eventId, notes } = req.body;
    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }

    const result = await db.verifyCameraAIEvent(eventId, notes);

    return res.json({
      success: true,
      message: 'Incident verified and dispatched to Police, Medical, and Traffic',
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

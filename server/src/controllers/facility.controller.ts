import { Request, Response, NextFunction } from 'express';
import { NearestFacilityQuerySchema } from '@urbanshield/shared';
import { db } from '../lib/supabaseAdmin';
import { formatDistance } from '../lib/geospatial';

export async function getNearestFacilities(req: Request, res: Response, next: NextFunction) {
  try {
    const query = NearestFacilityQuerySchema.parse(req.query);

    const facilities = await db.getFacilities({
      lat: query.lat,
      lng: query.lng,
      agency: query.agency,
      radiusMeters: query.radiusMeters,
    });

    const enriched = facilities.map((f) => ({
      ...f,
      distance_formatted: f.distance_meters !== undefined ? formatDistance(f.distance_meters) : null,
    }));

    return res.json({
      success: true,
      origin: { latitude: query.lat, longitude: query.lng },
      radius_meters: query.radiusMeters,
      count: enriched.length,
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

export async function listAllFacilities(req: Request, res: Response, next: NextFunction) {
  try {
    const { agency } = req.query as { agency?: string };
    const facilities = await db.getFacilities({ agency });

    return res.json({
      success: true,
      count: facilities.length,
      data: facilities,
    });
  } catch (err) {
    next(err);
  }
}

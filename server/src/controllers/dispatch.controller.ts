import { Request, Response, NextFunction } from 'express';
import { db } from '../lib/supabaseAdmin';
import { formatDistance } from '../lib/geospatial';

export async function listResponseUnits(req: Request, res: Response, next: NextFunction) {
  try {
    const { agency, status, lat, lng } = req.query as {
      agency?: string;
      status?: string;
      lat?: string;
      lng?: string;
    };

    const latitude = lat ? parseFloat(lat) : undefined;
    const longitude = lng ? parseFloat(lng) : undefined;

    const normalizedQueryStatus = typeof status === 'string' ? status.trim().toUpperCase().replace(/\s+/g, '_') : undefined;

    const units = await db.getUnits({
      agency,
      status: normalizedQueryStatus,
      lat: latitude,
      lng: longitude,
    });

    const enriched = units.map((u) => ({
      ...u,
      distance_formatted: u.distance_meters !== undefined ? formatDistance(u.distance_meters) : null,
    }));

    return res.json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateResponseUnit(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { status, assigned_incident_id, latitude, longitude } = req.body;

    let normalizedStatus = status;
    if (typeof status === 'string') {
      normalizedStatus = status.trim().toUpperCase().replace(/\s+/g, '_');
    }

    const updated = await db.updateUnit(id, {
      ...(normalizedStatus && { status: normalizedStatus }),
      ...(assigned_incident_id !== undefined && { assigned_incident_id }),
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
    });

    if (!updated) {
      return res.status(404).json({ error: 'Response unit not found' });
    }

    return res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function assignUnitToIncident(req: Request, res: Response, next: NextFunction) {
  try {
    const { incidentId, unitId, notes } = req.body;

    if (!incidentId || !unitId) {
      return res.status(400).json({ error: 'incidentId and unitId are required' });
    }

    const incident = await db.getIncidentById(incidentId);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Update unit
    const unit = await db.updateUnit(unitId, {
      status: 'ASSIGNED',
      assigned_incident_id: incidentId,
    });

    // Update incident
    const updatedIncident = await db.updateIncident(incidentId, {
      status: 'DISPATCHED',
      assigned_unit_id: unitId,
    });

    // Add log
    const log = await db.addDispatchLog({
      incident_id: incidentId,
      unit_id: unitId,
      previous_status: incident.status,
      new_status: 'DISPATCHED',
      notes: notes || `Unit ${unit?.unit_callsign || unitId} dispatched to scene`,
    });

    return res.json({
      success: true,
      incident: updatedIncident,
      unit,
      log,
    });
  } catch (err) {
    next(err);
  }
}

export async function listDispatchLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { incidentId } = req.query as { incidentId?: string };
    const logs = await db.getDispatchLogs(incidentId);

    return res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
}

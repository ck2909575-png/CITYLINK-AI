import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchIncidents,
  fetchIncidentById,
  submitIncidentMultipart,
  updateIncidentStatusApi,
  fetchNearestFacilities,
  fetchResponseUnits,
  assignUnitApi,
  fetchActiveSignage,
  fetchDispatchLogs,
  triggerSimulationFeed,
} from '../lib/api';
import { IncidentStatus } from '@urbanshield/shared';
import { toast } from 'sonner';

export function useIncidents(filter?: { status?: string; severity?: string; agency?: string }) {
  return useQuery({
    queryKey: ['incidents', filter],
    queryFn: () => fetchIncidents(filter),
    refetchInterval: 10000,
  });
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: ['incident', id],
    queryFn: () => fetchIncidentById(id),
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useSubmitSOS() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => submitIncidentMultipart(formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast.success('🚨 Emergency SOS Dispatched to Command Mesh', {
        description: `Incident ID: ${data.incident.id.slice(0, 8)}... - Assigned: ${data.incident.primary_agency}`,
      });
    },
    onError: (err: any) => {
      toast.error('Failed to submit SOS report', {
        description: err.message || 'Please check your connection or call 911 directly.',
      });
    },
  });
}

export function useUpdateIncidentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      unit_id,
      notes,
    }: {
      id: string;
      status: IncidentStatus;
      unit_id?: string;
      notes?: string;
    }) => updateIncidentStatusApi(id, { status, unit_id, notes }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident', data.id] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success(`Status updated to ${data.status}`);
    },
    onError: (err: any) => {
      toast.error('Failed to update status', { description: err.message });
    },
  });
}

export function useNearestFacilities(params: {
  lat: number;
  lng: number;
  agency?: string;
  radiusMeters?: number;
}) {
  return useQuery({
    queryKey: ['nearest-facilities', params],
    queryFn: () => fetchNearestFacilities(params),
    enabled: !isNaN(params.lat) && !isNaN(params.lng),
  });
}

export function useResponseUnits(params?: {
  agency?: string;
  status?: string;
  lat?: number;
  lng?: number;
}) {
  return useQuery({
    queryKey: ['units', params],
    queryFn: () => fetchResponseUnits(params),
    refetchInterval: 10000,
  });
}

export function useAssignUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { incidentId: string; unitId: string; notes?: string }) =>
      assignUnitApi(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success('Unit assigned and dispatched successfully!');
    },
  });
}

export function useActiveSignage() {
  return useQuery({
    queryKey: ['active-signage'],
    queryFn: () => fetchActiveSignage(),
    refetchInterval: 8000,
  });
}

export function useDispatchLogs(incidentId?: string) {
  return useQuery({
    queryKey: ['dispatch-logs', incidentId],
    queryFn: () => fetchDispatchLogs(incidentId),
    refetchInterval: 10000,
  });
}

export function useTriggerSimulation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (presetIndex?: number) => triggerSimulationFeed(presetIndex),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['active-signage'] });
      toast.info('⚡ IoT / CCTV Telemetry Injected', {
        description: data.incident.title,
      });
    },
  });
}

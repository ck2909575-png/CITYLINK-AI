import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCameras,
  fetchCameraById,
  fetchCameraEvents,
  verifyCameraEventApi,
} from '../lib/api';
import { CameraRecord, CameraAIEvent } from '@urbanshield/shared';
import { toast } from 'sonner';

export function useCameras(role: string = 'command_operator') {
  return useQuery<CameraRecord[]>({
    queryKey: ['cameras', role],
    queryFn: () => fetchCameras(role),
    refetchInterval: 3000,
  });
}

export function useCamera(id: string) {
  return useQuery<CameraRecord>({
    queryKey: ['camera', id],
    queryFn: () => fetchCameraById(id),
    enabled: !!id,
    refetchInterval: 2000,
  });
}

export function useCameraEvents(cameraId?: string) {
  return useQuery<CameraAIEvent[]>({
    queryKey: ['camera-events', cameraId],
    queryFn: () => fetchCameraEvents(cameraId),
    refetchInterval: 3000,
  });
}

export function useVerifyCameraEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, verified }: { eventId: string; verified: boolean }) =>
      verifyCameraEventApi(eventId, verified),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['camera-events'] });
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      if (variables.verified) {
        toast.success('Incident Verified & Multi-Agency Dispatch Triggered', {
          description: `Dispatched: POLICE, MEDICAL, TRAFFIC. Nearest hospital route plotted.`,
        });
      } else {
        toast.info('Event dismissed as false positive.');
      }
    },
    onError: (err: any) => {
      toast.error('Failed to update event verification', {
        description: err.message,
      });
    },
  });
}

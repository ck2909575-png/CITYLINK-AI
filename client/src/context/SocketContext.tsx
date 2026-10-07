import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SocketContextType {
  isConnected: boolean;
  lastMessageTime: string | null;
  sendMessage: (msg: any) => void;
  addListener: (listener: (msg: any) => void) => () => void;
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  lastMessageTime: null,
  sendMessage: () => {},
  addListener: () => () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const listenersRef = React.useRef<Set<(msg: any) => void>>(new Set());
  const socketRef = React.useRef<WebSocket | null>(null);

  const sendMessage = React.useCallback((msg: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } else {
      console.warn('[UrbanShield Socket] Cannot send message, socket not open');
    }
  }, []);

  const addListener = React.useCallback((listener: (msg: any) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // If in dev with Vite port 5173, connect to 5000; otherwise window.location.host
    const host =
      window.location.port === '5173'
        ? `${window.location.hostname}:5000`
        : window.location.host;

    const wsUrl = `${protocol}//${host}/ws/realtime`;

    let reconnectTimeout: any = null;

    function connect() {
      try {
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          setIsConnected(true);
          console.log('[UrbanShield Socket] Connected to realtime mesh.');
        };

        socket.onmessage = (event) => {
          setLastMessageTime(new Date().toISOString());
          try {
            const data = JSON.parse(event.data);

            // Notify custom component listeners (WebRTC signaling, live frame relay, etc.)
            listenersRef.current.forEach((fn) => {
              try {
                fn(data);
              } catch (e) {
                console.error('[UrbanShield Socket] Listener error:', e);
              }
            });

            if (data.type === 'INCIDENT_CREATED') {
              const inc = data.payload;
              queryClient.invalidateQueries({ queryKey: ['incidents'] });
              queryClient.invalidateQueries({ queryKey: ['active-signage'] });

              if (inc) {
                const isCritical = inc.severity === 'CRITICAL' || inc.severity === 'HIGH';
                if (isCritical) {
                  toast.error(`🚨 ${inc.severity || 'CRITICAL'} EMERGENCY DETECTED`, {
                    description: `${inc.title || 'Incident'} - ${inc.primary_agency || 'Response'} dispatched`,
                    duration: 8000,
                  });
                } else {
                  toast.warning(`⚠️ New Incident Logged: ${inc.title || 'Incident'}`, {
                    description: inc.address || 'Smart City Grid',
                    duration: 5000,
                  });
                }
              }
            } else if (data.type === 'INCIDENT_UPDATED') {
              const inc = data.payload;
              queryClient.invalidateQueries({ queryKey: ['incidents'] });
              if (inc?.id) {
                queryClient.invalidateQueries({ queryKey: ['incident', inc.id] });
              }
              queryClient.invalidateQueries({ queryKey: ['active-signage'] });

              if (inc?.title) {
                toast.info(`Status Update: ${inc.title}`, {
                  description: `New status: ${inc.status || 'Updated'}`,
                });
              }
            } else if (data.type === 'UNIT_UPDATED') {
              queryClient.invalidateQueries({ queryKey: ['units'] });
            } else if (data.type === 'DISPATCH_LOG') {
              queryClient.invalidateQueries({ queryKey: ['dispatch-logs'] });
            } else if (data.type === 'CAMERA_REGISTERED' || data.type === 'CAMERA_STATUS_UPDATE') {
              queryClient.invalidateQueries({ queryKey: ['cameras'] });
              const cam = data.payload?.camera || data.payload;
              if (cam?.id) {
                queryClient.invalidateQueries({ queryKey: ['camera', cam.id] });
              }
            } else if (data.type === 'CAMERA_GPS_UPDATE') {
              queryClient.invalidateQueries({ queryKey: ['cameras'] });
              if (data.payload?.id) {
                queryClient.invalidateQueries({ queryKey: ['camera', data.payload.id] });
              }
            } else if (data.type === 'CAMERA_AI_ALERT') {
              queryClient.invalidateQueries({ queryKey: ['cameras'] });
              queryClient.invalidateQueries({ queryKey: ['camera-events'] });
              queryClient.invalidateQueries({ queryKey: ['incidents'] });
              const evt = data.payload;
              if (evt) {
                toast.error(`🚨 REAL-TIME AI ALERT: ${evt.threat_type || 'Potential Hazard'}`, {
                  description: `Camera: ${evt.camera_id || 'CCTV'} (${Math.round((evt.confidence || 0.9) * 100)}% Confidence) - Awaiting Verification`,
                  duration: 9000,
                });
              }
            } else if (data.type === 'CAMERA_STREAM_ENDED') {
              queryClient.invalidateQueries({ queryKey: ['cameras'] });
              if (data.payload?.cameraId) {
                toast.info(`Camera Stream Ended: ${data.payload.cameraId}`);
              }
            }
          } catch (e) {
            console.error('[UrbanShield Socket] Message parse error:', e);
          }
        };

        socket.onclose = () => {
          setIsConnected(false);
          socketRef.current = null;
          reconnectTimeout = setTimeout(connect, 3000);
        };

        socket.onerror = () => {
          socket?.close();
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [queryClient]);

  return (
    <SocketContext.Provider value={{ isConnected, lastMessageTime, sendMessage, addListener }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);


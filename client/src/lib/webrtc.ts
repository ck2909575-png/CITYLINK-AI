// WebRTC Signaling and Peer Connection Manager for CITYNEXUS / URBANSHIELD
// Handles real-time video streaming between mobile devices and the Command Center

export const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ],
};

/**
 * Creates a streamer peer connection on the mobile device to transmit camera video
 */
export class CameraStreamerConnection {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private cameraId: string;
  private sendSocket: (msg: any) => void;
  private unsubscribeSocket: (() => void) | null = null;
  private relayInterval: any = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;

  constructor(
    cameraId: string,
    sendSocket: (msg: any) => void,
    addListener: (listener: (msg: any) => void) => () => void
  ) {
    this.cameraId = cameraId;
    this.sendSocket = sendSocket;

    this.unsubscribeSocket = addListener((msg) => {
      this.handleSocketMessage(msg);
    });
  }

  public async startStreaming(stream: MediaStream, previewVideo?: HTMLVideoElement) {
    this.localStream = stream;
    this.videoElement = previewVideo || null;
    this.canvasElement = document.createElement('canvas');

    await this.initPeerConnection();

    // Start fallback frame relay every 700ms so Command Center receives video frames even if strict NAT blocks direct P2P
    this.startFrameRelay();
  }

  private async initPeerConnection() {
    if (this.pc) {
      this.pc.close();
    }

    this.pc = new RTCPeerConnection(RTC_CONFIGURATION);

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (this.localStream && this.pc) {
          this.pc.addTrack(track, this.localStream);
        }
      });
    }

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSocket({
          type: 'WEBRTC_ICE_CANDIDATE',
          cameraId: this.cameraId,
          target: 'viewer',
          candidate: event.candidate,
        });
      }
    };

    this.pc.onconnectionstatechange = () => {
      console.log(`[WebRTC Streamer ${this.cameraId}] Connection state:`, this.pc?.connectionState);
    };
  }

  private async handleSocketMessage(msg: any) {
    if (msg.cameraId !== this.cameraId) return;

    switch (msg.type) {
      case 'VIEWER_JOINED': {
        // A viewer joined in Command Center, initiate WebRTC Offer
        console.log(`[WebRTC Streamer ${this.cameraId}] Viewer joined. Creating Offer...`);
        try {
          if (!this.pc || this.pc.signalingState === 'closed') {
            await this.initPeerConnection();
          }
          if (this.pc) {
            const offer = await this.pc.createOffer({
              offerToReceiveAudio: false,
              offerToReceiveVideo: false,
            });
            await this.pc.setLocalDescription(offer);
            this.sendSocket({
              type: 'WEBRTC_OFFER',
              cameraId: this.cameraId,
              sdp: offer,
            });
          }
        } catch (err) {
          console.error(`[WebRTC Streamer ${this.cameraId}] Error creating offer:`, err);
        }
        break;
      }

      case 'WEBRTC_ANSWER': {
        console.log(`[WebRTC Streamer ${this.cameraId}] Received Answer from Command Center`);
        try {
          if (this.pc && this.pc.signalingState === 'have-local-offer') {
            await this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          }
        } catch (err) {
          console.error(`[WebRTC Streamer ${this.cameraId}] Error setting remote description:`, err);
        }
        break;
      }

      case 'WEBRTC_ICE_CANDIDATE': {
        if (msg.target === 'streamer' && msg.candidate && this.pc) {
          try {
            await this.pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } catch (err) {
            console.warn(`[WebRTC Streamer ${this.cameraId}] Error adding ICE candidate:`, err);
          }
        }
        break;
      }
    }
  }

  private startFrameRelay() {
    if (this.relayInterval) clearInterval(this.relayInterval);

    this.relayInterval = setInterval(() => {
      if (!this.videoElement || !this.canvasElement) return;
      if (this.videoElement.readyState < 2) return;

      const video = this.videoElement;
      const canvas = this.canvasElement;

      // Scale down to 480x270 for ultra-fast, smooth WebSocket streaming
      const width = 480;
      const height = Math.round((video.videoHeight / (video.videoWidth || 1)) * 480) || 270;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
        this.sendSocket({
          type: 'CAMERA_FRAME_RELAY',
          cameraId: this.cameraId,
          frame: dataUrl,
          timestamp: new Date().toISOString(),
        });
      }
    }, 700);
  }

  public stop() {
    if (this.relayInterval) {
      clearInterval(this.relayInterval);
      this.relayInterval = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.unsubscribeSocket) {
      this.unsubscribeSocket();
      this.unsubscribeSocket = null;
    }
    this.sendSocket({
      type: 'CAMERA_STOP_STREAM',
      cameraId: this.cameraId,
    });
  }
}

/**
 * Creates a viewer peer connection in Command Center to receive live video from the phone
 */
export class CameraViewerConnection {
  private pc: RTCPeerConnection | null = null;
  private cameraId: string;
  private sendSocket: (msg: any) => void;
  private onRemoteStream: (stream: MediaStream) => void;
  private onRelayFrame: (frameBase64: string) => void;
  private unsubscribeSocket: (() => void) | null = null;

  constructor(
    cameraId: string,
    sendSocket: (msg: any) => void,
    addListener: (listener: (msg: any) => void) => () => void,
    onRemoteStream: (stream: MediaStream) => void,
    onRelayFrame: (frameBase64: string) => void
  ) {
    this.cameraId = cameraId;
    this.sendSocket = sendSocket;
    this.onRemoteStream = onRemoteStream;
    this.onRelayFrame = onRelayFrame;

    this.unsubscribeSocket = addListener((msg) => {
      this.handleSocketMessage(msg);
    });

    this.initPeerConnection();
  }

  private initPeerConnection() {
    if (this.pc) {
      this.pc.close();
    }

    this.pc = new RTCPeerConnection(RTC_CONFIGURATION);

    this.pc.ontrack = (event) => {
      console.log(`[WebRTC Viewer ${this.cameraId}] Received remote video track!`);
      if (event.streams && event.streams[0]) {
        this.onRemoteStream(event.streams[0]);
      } else {
        const stream = new MediaStream([event.track]);
        this.onRemoteStream(stream);
      }
    };

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSocket({
          type: 'WEBRTC_ICE_CANDIDATE',
          cameraId: this.cameraId,
          target: 'streamer',
          candidate: event.candidate,
        });
      }
    };

    this.pc.onconnectionstatechange = () => {
      console.log(`[WebRTC Viewer ${this.cameraId}] Connection state:`, this.pc?.connectionState);
    };

    // Notify backend that this client wants to view the camera
    this.sendSocket({
      type: 'CAMERA_SUBSCRIBE_STREAM',
      cameraId: this.cameraId,
    });
  }

  private async handleSocketMessage(msg: any) {
    if (msg.cameraId !== this.cameraId) return;

    switch (msg.type) {
      case 'WEBRTC_OFFER': {
        console.log(`[WebRTC Viewer ${this.cameraId}] Received Offer from phone. Generating Answer...`);
        try {
          if (!this.pc || this.pc.signalingState === 'closed') {
            this.initPeerConnection();
          }
          if (this.pc) {
            await this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            const answer = await this.pc.createAnswer();
            await this.pc.setLocalDescription(answer);
            this.sendSocket({
              type: 'WEBRTC_ANSWER',
              cameraId: this.cameraId,
              sdp: answer,
            });
          }
        } catch (err) {
          console.error(`[WebRTC Viewer ${this.cameraId}] Error handling offer:`, err);
        }
        break;
      }

      case 'WEBRTC_ICE_CANDIDATE': {
        if (msg.target === 'viewer' && msg.candidate && this.pc) {
          try {
            await this.pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } catch (err) {
            console.warn(`[WebRTC Viewer ${this.cameraId}] Error adding ICE candidate:`, err);
          }
        }
        break;
      }

      case 'CAMERA_FRAME_RELAY': {
        if (msg.frame) {
          this.onRelayFrame(msg.frame);
        }
        break;
      }
    }
  }

  public reconnect() {
    this.initPeerConnection();
  }

  public close() {
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.unsubscribeSocket) {
      this.unsubscribeSocket();
      this.unsubscribeSocket = null;
    }
  }
}

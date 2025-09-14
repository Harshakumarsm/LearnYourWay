declare module "zego-express-engine-webrtc" {
  interface ZegoUser {
    userID: string;
    userName: string;
  }

  interface ZegoRoomConfig {
    userUpdate: boolean;
  }

  interface ZegoStream {
    streamID: string;
    mediaStream: MediaStream;
  }

  interface ZegoStreamConfig {
    camera: {
      video: boolean;
      audio: boolean;
    };
  }

  type RoomState = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';
  type UpdateType = 'ADD' | 'DELETE';

  interface ZegoExpressEngine {
    on(event: 'roomStateChanged', callback: (roomID: string, state: RoomState, errorCode: number, extendedData: string) => void): void;
    on(event: 'roomUserUpdate', callback: (roomID: string, updateType: UpdateType, userList: ZegoUser[]) => void): void;
    on(event: 'roomStreamUpdate', callback: (roomID: string, updateType: UpdateType, streamList: ZegoStream[], extendedData: string) => void): void;
    
    loginRoom(roomID: string, user: ZegoUser, config?: ZegoRoomConfig): Promise<void>;
    logoutRoom(roomID: string): Promise<void>;
    
    createStream(config: ZegoStreamConfig): Promise<{ streamID: string; mediaStream: MediaStream }>;
    startPublishingStream(streamID: string, mediaStream: MediaStream): Promise<void>;
    stopPublishingStream(streamID: string): Promise<void>;
    
    startPlayingStream(streamID: string, element: HTMLVideoElement): Promise<void>;
    stopPlayingStream(streamID: string): Promise<void>;
    
    destroyEngine(): void;
  }

  export default class ZegoExpressEngine {
    constructor(appID: number, appSign: string);
  }
}

export type LayoutPresetId =
  | 'pip-vertical-capsule'
  | 'pip-circle-bubble'
  | 'zoom-split-stage'
  | 'side-by-side-50'
  | 'camera-solo'
  | 'screen-only';

export type StageSourceType =
  | 'linux-desktop-sim'
  | 'screen-live'
  | 'video-file'
  | 'slide-deck'
  | 'web-embed';

export type CameraShape = 'capsule' | 'rounded' | 'circle' | 'sharp';

export interface CameraConfig {
  enabled: boolean;
  useRealWebcam: boolean;
  /** Center X position in percentage (0 - 100) of canvas */
  x: number;
  /** Center Y position in percentage (0 - 100) of canvas */
  y: number;
  /** Width in percentage (10 - 50) of canvas width */
  width: number;
  aspectRatio: '3:4' | '1:1' | '16:9';
  shape: CameraShape;
  borderColor: string;
  borderWidth: number;
  mirrored: boolean;
  showBadge: boolean;
  badgeText: string;
  badgeSubtext: string;
  showCoHost: boolean;
}

export interface SubtitleConfig {
  enabled: boolean;
  text: string;
  autoSpeechToText: boolean;
  language: 'id-ID' | 'en-US';
  positionY: number; // percentage from top (default ~90)
  fontSize: 'sm' | 'md' | 'lg';
  scriptLines: string[];
  activeScriptIndex: number;
}

export interface FloatingOverlayItem {
  id: string;
  type: 'lower-third' | 'web-widget' | 'file-card' | 'chat-spotlight';
  title: string;
  subtitle: string;
  contentUrl?: string;
  codeSnippet?: string;
  visible: boolean;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 15-60
}

export interface StreamDestination {
  id: string;
  platform: 'YouTube Live' | 'Twitch' | 'TikTok Live' | 'Zoom / Teams RTMP' | 'Facebook Live';
  rtmpUrl: string;
  streamKey: string;
  enabled: boolean;
  status: 'idle' | 'connecting' | 'live';
  viewers: number;
}

export interface RecordedClip {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  durationSec: number;
  sizeBytes: number;
  resolution: string;
}

export interface ChatMessage {
  id: string;
  author: string;
  platform: 'YouTube Live' | 'Twitch' | 'TikTok Live' | 'Zoom';
  text: string;
  timestamp: string;
  pinnedOnStage?: boolean;
}

export interface LayoutSnapshotPreset {
  id: string;
  name: string;
  createdAt: string;
  layoutPreset: LayoutPresetId;
  cameraConfig: CameraConfig;
  overlays: FloatingOverlayItem[];
  subtitleEnabled: boolean;
  subtitlePositionY: number;
}


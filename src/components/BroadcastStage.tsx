import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  CameraConfig,
  FloatingOverlayItem,
  LayoutPresetId,
  StageSourceType,
  SubtitleConfig,
} from '../types/studio';
import wallpaperUrl from '../assets/images/wallpaper_classical_river_1790916439301.jpg';
import presenterUrl from '../assets/images/presenter_studio_cam_1790916458480.jpg';
import {
  Move,
  Maximize2,
  Monitor,
  Camera,
  Mic,
  MicOff,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Globe,
  FileText,
  Layers,
  Sun,
  Moon,
} from 'lucide-react';

interface BroadcastStageProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  layoutPreset: LayoutPresetId;
  stageSource: StageSourceType;
  cameraConfig: CameraConfig;
  onUpdateCamera: (patch: Partial<CameraConfig>) => void;
  subtitleConfig: SubtitleConfig;
  overlays: FloatingOverlayItem[];
  onUpdateOverlay: (id: string, patch: Partial<FloatingOverlayItem>) => void;
  screenVideoEl: HTMLVideoElement | null;
  webcamVideoEl: HTMLVideoElement | null;
  uploadedVideoEl: HTMLVideoElement | null;
  uploadedImageEl: HTMLImageElement | null;
  isRecording: boolean;
  isStreaming: boolean;
  recordingSeconds: number;
  micEnabled: boolean;
  micLevel: number; // 0 to 100
  onToggleMic: () => void;
  onStartRealScreenShare: () => void;
  onToggleRealWebcam: () => void;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  slideIndex: number;
  onChangeSlide: (nextIndex: number) => void;
  webEmbedData: {
    url: string;
    title: string;
    headlines: string[];
  };
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const SLIDE_DECK_PAGES = [
  {
    kicker: 'MODUL 01 · ARSITEKTUR JARINGAN & LINUX',
    title: 'Otomatisasi Deployment Server dengan Omarchy CLI',
    bullets: [
      'Instalasi paket inti sistem secara terisolasi & deterministik',
      'Konfigurasi dotfiles dan window manager otomatis dalam 45 detik',
      'Manajemen rollback instan melalui menu Preinstalls',
    ],
    metric: '99.4% Uptime Ketersediaan Node Produksi',
  },
  {
    kicker: 'MODUL 02 · TOPOLOGI MULTI-CLOUD',
    title: 'Zero-Trust Tunneling & Distribusi Edge Global',
    bullets: [
      'Enkripsi end-to-end WireGuard antar cluster regional',
      'Load balancing adaptif berbasis latensi real-time',
      'Observabilitas terpadu tanpa overhead kontainer',
    ],
    metric: '14ms Rata-rata Latensi Antar-Region',
  },
  {
    kicker: 'MODUL 03 · BENCHMARK PERFORMA',
    title: 'Perbandingan Throughput Kernel & Memori',
    bullets: [
      'Pengurangan konsumsi RAM idle hingga 62% dibanding distro standar',
      'Kompilasi kontainer CI/CD 2.8x lebih cepat di lingkungan produksi',
      'Integrasi penuh dengan kunci keamanan hardware FIDO2',
    ],
    metric: '2.8x Kecepatan Build Pipeline',
  },
];

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export const BroadcastStage: React.FC<BroadcastStageProps> = ({
  canvasRef,
  layoutPreset,
  stageSource,
  cameraConfig,
  onUpdateCamera,
  subtitleConfig,
  overlays,
  onUpdateOverlay,
  screenVideoEl,
  webcamVideoEl,
  uploadedVideoEl,
  uploadedImageEl,
  isRecording,
  isStreaming,
  recordingSeconds,
  micEnabled,
  micLevel,
  onToggleMic,
  onStartRealScreenShare,
  onToggleRealWebcam,
  selectedElementId,
  onSelectElement,
  slideIndex,
  onChangeSlide,
  webEmbedData,
  theme,
  onToggleTheme,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wallpaperImgRef = useRef<HTMLImageElement | null>(null);
  const presenterImgRef = useRef<HTMLImageElement | null>(null);

  // Interactive state inside the Linux Desktop Simulator (matches the reference screenshot!)
  const [linuxMenuSelected, setLinuxMenuSelected] = useState<number>(0);
  const [linuxSearchText] = useState<string>('install');
  const [linuxSubmenuStatus, setLinuxSubmenuStatus] = useState<string | null>(null);

  // On-stage & dock dynamic audio waveform visualizer states
  const [showStageWaveform, setShowStageWaveform] = useState<boolean>(true);
  const [simulateAudioPulse, setSimulateAudioPulse] = useState<boolean>(false);
  const waveformHistoryRef = useRef<number[]>(Array(32).fill(4));
  const dockWaveformCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Effective audio level combining real micLevel and optional test pulse
  const effectiveMicLevel = micEnabled
    ? micLevel
    : simulateAudioPulse
      ? 55
      : 0;

  // Dragging state for Camera PiP or Floating Overlays
  const [dragState, setDragState] = useState<{
    targetType: 'camera' | 'camera-resize' | 'overlay';
    targetId: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialWidth: number;
  } | null>(null);

  // Load generated studio assets for canvas compositor
  useEffect(() => {
    const wp = new Image();
    wp.crossOrigin = 'anonymous';
    wp.src = wallpaperUrl;
    wp.onload = () => {
      wallpaperImgRef.current = wp;
    };

    const pr = new Image();
    pr.crossOrigin = 'anonymous';
    pr.src = presenterUrl;
    pr.onload = () => {
      presenterImgRef.current = pr;
    };
  }, []);

  // Format duration helper
  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(s).padStart(2, '0'),
    ]
      .filter(Boolean)
      .join(':');
  };

  // Convert client pointer coordinates to canvas percentage (0 - 100)
  const getCanvasPercentCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { px: 50, py: 50 };
    const rect = canvas.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * 100;
    const py = ((clientY - rect.top) / rect.height) * 100;
    return {
      px: Math.max(0, Math.min(100, px)),
      py: Math.max(0, Math.min(100, py)),
    };
  }, [canvasRef]);

  // Global mouse move / up for smooth dragging on the live stage
  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e: PointerEvent) => {
      const { px, py } = getCanvasPercentCoords(e.clientX, e.clientY);
      const dx = px - dragState.startX;
      const dy = py - dragState.startY;

      if (dragState.targetType === 'camera') {
        onUpdateCamera({
          x: Math.max(8, Math.min(92, Math.round((dragState.initialX + dx) * 10) / 10)),
          y: Math.max(10, Math.min(90, Math.round((dragState.initialY + dy) * 10) / 10)),
        });
      } else if (dragState.targetType === 'camera-resize') {
        const newWidth = Math.max(12, Math.min(45, dragState.initialWidth + dx));
        onUpdateCamera({
          width: Math.round(newWidth * 10) / 10,
        });
      } else if (dragState.targetType === 'overlay') {
        onUpdateOverlay(dragState.targetId, {
          x: Math.max(5, Math.min(95, Math.round((dragState.initialX + dx) * 10) / 10)),
          y: Math.max(5, Math.min(95, Math.round((dragState.initialY + dy) * 10) / 10)),
        });
      }
    };

    const handlePointerUp = () => {
      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, getCanvasPercentCoords, onUpdateCamera, onUpdateOverlay]);

  // Main 60FPS Canvas Rendering Loop
  useEffect(() => {
    let animationFrameId: number;

    const renderFrame = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.width; // 1920
      const H = canvas.height; // 1080

      ctx.clearRect(0, 0, W, H);

      // Helper to draw a source into a given target box (sx, sy, sw, sh)
      const drawMainBackgroundSource = (bx: number, by: number, bw: number, bh: number) => {
        ctx.save();
        ctx.beginPath();
        ctx.rect(bx, by, bw, bh);
        ctx.clip();

        if (stageSource === 'screen-live' && screenVideoEl && screenVideoEl.readyState >= 2) {
          // Draw real screen share stream preserving aspect ratio
          ctx.fillStyle = '#070A0F';
          ctx.fillRect(bx, by, bw, bh);
          const vw = screenVideoEl.videoWidth || 1920;
          const vh = screenVideoEl.videoHeight || 1080;
          const scale = Math.min(bw / vw, bh / vh);
          const dw = vw * scale;
          const dh = vh * scale;
          ctx.drawImage(screenVideoEl, bx + (bw - dw) / 2, by + (bh - dh) / 2, dw, dh);
        } else if (stageSource === 'video-file' && uploadedVideoEl && uploadedVideoEl.readyState >= 2) {
          ctx.fillStyle = '#070A0F';
          ctx.fillRect(bx, by, bw, bh);
          const vw = uploadedVideoEl.videoWidth || 1920;
          const vh = uploadedVideoEl.videoHeight || 1080;
          const scale = Math.min(bw / vw, bh / vh);
          const dw = vw * scale;
          const dh = vh * scale;
          ctx.drawImage(uploadedVideoEl, bx + (bw - dw) / 2, by + (bh - dh) / 2, dw, dh);
        } else if (stageSource === 'video-file' && uploadedImageEl) {
          ctx.fillStyle = '#070A0F';
          ctx.fillRect(bx, by, bw, bh);
          const iw = uploadedImageEl.naturalWidth || 1920;
          const ih = uploadedImageEl.naturalHeight || 1080;
          const scale = Math.min(bw / iw, bh / ih);
          const dw = iw * scale;
          const dh = ih * scale;
          ctx.drawImage(uploadedImageEl, bx + (bw - dw) / 2, by + (bh - dh) / 2, dw, dh);
        } else if (stageSource === 'slide-deck') {
          // Render Presentation Slide Deck directly onto canvas
          const slide = SLIDE_DECK_PAGES[slideIndex % SLIDE_DECK_PAGES.length];
          const grad = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
          grad.addColorStop(0, '#0F172A');
          grad.addColorStop(1, '#090D16');
          ctx.fillStyle = grad;
          ctx.fillRect(bx, by, bw, bh);

          // Subtle grid lines
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
          ctx.lineWidth = 1;
          for (let gx = bx; gx < bx + bw; gx += 64) {
            ctx.beginPath();
            ctx.moveTo(gx, by);
            ctx.lineTo(gx, by + bh);
            ctx.stroke();
          }
          for (let gy = by; gy < by + bh; gy += 64) {
            ctx.beginPath();
            ctx.moveTo(bx, gy);
            ctx.lineTo(bx + bw, gy);
            ctx.stroke();
          }

          const padX = bw * 0.08;
          const padY = bh * 0.14;

          // Kicker
          ctx.fillStyle = '#F59E0B';
          ctx.font = '600 22px "JetBrains Mono", monospace';
          ctx.fillText(slide.kicker, bx + padX, by + padY);

          // Title
          ctx.fillStyle = '#F8FAFC';
          ctx.font = '700 54px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(slide.title, bx + padX, by + padY + 76, bw * 0.82);

          // Divider
          ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
          ctx.fillRect(bx + padX, by + padY + 115, 140, 4);

          // Bullets
          slide.bullets.forEach((b, idx) => {
            const itemY = by + padY + 195 + idx * 84;
            ctx.fillStyle = '#F59E0B';
            ctx.beginPath();
            ctx.arc(bx + padX + 14, itemY - 12, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#E2E8F0';
            ctx.font = '500 32px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(b, bx + padX + 44, itemY, bw * 0.72);
          });

          // Bottom Metric Bar
          drawRoundedRectPath(ctx, bx + padX, by + bh - padY - 70, bw * 0.52, 74, 14);
          ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#38BDF8';
          ctx.font = '600 26px "JetBrains Mono", monospace';
          ctx.fillText(
            `BENCHMARK: ${slide.metric}   ·   SLIDE 0${slideIndex + 1}/0${SLIDE_DECK_PAGES.length}`,
            bx + padX + 28,
            by + bh - padY - 24
          );
        } else if (stageSource === 'web-embed') {
          // Render Live Browser / Documentation View on Canvas
          ctx.fillStyle = '#0D1117';
          ctx.fillRect(bx, by, bw, bh);

          // Browser Top Chrome
          ctx.fillStyle = '#161B22';
          ctx.fillRect(bx, by, bw, 68);
          ctx.strokeStyle = '#30363D';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bx, by + 68);
          ctx.lineTo(bx + bw, by + 68);
          ctx.stroke();

          // Window dots
          ['#FF5F56', '#FFBD2E', '#27C93F'].forEach((c, i) => {
            ctx.fillStyle = c;
            ctx.beginPath();
            ctx.arc(bx + 36 + i * 26, by + 34, 8, 0, Math.PI * 2);
            ctx.fill();
          });

          // URL Bar
          drawRoundedRectPath(ctx, bx + 130, by + 14, bw * 0.55, 40, 8);
          ctx.fillStyle = '#0D1117';
          ctx.fill();
          ctx.fillStyle = '#8B949E';
          ctx.font = '500 20px "JetBrains Mono", monospace';
          ctx.fillText(`https://${webEmbedData.url}`, bx + 150, by + 41);

          // Web Page Content
          const contentX = bx + 90;
          const contentY = by + 140;
          ctx.fillStyle = '#58A6FF';
          ctx.font = '600 22px "JetBrains Mono", monospace';
          ctx.fillText('LIVE WEB SOURCE · REAL-TIME DOCS & TELEMETRY', contentX, contentY);

          ctx.fillStyle = '#F0F6FC';
          ctx.font = '700 48px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(webEmbedData.title, contentX, contentY + 64, bw * 0.8);

          webEmbedData.headlines.forEach((line, idx) => {
            const cardY = contentY + 115 + idx * 135;
            drawRoundedRectPath(ctx, contentX, cardY, bw * 0.62, 110, 12);
            ctx.fillStyle = '#161B22';
            ctx.fill();
            ctx.strokeStyle = '#30363D';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#F59E0B';
            ctx.font = '600 20px "JetBrains Mono", monospace';
            ctx.fillText(`0${idx + 1}`, contentX + 28, cardY + 45);

            ctx.fillStyle = '#E6EDF3';
            ctx.font = '500 26px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(line, contentX + 76, cardY + 46, bw * 0.54);

            ctx.fillStyle = '#8B949E';
            ctx.font = '400 19px "JetBrains Mono", monospace';
            ctx.fillText('Status: Verified · Ready for live demonstration', contentX + 76, cardY + 82);
          });
        } else {
          // DEFAULT: 'linux-desktop-sim' — Exact recreation of the reference screenshot's Linux Desktop + Classical Painting + "install" modal!
          if (wallpaperImgRef.current) {
            const iw = wallpaperImgRef.current.naturalWidth || 1920;
            const ih = wallpaperImgRef.current.naturalHeight || 1080;
            const scale = Math.max(bw / iw, bh / ih);
            const dw = iw * scale;
            const dh = ih * scale;
            ctx.drawImage(wallpaperImgRef.current, bx + (bw - dw) / 2, by + (bh - dh) / 2, dw, dh);
            // Subtle moody dark wash so the desktop UI & text pop just like the screenshot
            ctx.fillStyle = 'rgba(18, 22, 18, 0.22)';
            ctx.fillRect(bx, by, bw, bh);
          } else {
            const grad = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
            grad.addColorStop(0, '#1E2923');
            grad.addColorStop(1, '#0F1712');
            ctx.fillStyle = grad;
            ctx.fillRect(bx, by, bw, bh);
          }

          // Top Waybar / Hyprland Status Bar (matches reference screenshot!)
          ctx.fillStyle = 'rgba(20, 22, 20, 0.78)';
          ctx.fillRect(bx, by, bw, 42);

          // Left workspace numbers: [ ] · 2  3  4  5
          ctx.fillStyle = '#A3B19B';
          ctx.font = '500 18px "JetBrains Mono", monospace';
          ctx.fillText('▣   ●   2   3   4   5', bx + 24, by + 27);

          // Center clock: Tue · 14:10  ↻  ☼
          ctx.fillStyle = '#CBD5C0';
          ctx.textAlign = 'center';
          ctx.fillText('Tue  ·  14:10   ↻   ☼', bx + bw / 2, by + 27);

          // Right system tray icons
          ctx.textAlign = 'right';
          ctx.fillText('📷   ☁   ∗   🛜   🔊   🖥   🔋', bx + bw - 24, by + 27);
          ctx.textAlign = 'left';

          // Center "install" Launcher Modal Box (Exact match to reference screenshot!)
          const modalW = 460;
          const modalH = 330;
          const modalX = bx + (bw - modalW) / 2;
          const modalY = by + bh * 0.11;

          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
          ctx.shadowBlur = 32;
          ctx.shadowOffsetY = 12;
          ctx.fillStyle = '#222320';
          ctx.fillRect(modalX, modalY, modalW, modalH);
          ctx.restore();

          // Cream/Gold thin border around the modal
          ctx.strokeStyle = '#C8BA9E';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(modalX, modalY, modalW, modalH);

          // Input prompt line: "install"
          ctx.fillStyle = '#D8CEBE';
          ctx.font = '400 26px "JetBrains Mono", monospace';
          ctx.fillText(linuxSearchText || 'install', modalX + 34, modalY + 58);

          // Menu items: 0 = Install, 1 = Remove, 2 = Preinstalls
          const menuItems = [
            { icon: '💾', label: 'Install', sub: '', hasArrow: true },
            { icon: '✖', label: 'Remove', sub: '', hasArrow: true },
            { icon: '⊟', label: 'Preinstalls', sub: 'Remove', hasArrow: false },
          ];

          menuItems.forEach((item, idx) => {
            const rowY = modalY + 84 + idx * 74;
            const isSelected = linuxMenuSelected === idx;

            if (isSelected) {
              ctx.fillStyle = '#333631';
              ctx.fillRect(modalX + 28, rowY, modalW - 56, 62);
            }

            if (idx === 2) {
              // Subtle divider before Preinstalls
              ctx.strokeStyle = 'rgba(200, 186, 158, 0.15)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(modalX + 28, rowY - 6);
              ctx.lineTo(modalX + modalW - 28, rowY - 6);
              ctx.stroke();
            }

            ctx.fillStyle = isSelected ? '#7FA99B' : '#B8B2A6';
            ctx.font = '500 22px "JetBrains Mono", monospace';
            ctx.fillText(item.icon, modalX + 52, rowY + 39);

            ctx.fillStyle = isSelected ? '#8FBCAC' : '#C7C0B4';
            ctx.font = '500 23px "JetBrains Mono", monospace';
            ctx.fillText(item.label, modalX + 96, rowY + (item.sub ? 32 : 39));

            if (item.sub) {
              ctx.fillStyle = '#78756E';
              ctx.font = '400 16px "JetBrains Mono", monospace';
              ctx.fillText(item.sub, modalX + 96, rowY + 54);
            }

            if (item.hasArrow) {
              ctx.fillStyle = '#78756E';
              ctx.font = '400 22px "JetBrains Mono", monospace';
              ctx.fillText('›', modalX + modalW - 52, rowY + 39);
            }
          });

          if (linuxSubmenuStatus) {
            ctx.fillStyle = 'rgba(34, 35, 32, 0.92)';
            ctx.fillRect(modalX, modalY + modalH + 12, modalW, 44);
            ctx.strokeStyle = '#7FA99B';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(modalX, modalY + modalH + 12, modalW, 44);
            ctx.fillStyle = '#8FBCAC';
            ctx.font = '500 17px "JetBrains Mono", monospace';
            ctx.fillText(`> ${linuxSubmenuStatus}`, modalX + 20, modalY + modalH + 40);
          }
        }

        ctx.restore();
      };

      // Helper to draw the Presenter Camera (or Zoom/Teams tiles) into a target box
      const drawCameraTile = (
        cx: number,
        cy: number,
        cw: number,
        ch: number,
        radius: number,
        borderColor: string,
        borderWidth: number,
        isCoHost = false
      ) => {
        ctx.save();

        // Outer subtle shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
        ctx.shadowBlur = 28;
        ctx.shadowOffsetY = 8;

        drawRoundedRectPath(ctx, cx, cy, cw, ch, radius);
        ctx.fillStyle = '#111827';
        ctx.fill();
        ctx.restore();

        // Clip inside rounded rect
        ctx.save();
        drawRoundedRectPath(ctx, cx, cy, cw, ch, radius);
        ctx.clip();

        if (!isCoHost && cameraConfig.useRealWebcam && webcamVideoEl && webcamVideoEl.readyState >= 2) {
          const vw = webcamVideoEl.videoWidth || 1280;
          const vh = webcamVideoEl.videoHeight || 720;
          const scale = Math.max(cw / vw, ch / vh);
          const dw = vw * scale;
          const dh = vh * scale;

          ctx.save();
          if (cameraConfig.mirrored) {
            ctx.translate(cx + cw / 2, cy + ch / 2);
            ctx.scale(-1, 1);
            ctx.drawImage(webcamVideoEl, -dw / 2, -dh / 2, dw, dh);
          } else {
            ctx.drawImage(webcamVideoEl, cx + (cw - dw) / 2, cy + (ch - dh) / 2, dw, dh);
          }
          ctx.restore();
        } else if (!isCoHost && presenterImgRef.current) {
          const iw = presenterImgRef.current.naturalWidth || 900;
          const ih = presenterImgRef.current.naturalHeight || 1200;
          const scale = Math.max(cw / iw, ch / ih);
          const dw = iw * scale;
          const dh = ih * scale;

          ctx.save();
          if (cameraConfig.mirrored) {
            ctx.translate(cx + cw / 2, cy + ch / 2);
            ctx.scale(-1, 1);
            ctx.drawImage(presenterImgRef.current, -dw / 2, -dh / 2, dw, dh);
          } else {
            ctx.drawImage(presenterImgRef.current, cx + (cw - dw) / 2, cy + (ch - dh) / 2, dw, dh);
          }
          ctx.restore();
        } else {
          // Co-host or fallback studio portrait
          const grad = ctx.createLinearGradient(cx, cy, cx + cw, cy + ch);
          grad.addColorStop(0, '#1E293B');
          grad.addColorStop(1, '#0F172A');
          ctx.fillStyle = grad;
          ctx.fillRect(cx, cy, cw, ch);

          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.arc(cx + cw / 2, cy + ch / 2 - 16, Math.min(cw, ch) * 0.18, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#F8FAFC';
          ctx.textAlign = 'center';
          ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(isCoHost ? 'Sarah Wijaya (Co-Host)' : 'Presenter Cam', cx + cw / 2, cy + ch - 28);
          ctx.textAlign = 'left';
        }

        // Creator Watermark / Badge inside Camera Frame (like the NetworkChuck logo in the reference screenshot!)
        if (!isCoHost && cameraConfig.showBadge && cw >= 200) {
          const badgeRight = cx + cw - 18;
          const badgeBottom = cy + ch - 46;

          ctx.save();
          ctx.textAlign = 'right';
          ctx.shadowColor = 'rgba(0,0,0,0.85)';
          ctx.shadowBlur = 8;

          ctx.fillStyle = '#F8FAFC';
          ctx.font = '800 19px "JetBrains Mono", monospace';
          ctx.fillText(cameraConfig.badgeText.toUpperCase(), badgeRight, badgeBottom);

          ctx.fillStyle = '#F59E0B';
          ctx.font = '700 14px "JetBrains Mono", monospace';
          ctx.fillText(cameraConfig.badgeSubtext.toUpperCase(), badgeRight, badgeBottom + 18);
          ctx.restore();
        }

        // Dynamic audio waveform visualizer at bottom-left of camera frame
        if (!isCoHost && (micEnabled || simulateAudioPulse)) {
          const activeLevel = micEnabled ? Math.max(10, micLevel) : 52 + Math.sin(timestamp / 140) * 28;
          const barCount = 12;
          const barW = 4;
          const barGap = 3;
          const baseX = cx + 20;
          const baseY = cy + ch - 18;

          // Subtle dark pill backdrop for camera audio waveform
          drawRoundedRectPath(
            ctx,
            baseX - 8,
            baseY - 38,
            barCount * (barW + barGap) + 14,
            44,
            10
          );
          ctx.fillStyle = 'rgba(11, 15, 23, 0.72)';
          ctx.fill();

          for (let b = 0; b < barCount; b++) {
            const wavePhase =
              Math.sin(timestamp / 85 + b * 0.65) * 0.45 +
              Math.cos(timestamp / 130 - b * 0.4) * 0.35 +
              0.5;
            const normalized = Math.min(1, Math.max(0.12, (activeLevel / 100) * (0.45 + wavePhase * 0.85)));
            const barH = Math.round(normalized * 30);

            if (normalized > 0.8) {
              ctx.fillStyle = '#F43F5E'; // Peak crimson
            } else if (normalized > 0.55) {
              ctx.fillStyle = '#F59E0B'; // Mid-high amber
            } else {
              ctx.fillStyle = '#10B981'; // Nominal emerald
            }

            drawRoundedRectPath(
              ctx,
              baseX + b * (barW + barGap),
              baseY - barH,
              barW,
              barH,
              2
            );
            ctx.fill();
          }
        }

        ctx.restore();

        // Outer glowing border (like the double-toned golden border in the screenshot!)
        if (borderWidth > 0 && borderColor !== 'transparent') {
          ctx.save();
          drawRoundedRectPath(ctx, cx, cy, cw, ch, radius);
          ctx.strokeStyle = borderColor;
          ctx.lineWidth = borderWidth;
          ctx.stroke();

          // Inner subtle white highlight stroke just like the screenshot's camera frame
          drawRoundedRectPath(ctx, cx + borderWidth / 2, cy + borderWidth / 2, cw - borderWidth, ch - borderWidth, Math.max(0, radius - borderWidth / 2));
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
      };

      // 1. RENDER LAYOUT PRESET
      if (layoutPreset === 'screen-only') {
        drawMainBackgroundSource(0, 0, W, H);
      } else if (layoutPreset === 'camera-solo') {
        drawCameraTile(0, 0, W, H, 0, 'transparent', 0);
      } else if (layoutPreset === 'side-by-side-50') {
        // 50/50 Split Stage
        ctx.fillStyle = '#070A0F';
        ctx.fillRect(0, 0, W, H);
        drawMainBackgroundSource(28, 28, W * 0.5 - 42, H - 56);
        drawCameraTile(
          W * 0.5 + 14,
          28,
          W * 0.5 - 42,
          H - 56,
          28,
          cameraConfig.borderColor,
          cameraConfig.borderWidth
        );
      } else if (layoutPreset === 'zoom-split-stage') {
        // Zoom / Teams Webinar Split Mode: 72% Main Stage on Left + Presenter & Co-Host Stack on Right
        ctx.fillStyle = '#080C14';
        ctx.fillRect(0, 0, W, H);

        const stageW = W * 0.71;
        drawRoundedRectPath(ctx, 24, 24, stageW, H - 48, 20);
        ctx.save();
        ctx.clip();
        drawMainBackgroundSource(24, 24, stageW, H - 48);
        ctx.restore();

        const rightX = stageW + 48;
        const rightW = W - rightX - 24;

        if (cameraConfig.showCoHost) {
          const tileH = (H - 72) / 2;
          drawCameraTile(
            rightX,
            24,
            rightW,
            tileH,
            24,
            cameraConfig.borderColor,
            cameraConfig.borderWidth,
            false
          );
          drawCameraTile(
            rightX,
            48 + tileH,
            rightW,
            tileH,
            24,
            '#334155',
            4,
            true
          );
        } else {
          drawCameraTile(
            rightX,
            24,
            rightW,
            H - 48,
            28,
            cameraConfig.borderColor,
            cameraConfig.borderWidth,
            false
          );
        }
      } else {
        // Picture-in-Picture Modes ('pip-vertical-capsule' or 'pip-circle-bubble')
        drawMainBackgroundSource(0, 0, W, H);

        if (cameraConfig.enabled) {
          const camW = (cameraConfig.width / 100) * W;
          let camH = camW * (4 / 3);
          if (cameraConfig.aspectRatio === '1:1' || cameraConfig.shape === 'circle') {
            camH = camW;
          } else if (cameraConfig.aspectRatio === '16:9') {
            camH = camW * (9 / 16);
          }

          const camX = (cameraConfig.x / 100) * W - camW / 2;
          const camY = (cameraConfig.y / 100) * H - camH / 2;

          let radius = 48;
          if (cameraConfig.shape === 'circle') radius = camW / 2;
          else if (cameraConfig.shape === 'capsule') radius = 56;
          else if (cameraConfig.shape === 'rounded') radius = 24;
          else if (cameraConfig.shape === 'sharp') radius = 6;

          drawCameraTile(
            camX,
            camY,
            camW,
            camH,
            radius,
            cameraConfig.borderColor,
            cameraConfig.borderWidth
          );
        }
      }

      // 2. RENDER FLOATING DYNAMIC OVERLAYS (Lower-thirds, File/Code cards, Web Widgets, Chat Spotlights)
      overlays
        .filter((item) => item.visible)
        .forEach((item) => {
          const ow = (item.width / 100) * W;
          const ox = (item.x / 100) * W - ow / 2;
          const oy = (item.y / 100) * H;

          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
          ctx.shadowBlur = 24;
          ctx.shadowOffsetY = 8;

          if (item.type === 'lower-third') {
            const oh = 96;
            drawRoundedRectPath(ctx, ox, oy - oh / 2, ow, oh, 14);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Left accent bar
            drawRoundedRectPath(ctx, ox + 12, oy - oh / 2 + 14, 6, oh - 28, 3);
            ctx.fillStyle = '#F59E0B';
            ctx.fill();

            ctx.fillStyle = '#F8FAFC';
            ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(item.title, ox + 34, oy - 6, ow - 48);

            ctx.fillStyle = '#94A3B8';
            ctx.font = '500 19px "JetBrains Mono", monospace';
            ctx.fillText(item.subtitle, ox + 34, oy + 26, ow - 48);
          } else if (item.type === 'file-card' || item.type === 'web-widget') {
            const oh = 210;
            drawRoundedRectPath(ctx, ox, oy - oh / 2, ow, oh, 16);
            ctx.fillStyle = 'rgba(17, 24, 39, 0.94)';
            ctx.fill();
            ctx.strokeStyle = item.type === 'file-card' ? '#38BDF8' : '#10B981';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Header bar
            ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
            drawRoundedRectPath(ctx, ox + 2, oy - oh / 2 + 2, ow - 4, 44, 14);
            ctx.fill();

            ctx.fillStyle = item.type === 'file-card' ? '#38BDF8' : '#10B981';
            ctx.font = '600 16px "JetBrains Mono", monospace';
            ctx.fillText(
              item.type === 'file-card' ? 'PINNED FILE / TERMINAL' : 'LIVE WEB WIDGET',
              ox + 20,
              oy - oh / 2 + 30
            );

            ctx.fillStyle = '#F8FAFC';
            ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(item.title, ox + 22, oy - oh / 2 + 84, ow - 44);

            ctx.fillStyle = '#CBD5E1';
            ctx.font = '400 20px "JetBrains Mono", monospace';
            const lines = (item.codeSnippet || item.subtitle).split('\n');
            lines.slice(0, 3).forEach((l, i) => {
              ctx.fillText(l, ox + 22, oy - oh / 2 + 124 + i * 30, ow - 44);
            });
          } else if (item.type === 'chat-spotlight') {
            const oh = 116;
            drawRoundedRectPath(ctx, ox, oy - oh / 2, ow, oh, 18);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
            ctx.fill();
            ctx.strokeStyle = '#F43F5E';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.fillStyle = '#FDA4AF';
            ctx.font = '600 17px "JetBrains Mono", monospace';
            ctx.fillText(`KOMENTAR PENONTON · ${item.title.toUpperCase()}`, ox + 26, oy - oh / 2 + 36);

            ctx.fillStyle = '#F8FAFC';
            ctx.font = '600 25px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(`"${item.subtitle}"`, ox + 26, oy - oh / 2 + 78, ow - 52);
          }

          ctx.restore();
        });

      // 3. RENDER LIVE SUBTITLE / CAPTION OVERLAY (Exact match to "Ketik install dan" at bottom of reference screenshot!)
      if (subtitleConfig.enabled && subtitleConfig.text.trim().length > 0) {
        ctx.save();
        const fontPx =
          subtitleConfig.fontSize === 'lg' ? 44 : subtitleConfig.fontSize === 'md' ? 36 : 28;
        ctx.font = `500 ${fontPx}px "Plus Jakarta Sans", sans-serif`;
        const textMetrics = ctx.measureText(subtitleConfig.text);
        const boxW = Math.min(W * 0.72, textMetrics.width + 52);
        const boxH = fontPx + 28;
        // Slightly left-of-center when PiP camera is on the right, just like the screenshot!
        const centerX =
          layoutPreset === 'pip-vertical-capsule' && cameraConfig.enabled && cameraConfig.x > 60
            ? W * 0.34
            : W * 0.5;
        const boxX = centerX - boxW / 2;
        const boxY = (subtitleConfig.positionY / 100) * H - boxH / 2;

        ctx.fillStyle = 'rgba(18, 18, 16, 0.78)';
        drawRoundedRectPath(ctx, boxX, boxY, boxW, boxH, 6);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(subtitleConfig.text, centerX, boxY + boxH / 2 + 2, boxW - 32);
        ctx.restore();
      }

      // 4. RENDER DYNAMIC ON-STAGE AUDIO WAVEFORM VISUALIZER HUD (Bottom-left of broadcast canvas)
      const currentAudioLevel = micEnabled
        ? micLevel
        : simulateAudioPulse
          ? Math.round(48 + Math.sin(timestamp / 120) * 28 + Math.cos(timestamp / 75) * 14)
          : 0;

      // Update rolling waveform history for smooth oscilloscope & bar rendering
      const history = waveformHistoryRef.current;
      if (timestamp % 2 < 1.5) {
        const jitter =
          currentAudioLevel > 0
            ? Math.sin(timestamp / 60) * 12 + Math.cos(timestamp / 95) * 8
            : 0;
        const nextSample = Math.max(4, Math.min(100, currentAudioLevel + jitter));
        history.push(nextSample);
        if (history.length > 32) history.shift();
      }

      if (showStageWaveform && (micEnabled || simulateAudioPulse)) {
        ctx.save();
        const hudX = 36;
        const hudY = H - 108;
        const hudW = 310;
        const hudH = 68;

        drawRoundedRectPath(ctx, hudX, hudY, hudW, hudH, 14);
        ctx.fillStyle = 'rgba(11, 15, 23, 0.82)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Mic status dot + dB readout
        ctx.fillStyle = currentAudioLevel > 75 ? '#F43F5E' : '#10B981';
        ctx.beginPath();
        ctx.arc(hudX + 20, hudY + 22, 5, 0, Math.PI * 2);
        ctx.fill();

        const dbVal =
          currentAudioLevel > 1
            ? (-48 + (currentAudioLevel / 100) * 46).toFixed(1)
            : '-∞';
        ctx.fillStyle = '#94A3B8';
        ctx.font = '600 13px "JetBrains Mono", monospace';
        ctx.fillText(`AUDIO WAVEFORM · ${dbVal} dB`, hudX + 34, hudY + 26);

        // Multi-band symmetrical waveform bars
        const numStageBars = 28;
        const sBarW = 6;
        const sBarGap = 3.5;
        const startBarX = hudX + 20;
        const centerLineY = hudY + 48;

        for (let i = 0; i < numStageBars; i++) {
          const histVal = history[i % history.length] || 6;
          const harmonic =
            Math.abs(Math.sin(timestamp / 90 + i * 0.45)) * 0.65 + 0.35;
          const amp = Math.max(3, Math.min(26, (histVal / 100) * harmonic * 28));

          if (amp > 20) {
            ctx.fillStyle = '#F43F5E';
          } else if (amp > 13) {
            ctx.fillStyle = '#F59E0B';
          } else {
            ctx.fillStyle = '#10B981';
          }

          drawRoundedRectPath(
            ctx,
            startBarX + i * (sBarW + sBarGap),
            centerLineY - amp / 2,
            sBarW,
            amp,
            2.5
          );
          ctx.fill();
        }

        ctx.restore();
      }

      // 5. RENDER DEDICATED DOCK AUDIO WAVEFORM VISUALIZER CANVAS
      const dockCanvas = dockWaveformCanvasRef.current;
      if (dockCanvas) {
        const dCtx = dockCanvas.getContext('2d');
        if (dCtx) {
          const dW = dockCanvas.width;
          const dH = dockCanvas.height;
          dCtx.clearRect(0, 0, dW, dH);

          // Center baseline
          dCtx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
          dCtx.lineWidth = 1;
          dCtx.beginPath();
          dCtx.moveTo(0, dH / 2);
          dCtx.lineTo(dW, dH / 2);
          dCtx.stroke();

          const barCount = 24;
          const step = dW / barCount;
          const barW = Math.max(2.5, step - 2.5);

          // Draw vertical frequency bars
          for (let i = 0; i < barCount; i++) {
            const sample = history[i % history.length] || 4;
            const env = Math.sin((i / barCount) * Math.PI); // Taper edges cleanly
            const waveMod =
              currentAudioLevel > 0
                ? Math.abs(Math.sin(timestamp / 75 + i * 0.55)) * 0.6 + 0.4
                : 0.12;
            const norm = Math.min(1, (sample / 100) * waveMod * (0.4 + env * 0.6));
            const h = Math.max(3, norm * (dH - 6));

            if (norm > 0.78) {
              dCtx.fillStyle = '#F43F5E';
            } else if (norm > 0.48) {
              dCtx.fillStyle = '#F59E0B';
            } else if (micEnabled || simulateAudioPulse) {
              dCtx.fillStyle = '#10B981';
            } else {
              dCtx.fillStyle = '#334155';
            }

            const bx = i * step + 1;
            const by = (dH - h) / 2;
            drawRoundedRectPath(dCtx, bx, by, barW, h, 1.5);
            dCtx.fill();
          }

          // Overlay smooth oscilloscope wave line when audio is active
          if (currentAudioLevel > 2) {
            dCtx.save();
            dCtx.beginPath();
            dCtx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
            dCtx.lineWidth = 1.5;
            for (let x = 0; x <= dW; x += 4) {
              const phase = (x / dW) * Math.PI * 4 + timestamp / 65;
              const amp = (currentAudioLevel / 100) * (dH * 0.36);
              const y = dH / 2 + Math.sin(phase) * amp * Math.sin((x / dW) * Math.PI);
              if (x === 0) dCtx.moveTo(x, y);
              else dCtx.lineTo(x, y);
            }
            dCtx.stroke();
            dCtx.restore();
          }
        }
      }

      animationFrameId = requestAnimationFrame(renderFrame);
    };

    animationFrameId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    canvasRef,
    layoutPreset,
    stageSource,
    cameraConfig,
    subtitleConfig,
    overlays,
    screenVideoEl,
    webcamVideoEl,
    uploadedVideoEl,
    uploadedImageEl,
    micEnabled,
    micLevel,
    showStageWaveform,
    simulateAudioPulse,
    linuxMenuSelected,
    linuxSearchText,
    linuxSubmenuStatus,
    slideIndex,
    webEmbedData,
  ]);

  // Compute interactive DOM bounding box for the Camera PiP so user gets crisp drag/resize handles
  const showDomCameraHandle =
    cameraConfig.enabled &&
    (layoutPreset === 'pip-vertical-capsule' || layoutPreset === 'pip-circle-bubble');

  const camHeightPct =
    cameraConfig.aspectRatio === '1:1' || cameraConfig.shape === 'circle'
      ? cameraConfig.width * (16 / 9)
      : cameraConfig.aspectRatio === '16:9'
        ? cameraConfig.width
        : cameraConfig.width * (4 / 3) * (16 / 9);

  return (
    <div className="flex flex-col h-full select-none">
      {/* Stage Top Status Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0F1522] border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isStreaming
                  ? 'bg-rose-500 animate-pulse'
                  : isRecording
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-emerald-500'
              }`}
            />
            <span className="font-semibold text-slate-200 tracking-tight">
              {isStreaming
                ? 'ON AIR · LIVE STREAMING'
                : isRecording
                  ? 'MEREKAM LAYAR & STUDIO'
                  : 'PRATINJAU PANGGUNG LANGSUNG'}
            </span>
          </div>
          <span className="text-slate-600">·</span>
          <span className="font-mono tabular-nums text-slate-400">1920×1080 · 60 FPS</span>
          {(isRecording || isStreaming) && (
            <>
              <span className="text-slate-600">·</span>
              <span className="font-mono tabular-nums font-semibold text-amber-400">
                {formatTime(recordingSeconds)}
              </span>
            </>
          )}
        </div>

        {/* Quick Stage Source & Interactive Hints */}
        <div className="flex items-center gap-3">
          {stageSource === 'linux-desktop-sim' && (
            <div className="hidden xl:flex items-center gap-1.5 text-slate-400">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>Menu Desktop Interaktif:</span>
              {(['Install', 'Remove', 'Preinstalls'] as const).map((label, idx) => (
                <button
                  key={label}
                  onClick={() => {
                    setLinuxMenuSelected(idx);
                    setLinuxSubmenuStatus(
                      idx === 0
                        ? 'Menyiapkan repositori paket Omarchy...'
                        : idx === 1
                          ? 'Memilih paket untuk dihapus...'
                          : 'Membuka daftar Preinstalls sistem...'
                    );
                  }}
                  className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                    linuxMenuSelected === idx
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {stageSource === 'slide-deck' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  onChangeSlide((slideIndex - 1 + SLIDE_DECK_PAGES.length) % SLIDE_DECK_PAGES.length)
                }
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                title="Slide Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono tabular-nums text-slate-300 px-1.5">
                Slide {slideIndex + 1}/{SLIDE_DECK_PAGES.length}
              </span>
              <button
                onClick={() => onChangeSlide((slideIndex + 1) % SLIDE_DECK_PAGES.length)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                title="Slide Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <span className="text-slate-500 hidden md:inline">
            Geser langsung kamera atau elemen di layar untuk mengubah tata letak
          </span>

          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors whitespace-nowrap"
            title={theme === 'dark' ? 'Ubah ke Mode Terang (Light)' : 'Ubah ke Mode Gelap (Dark)'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main 16:9 Canvas Stage Viewport */}
      <div
        ref={containerRef}
        onClick={() => onSelectElement(null)}
        className="relative flex-1 bg-[#07090E] flex items-center justify-center p-4 lg:p-6 overflow-hidden"
      >
        <div className="relative w-full max-w-[1280px] aspect-video rounded-xl overflow-hidden shadow-2xl border border-slate-800/90 bg-black">
          {/* The Real 1920x1080 Composite Canvas */}
          <canvas
            ref={canvasRef}
            width={1920}
            height={1080}
            className="w-full h-full block"
          />

          {/* Interactive Drag & Resize Overlay Handle for Camera PiP */}
          {showDomCameraHandle && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement('camera');
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                onSelectElement('camera');
                const { px, py } = getCanvasPercentCoords(e.clientX, e.clientY);
                setDragState({
                  targetType: 'camera',
                  targetId: 'camera',
                  startX: px,
                  startY: py,
                  initialX: cameraConfig.x,
                  initialY: cameraConfig.y,
                  initialWidth: cameraConfig.width,
                });
              }}
              style={{
                left: `${cameraConfig.x - cameraConfig.width / 2}%`,
                top: `${cameraConfig.y - camHeightPct / 2}%`,
                width: `${cameraConfig.width}%`,
                height: `${camHeightPct}%`,
              }}
              className={`group absolute cursor-grab active:cursor-grabbing transition-shadow ${
                selectedElementId === 'camera'
                  ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black/50 rounded-3xl'
                  : 'hover:ring-2 hover:ring-amber-400/60 rounded-3xl'
              }`}
              title="Geser untuk memindahkan posisi kamera depan"
            >
              {/* Top Floating Pill Handle on Hover/Selection */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/95 border border-slate-700 text-[11px] font-medium text-slate-200 whitespace-nowrap shadow-lg pointer-events-none">
                <Move className="w-3 h-3 text-amber-400" />
                <span>Kamera Depan ({Math.round(cameraConfig.x)}%, {Math.round(cameraConfig.y)}%)</span>
              </div>

              {/* Bottom-Right Resize Handle */}
              <div
                onPointerDown={(e) => {
                  e.stopPropagation();
                  const { px, py } = getCanvasPercentCoords(e.clientX, e.clientY);
                  setDragState({
                    targetType: 'camera-resize',
                    targetId: 'camera',
                    startX: px,
                    startY: py,
                    initialX: cameraConfig.x,
                    initialY: cameraConfig.y,
                    initialWidth: cameraConfig.width,
                  });
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md cursor-nwse-resize"
                title="Tarik untuk mengubah ukuran kamera"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </div>
            </div>
          )}

          {/* Interactive Drag Handles for Visible Floating Overlays */}
          {overlays
            .filter((item) => item.visible)
            .map((item) => {
              const heightPct = item.type === 'lower-third' ? 9 : item.type === 'chat-spotlight' ? 11 : 19.5;
              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement(item.id);
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onSelectElement(item.id);
                    const { px, py } = getCanvasPercentCoords(e.clientX, e.clientY);
                    setDragState({
                      targetType: 'overlay',
                      targetId: item.id,
                      startX: px,
                      startY: py,
                      initialX: item.x,
                      initialY: item.y,
                      initialWidth: item.width,
                    });
                  }}
                  style={{
                    left: `${item.x - item.width / 2}%`,
                    top: `${item.y - heightPct / 2}%`,
                    width: `${item.width}%`,
                    height: `${heightPct}%`,
                  }}
                  className={`group absolute cursor-grab active:cursor-grabbing rounded-xl transition-shadow ${
                    selectedElementId === item.id
                      ? 'ring-2 ring-sky-400'
                      : 'hover:ring-2 hover:ring-sky-400/60'
                  }`}
                >
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/95 border border-slate-700 text-[10px] font-mono text-sky-300 whitespace-nowrap pointer-events-none">
                    <Move className="w-3 h-3" />
                    <span>Geser Layer: {item.title}</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Bottom Quick Broadcast Dock (Zoom / Teams / OBS Hybrid Control Bar) */}
      <div className="px-4 py-3 bg-[#0F1522] border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Audio & Camera Hardware Quick Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={onStartRealScreenShare}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              stageSource === 'screen-live' && screenVideoEl
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Monitor className="w-4 h-4 text-amber-400" />
            <span>
              {stageSource === 'screen-live' && screenVideoEl
                ? 'Layar Aktif (Ganti Layar)'
                : 'Bagikan Layar Asli (Screen Share)'}
            </span>
          </button>

          <button
            onClick={onToggleRealWebcam}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              cameraConfig.useRealWebcam && webcamVideoEl
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Camera className="w-4 h-4 text-sky-400" />
            <span>
              {cameraConfig.useRealWebcam && webcamVideoEl
                ? 'Kamera Asli Aktif'
                : 'Gunakan Kamera Depan (Webcam)'}
            </span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-900/95 p-1 rounded-lg border border-slate-800">
            <button
              onClick={onToggleMic}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap border ${
                micEnabled
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/25'
                  : 'bg-rose-950/60 border-rose-800/70 text-rose-300 hover:bg-rose-900/50'
              }`}
            >
              {micEnabled ? (
                <Mic className="w-4 h-4 text-emerald-400" />
              ) : (
                <MicOff className="w-4 h-4 text-rose-400" />
              )}
              <span>{micEnabled ? 'Mikrofon Aktif' : 'Mikrofon Bisu'}</span>
            </button>

            {/* Dynamic Live Audio Waveform Visualizer & dB Telemetry */}
            <div className="flex items-center gap-2.5 px-2.5 py-1 rounded-md bg-[#090D16] border border-slate-800/90">
              <canvas
                ref={dockWaveformCanvasRef}
                width={136}
                height={26}
                className="w-[136px] h-[26px] block"
                title="Visualisasi Gelombang Suara Real-Time (Audio Waveform)"
              />
              <div className="flex flex-col items-end min-w-[48px]">
                <span
                  className={`text-[10px] font-mono tabular-nums font-semibold leading-none ${
                    effectiveMicLevel > 78
                      ? 'text-rose-400'
                      : effectiveMicLevel > 45
                        ? 'text-amber-400'
                        : micEnabled || simulateAudioPulse
                          ? 'text-emerald-400'
                          : 'text-slate-500'
                  }`}
                >
                  {effectiveMicLevel > 0
                    ? `${(-48 + (effectiveMicLevel / 100) * 46).toFixed(1)} dB`
                    : '-∞ dB'}
                </span>
                <span className="text-[9px] font-mono tabular-nums text-slate-500 mt-0.5">
                  LVL {Math.round(effectiveMicLevel)}%
                </span>
              </div>
            </div>

            {!micEnabled && (
              <button
                onClick={() => setSimulateAudioPulse((prev) => !prev)}
                className={`px-2 py-1.5 rounded-md text-[11px] font-mono transition-colors whitespace-nowrap ${
                  simulateAudioPulse
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="Uji animasi gelombang audio tanpa mikrofon"
              >
                {simulateAudioPulse ? 'Tes Sinyal: ON' : 'Tes Gelombang'}
              </button>
            )}

            <button
              onClick={() => setShowStageWaveform((prev) => !prev)}
              className={`px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                showStageWaveform
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Tampilkan atau sembunyikan HUD gelombang audio di kanvas siaran"
            >
              HUD Gelombang
            </button>
          </div>
        </div>

        {/* Center: Instant Camera Position Snaps (Dynamic PiP Control) */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-400 px-2 font-medium hidden sm:inline">
            Posisi Wajah:
          </span>
          {[
            { label: 'Kanan Bawah', x: 85, y: 71 },
            { label: 'Kiri Bawah', x: 15, y: 71 },
            { label: 'Kanan Atas', x: 85, y: 28 },
            { label: 'Kiri Atas', x: 15, y: 28 },
          ].map((pos) => {
            const isCurrent =
              Math.abs(cameraConfig.x - pos.x) < 6 && Math.abs(cameraConfig.y - pos.y) < 6;
            return (
              <button
                key={pos.label}
                onClick={() => onUpdateCamera({ enabled: true, x: pos.x, y: pos.y })}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                  isCurrent
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {pos.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

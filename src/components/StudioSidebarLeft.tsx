import React, { useEffect, useRef, useState } from 'react';
import {
  CameraConfig,
  LayoutPresetId,
  LayoutSnapshotPreset,
  StageSourceType,
} from '../types/studio';
import {
  Layout,
  Monitor,
  Terminal,
  FileVideo,
  Presentation,
  Globe,
  Camera,
  Upload,
  Users,
  FlipHorizontal,
  Award,
  BookmarkPlus,
  BookmarkCheck,
  Trash2,
  RotateCcw,
  Mic,
  MicOff,
  Activity,
  Keyboard,
} from 'lucide-react';

interface StudioSidebarLeftProps {
  layoutPreset: LayoutPresetId;
  onSelectLayout: (preset: LayoutPresetId) => void;
  stageSource: StageSourceType;
  onSelectSource: (source: StageSourceType) => void;
  onStartRealScreenShare: () => void;
  onUploadMediaFile: (file: File) => void;
  uploadedFileName: string | null;
  cameraConfig: CameraConfig;
  onUpdateCamera: (patch: Partial<CameraConfig>) => void;
  webEmbedData: {
    url: string;
    title: string;
    headlines: string[];
  };
  onUpdateWebEmbed: (patch: Partial<{ url: string; title: string; headlines: string[] }>) => void;
  savedSnapshots: LayoutSnapshotPreset[];
  activeSnapshotId: string | null;
  onSaveSnapshot: (customName?: string) => void;
  onApplySnapshot: (snapshot: LayoutSnapshotPreset) => void;
  onOverwriteSnapshot: (id: string) => void;
  onDeleteSnapshot: (id: string) => void;
  widthPx: number;
  onUploadCameraAvatar: (file: File) => void;
  customCameraAvatarName: string | null;
  onResetCameraAvatar: () => void;
  micEnabled: boolean;
  micLevel: number;
  onToggleMic: () => void;
  onOpenShortcutsModal: () => void;
}

const LAYOUT_PRESETS: {
  id: LayoutPresetId;
  label: string;
  desc: string;
}[] = [
  {
    id: 'pip-vertical-capsule',
    label: 'PiP Kapsul',
    desc: 'Wajah vertikal di pojok kanan bawah',
  },
  {
    id: 'pip-circle-bubble',
    label: 'PiP Lingkaran',
    desc: 'Kamera bulat melayang ala Loom',
  },
  {
    id: 'zoom-split-stage',
    label: 'Zoom / Teams',
    desc: 'Layar 70% + Panel Wajah di kanan',
  },
  {
    id: 'side-by-side-50',
    label: 'Split 50 : 50',
    desc: 'Layar & kamera berdampingan',
  },
  {
    id: 'screen-only',
    label: 'Layar Penuh',
    desc: 'Fokus 100% pada konten layar',
  },
  {
    id: 'camera-solo',
    label: 'Kamera Penuh',
    desc: 'Wajah presenter layar penuh',
  },
];

export const StudioSidebarLeft: React.FC<StudioSidebarLeftProps> = ({
  layoutPreset,
  onSelectLayout,
  stageSource,
  onSelectSource,
  onStartRealScreenShare,
  onUploadMediaFile,
  uploadedFileName,
  cameraConfig,
  onUpdateCamera,
  webEmbedData,
  onUpdateWebEmbed,
  savedSnapshots,
  activeSnapshotId,
  onSaveSnapshot,
  onApplySnapshot,
  onOverwriteSnapshot,
  onDeleteSnapshot,
  widthPx,
  onUploadCameraAvatar,
  customCameraAvatarName,
  onResetCameraAvatar,
  micEnabled,
  micLevel,
  onToggleMic,
  onOpenShortcutsModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const camAvatarInputRef = useRef<HTMLInputElement | null>(null);
  const [snapshotNameInput, setSnapshotNameInput] = useState<string>('');
  const [showNamePrompt, setShowNamePrompt] = useState<boolean>(false);

  // Sidebar Real-Time Audio Waveform Visualizer State & Ref
  const sidebarWaveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveHistoryRef = useRef<number[]>(Array(36).fill(4));
  const [testMicWave, setTestMicWave] = useState<boolean>(false);
  const [peakMicLevel, setPeakMicLevel] = useState<number>(0);

  const effectiveSidebarLevel = micEnabled
    ? micLevel
    : testMicWave
      ? 58
      : 0;

  useEffect(() => {
    if (effectiveSidebarLevel > peakMicLevel) {
      setPeakMicLevel(effectiveSidebarLevel);
    } else {
      const timer = setTimeout(() => {
        setPeakMicLevel((prev) => Math.max(effectiveSidebarLevel, Math.round(prev * 0.92)));
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [effectiveSidebarLevel, peakMicLevel]);

  // 60 FPS Sidebar Audio Waveform Canvas Renderer
  useEffect(() => {
    let animId: number;

    const renderSidebarWave = (timestamp: number) => {
      const canvas = sidebarWaveCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const W = canvas.width;
          const H = canvas.height;
          ctx.clearRect(0, 0, W, H);

          const liveLvl = micEnabled
            ? micLevel
            : testMicWave
              ? Math.round(52 + Math.sin(timestamp / 110) * 26 + Math.cos(timestamp / 70) * 14)
              : 0;

          const hist = waveHistoryRef.current;
          if (timestamp % 2 < 1.5) {
            const mod =
              liveLvl > 0
                ? Math.sin(timestamp / 55) * 14 + Math.cos(timestamp / 90) * 9
                : 0;
            hist.push(Math.max(4, Math.min(100, liveLvl + mod)));
            if (hist.length > 36) hist.shift();
          }

          // Background grid lines
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
          ctx.lineWidth = 1;
          [0.25, 0.5, 0.75].forEach((ratio) => {
            ctx.beginPath();
            ctx.moveTo(0, H * ratio);
            ctx.lineTo(W, H * ratio);
            ctx.stroke();
          });

          // Multi-band frequency bars
          const barCount = 32;
          const step = W / barCount;
          const barW = Math.max(3, step - 3);

          for (let i = 0; i < barCount; i++) {
            const val = hist[i % hist.length] || 4;
            const env = Math.sin((i / barCount) * Math.PI);
            const harmonic =
              liveLvl > 0
                ? Math.abs(Math.sin(timestamp / 80 + i * 0.48)) * 0.65 + 0.35
                : 0.08;
            const norm = Math.min(1, (val / 100) * harmonic * (0.35 + env * 0.65));
            const bh = Math.max(4, norm * (H - 10));

            if (norm > 0.78) {
              ctx.fillStyle = '#F43F5E'; // Clip / Peak
            } else if (norm > 0.48) {
              ctx.fillStyle = '#F59E0B'; // Nominal High
            } else if (micEnabled || testMicWave) {
              ctx.fillStyle = '#10B981'; // Clean Signal
            } else {
              ctx.fillStyle = '#334155'; // Muted Idle
            }

            const bx = i * step + 1.5;
            const by = (H - bh) / 2;
            ctx.beginPath();
            ctx.roundRect(bx, by, barW, bh, 2);
            ctx.fill();
          }

          // Smooth oscilloscope sine wave overlay when active
          if (liveLvl > 2) {
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
            ctx.lineWidth = 1.75;
            for (let x = 0; x <= W; x += 4) {
              const phase = (x / W) * Math.PI * 5 + timestamp / 60;
              const amp = (liveLvl / 100) * (H * 0.38);
              const y = H / 2 + Math.sin(phase) * amp * Math.sin((x / W) * Math.PI);
              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.restore();
          }
        }
      }
      animId = requestAnimationFrame(renderSidebarWave);
    };

    animId = requestAnimationFrame(renderSidebarWave);
    return () => cancelAnimationFrame(animId);
  }, [micEnabled, micLevel, testMicWave]);

  const handleLayoutClick = (preset: LayoutPresetId) => {
    onSelectLayout(preset);
    if (preset === 'pip-vertical-capsule') {
      onUpdateCamera({
        enabled: true,
        shape: 'capsule',
        aspectRatio: '3:4',
        width: 16,
        x: 88,
        y: 69,
      });
    } else if (preset === 'pip-circle-bubble') {
      onUpdateCamera({
        enabled: true,
        shape: 'circle',
        aspectRatio: '1:1',
        width: 15,
        x: 13,
        y: 75,
      });
    } else if (preset === 'zoom-split-stage' || preset === 'side-by-side-50' || preset === 'camera-solo') {
      onUpdateCamera({ enabled: true });
    }
  };

  const handleQuickSaveSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSnapshot(snapshotNameInput.trim() || undefined);
    setSnapshotNameInput('');
    setShowNamePrompt(false);
  };

  return (
    <aside
      style={{ width: `${widthPx}px` }}
      className="w-full lg:w-auto shrink-0 bg-[#0F1522] border-r border-slate-800/80 flex flex-col h-full overflow-y-auto"
    >
      {/* 1. TATA LETAK PANGGUNG (DYNAMIC SCENE LAYOUTS) */}
      <div className="p-4 border-b border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
            <Layout className="w-4 h-4 text-amber-400" />
            <span>01. Tata Letak Siaran (Live Layout)</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-400">Real-Time</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {LAYOUT_PRESETS.map((item) => {
            const active = layoutPreset === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleLayoutClick(item.id)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  active
                    ? 'bg-amber-500/15 border-amber-500/60 text-slate-100'
                    : 'bg-slate-900/70 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <div className="text-xs font-semibold whitespace-nowrap truncate">
                  {item.label}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                  {item.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* SAVE LAYOUT SNAPSHOT ACTION & PERSISTENT USER PRESETS */}
        <div className="pt-2.5 border-t border-slate-800/80 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSaveSnapshot()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shadow-sm"
            >
              <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
              <span>Save Layout Snapshot</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNamePrompt((prev) => !prev)}
              className={`px-2.5 py-2 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                showNamePrompt
                  ? 'bg-slate-800 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
              title="Simpan dengan nama preset khusus"
            >
              + Nama
            </button>
          </div>

          {showNamePrompt && (
            <form onSubmit={handleQuickSaveSnapshot} className="flex items-center gap-1.5">
              <input
                type="text"
                value={snapshotNameInput}
                onChange={(e) => setSnapshotNameInput(e.target.value)}
                placeholder="Nama preset (mis: Tutorial Kanan)"
                className="flex-1 px-2.5 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 rounded-md bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold whitespace-nowrap"
              >
                Simpan
              </button>
            </form>
          )}

          {/* Persistent User Snapshot List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Preset Snapshot Tersimpan</span>
              <span className="font-mono tabular-nums">{savedSnapshots.length} Preset</span>
            </div>

            {savedSnapshots.length === 0 ? (
              <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-400 text-center">
                Belum ada snapshot tersimpan. Klik <strong>Save Layout Snapshot</strong> untuk menyimpan posisi kamera & layer saat ini.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
                {savedSnapshots.map((snap) => {
                  const isCurrent = activeSnapshotId === snap.id;
                  const visibleLayersCount = snap.overlays.filter((o) => o.visible).length;
                  return (
                    <div
                      key={snap.id}
                      className={`group flex items-center justify-between gap-2 p-2 rounded-lg border transition-all ${
                        isCurrent
                          ? 'bg-amber-500/15 border-amber-500/60'
                          : 'bg-slate-900/75 border-slate-800/90 hover:border-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onApplySnapshot(snap)}
                        className="flex-1 min-w-0 text-left"
                        title="Klik untuk menerapkan posisi kamera, layer, dan visibilitas snapshot ini"
                      >
                        <div className="flex items-center gap-1.5">
                          <BookmarkCheck
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isCurrent ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'
                            }`}
                          />
                          <span className="text-xs font-semibold text-slate-100 truncate">
                            {snap.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono tabular-nums text-slate-400 mt-0.5 pl-5 truncate">
                          <span>
                            {snap.cameraConfig.enabled
                              ? `Cam (${Math.round(snap.cameraConfig.x)}%,${Math.round(snap.cameraConfig.y)}%)`
                              : 'Cam Off'}
                          </span>
                          <span>·</span>
                          <span>{visibleLayersCount} Layer Aktif</span>
                          <span>·</span>
                          <span>{snap.createdAt}</span>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOverwriteSnapshot(snap.id)}
                          className="p-1.5 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition-colors"
                          title="Perbarui snapshot ini dengan posisi panggung saat ini"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSnapshot(snap.id)}
                          className="p-1.5 rounded bg-slate-800/90 hover:bg-rose-950/90 text-slate-400 hover:text-rose-300 transition-colors"
                          title="Hapus snapshot preset"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. SUMBER MEDIA & LAYAR UTAMA (STAGE SOURCES) */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-sky-400" />
            <span>02. Sumber Layar, File & Web</span>
          </h2>
        </div>

        <div className="space-y-1.5">
          {/* Desktop Linux Sim (Default screenshot scene) */}
          <button
            onClick={() => onSelectSource('linux-desktop-sim')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs transition-colors ${
              stageSource === 'linux-desktop-sim'
                ? 'bg-sky-500/15 border-sky-500/50 text-slate-100 font-medium'
                : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Terminal className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">Layar Demo: Linux Installer</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 shrink-0">Interaktif</span>
          </button>

          {/* Real Screen Capture */}
          <button
            onClick={onStartRealScreenShare}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs transition-colors ${
              stageSource === 'screen-live'
                ? 'bg-emerald-500/15 border-emerald-500/50 text-slate-100 font-medium'
                : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Monitor className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">Tangkap Layar Asli (Screen Share)</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 shrink-0">Pilih Jendela</span>
          </button>

          {/* Upload Video or Image File */}
          <div className="space-y-1.5">
            <button
              onClick={() => {
                if (uploadedFileName) {
                  onSelectSource('video-file');
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs transition-colors ${
                stageSource === 'video-file'
                  ? 'bg-sky-500/15 border-sky-500/50 text-slate-100 font-medium'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <FileVideo className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="truncate">
                  {uploadedFileName ? `File: ${uploadedFileName}` : 'Tampilkan Video / Gambar Lokal'}
                </span>
              </div>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="text-[11px] font-mono text-sky-400 hover:underline flex items-center gap-1 shrink-0"
              >
                <Upload className="w-3 h-3" />
                Unggah
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadMediaFile(file);
              }}
            />
          </div>

          {/* Slide Deck / File Presentasi */}
          <button
            onClick={() => onSelectSource('slide-deck')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs transition-colors ${
              stageSource === 'slide-deck'
                ? 'bg-sky-500/15 border-sky-500/50 text-slate-100 font-medium'
                : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Presentation className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">File Presentasi / Slide Deck</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 shrink-0">3 Slide</span>
          </button>

          {/* Web Browser View */}
          <button
            onClick={() => onSelectSource('web-embed')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs transition-colors ${
              stageSource === 'web-embed'
                ? 'bg-sky-500/15 border-sky-500/50 text-slate-100 font-medium'
                : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Globe className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="truncate">Halaman Web / Dokumentasi Live</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 shrink-0">URL</span>
          </button>
        </div>

        {/* Web URL Quick Editor when Web Source is active */}
        {stageSource === 'web-embed' && (
          <div className="mt-3 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Domain / URL Web</label>
              <input
                type="text"
                value={webEmbedData.url}
                onChange={(e) => onUpdateWebEmbed({ url: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Judul Halaman di Layar</label>
              <input
                type="text"
                value={webEmbedData.title}
                onChange={(e) => onUpdateWebEmbed({ title: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. KUSTOMISASI KAMERA DEPAN / WAJAH PRESENTER */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-400" />
            <span>03. Tampilan Wajah (Kamera PiP)</span>
          </h2>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={cameraConfig.enabled}
              onChange={(e) => onUpdateCamera({ enabled: e.target.checked })}
              className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
            />
            <span>Tampil</span>
          </label>
        </div>

        {/* Custom Camera Photo / Avatar Uploader */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-slate-300 truncate">
              {customCameraAvatarName
                ? `Foto: ${customCameraAvatarName}`
                : 'Foto Kamera: Robot Cyborg Armor'}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {customCameraAvatarName && (
                <button
                  type="button"
                  onClick={onResetCameraAvatar}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => camAvatarInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-medium text-amber-300 whitespace-nowrap"
              >
                <Upload className="w-3 h-3" />
                <span>Ganti Foto</span>
              </button>
            </div>
          </div>
          <input
            ref={camAvatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadCameraAvatar(file);
            }}
          />
        </div>

        {/* Shape Selector */}
        <div>
          <label className="block text-[11px] text-slate-400 mb-1.5">
            Bentuk Bingkai Kamera
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(
              [
                { id: 'capsule', label: 'Kapsul', ratio: '3:4' },
                { id: 'circle', label: 'Bulat', ratio: '1:1' },
                { id: 'rounded', label: 'Lengkung', ratio: '16:9' },
                { id: 'sharp', label: 'Kotak', ratio: '3:4' },
              ] as const
            ).map((sh) => (
              <button
                key={sh.id}
                onClick={() =>
                  onUpdateCamera({
                    shape: sh.id,
                    aspectRatio: sh.ratio,
                  })
                }
                className={`py-1.5 px-2 rounded text-xs font-medium border transition-colors whitespace-nowrap ${
                  cameraConfig.shape === sh.id
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {sh.label}
              </button>
            ))}
          </div>
        </div>

        {/* Size Slider */}
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400">Ukuran Kamera di Panggung</span>
            <span className="font-mono tabular-nums text-slate-300">
              {Math.round(cameraConfig.width)}%
            </span>
          </div>
          <input
            type="range"
            min={11}
            max={38}
            step={0.5}
            value={cameraConfig.width}
            onChange={(e) => onUpdateCamera({ width: parseFloat(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Border Color Swatches */}
        <div>
          <label className="block text-[11px] text-slate-400 mb-1.5">
            Warna Garis Tepi (Ring Light Frame)
          </label>
          <div className="flex items-center gap-2">
            {[
              { color: '#F59E0B', name: 'Emas' },
              { color: '#10B981', name: 'Emerald' },
              { color: '#38BDF8', name: 'Biru' },
              { color: '#F43F5E', name: 'Merah' },
              { color: '#FFFFFF', name: 'Putih' },
              { color: 'transparent', name: 'Off' },
            ].map((sw) => (
              <button
                key={sw.color}
                onClick={() => onUpdateCamera({ borderColor: sw.color })}
                className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-all ${
                  cameraConfig.borderColor === sw.color
                    ? 'border-white bg-slate-800 text-white shadow-sm'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {sw.color !== 'transparent' && (
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: sw.color }}
                    />
                  )}
                  {sw.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Mirror, Co-Host & Watermark Badge Toggles */}
        <div className="pt-1 space-y-2 border-t border-slate-800/70">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onUpdateCamera({ mirrored: !cameraConfig.mirrored })}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                cameraConfig.mirrored
                  ? 'bg-slate-800 border-slate-600 text-slate-100'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <FlipHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Cermin Kamera</span>
            </button>

            <button
              onClick={() => {
                const nextCoHost = !cameraConfig.showCoHost;
                onUpdateCamera({ showCoHost: nextCoHost });
                if (nextCoHost && layoutPreset !== 'zoom-split-stage') {
                  onSelectLayout('zoom-split-stage');
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                cameraConfig.showCoHost
                  ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>+ Co-Host (Zoom)</span>
            </button>
          </div>

          {/* Creator Badge inside Camera */}
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Watermark di Dalam Kamera
              </span>
              <input
                type="checkbox"
                checked={cameraConfig.showBadge}
                onChange={(e) => onUpdateCamera({ showBadge: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950 text-amber-500"
              />
            </div>
            {cameraConfig.showBadge && (
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={cameraConfig.badgeText}
                  onChange={(e) => onUpdateCamera({ badgeText: e.target.value })}
                  placeholder="Nama Channel"
                  className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200"
                />
                <input
                  type="text"
                  value={cameraConfig.badgeSubtext}
                  onChange={(e) => onUpdateCamera({ badgeSubtext: e.target.value })}
                  placeholder="Sub-label"
                  className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-amber-400"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. VISUALISATOR GELOMBANG AUDIO MIKROFON (SIDEBAR REAL-TIME MONITOR) */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>04. Monitor Gelombang Audio</span>
          </h2>
          <span
            className={`text-[10px] font-mono tabular-nums font-semibold ${
              effectiveSidebarLevel > 78
                ? 'text-rose-400'
                : effectiveSidebarLevel > 45
                  ? 'text-amber-400'
                  : micEnabled || testMicWave
                    ? 'text-emerald-400'
                    : 'text-slate-500'
            }`}
          >
            {effectiveSidebarLevel > 0
              ? `${(-48 + (effectiveSidebarLevel / 100) * 46).toFixed(1)} dB`
              : '-∞ dB (Muted)'}
          </span>
        </div>

        {/* Live Waveform Canvas Box */}
        <div className="p-2.5 rounded-xl bg-[#090D16] border border-slate-800/90 space-y-2">
          <canvas
            ref={sidebarWaveCanvasRef}
            width={280}
            height={58}
            className="w-full h-[58px] block rounded"
          />

          {/* Level & Peak Readouts */}
          <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-400 pt-1 border-t border-slate-800/70">
            <span>INPUT: {Math.round(effectiveSidebarLevel)}%</span>
            <span>PEAK: {Math.round(peakMicLevel)}%</span>
            <span className={micEnabled ? 'text-emerald-400' : 'text-rose-400'}>
              {micEnabled ? '● LIVE MIC' : '○ MUTED'}
            </span>
          </div>
        </div>

        {/* Mic Mute/Unmute (Space) & Test Signal Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMic}
            className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              micEnabled
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-rose-950/60 border-rose-800/70 text-rose-300 hover:bg-rose-900/50'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              {micEnabled ? (
                <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <MicOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              )}
              <span className="truncate">{micEnabled ? 'Mute Mic' : 'Unmute Mic'}</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-700 text-[10px] font-mono text-slate-300 shrink-0">
              Space
            </kbd>
          </button>

          {!micEnabled && (
            <button
              type="button"
              onClick={() => setTestMicWave((prev) => !prev)}
              className={`px-2.5 py-2 rounded-lg text-xs font-mono border transition-colors whitespace-nowrap ${
                testMicWave
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Simulasikan input gelombang audio pada sidebar"
            >
              {testMicWave ? 'Tes: ON' : 'Uji Audio'}
            </button>
          )}
        </div>

        {/* Open Keyboard Shortcuts Help Modal Button */}
        <button
          type="button"
          onClick={onOpenShortcutsModal}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Keyboard className="w-3.5 h-3.5 text-amber-400" />
            <span>Daftar Shortcut & Hotkey Studio</span>
          </span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-[10px] font-mono text-amber-400">
            ?
          </kbd>
        </button>
      </div>
    </aside>
  );
};

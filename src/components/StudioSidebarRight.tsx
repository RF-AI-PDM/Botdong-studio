import React, { useState } from 'react';
import {
  ChatMessage,
  FloatingOverlayItem,
  RecordedClip,
  StreamDestination,
  SubtitleConfig,
} from '../types/studio';
import {
  Captions,
  Layers,
  Radio,
  Film,
  Mic,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Pin,
  Download,
  Play,
  Send,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

interface StudioSidebarRightProps {
  activeTab: 'overlays' | 'destinations' | 'recordings';
  onChangeTab: (tab: 'overlays' | 'destinations' | 'recordings') => void;
  subtitleConfig: SubtitleConfig;
  onUpdateSubtitle: (patch: Partial<SubtitleConfig>) => void;
  speechRecognitionSupported: boolean;
  isListeningSpeech: boolean;
  onToggleSpeechRecognition: () => void;
  overlays: FloatingOverlayItem[];
  onUpdateOverlay: (id: string, patch: Partial<FloatingOverlayItem>) => void;
  onAddOverlay: (item: Omit<FloatingOverlayItem, 'id'>) => void;
  onDeleteOverlay: (id: string) => void;
  destinations: StreamDestination[];
  onToggleDestination: (id: string) => void;
  onUpdateDestinationKey: (id: string, streamKey: string) => void;
  chatMessages: ChatMessage[];
  onSendChatMessage: (text: string) => void;
  onPinChatToStage: (msg: ChatMessage) => void;
  recordings: RecordedClip[];
  onPreviewRecording: (clip: RecordedClip) => void;
  onDeleteRecording: (id: string) => void;
  widthPx: number;
}

export const StudioSidebarRight: React.FC<StudioSidebarRightProps> = ({
  activeTab,
  onChangeTab,
  subtitleConfig,
  onUpdateSubtitle,
  speechRecognitionSupported,
  isListeningSpeech,
  onToggleSpeechRecognition,
  overlays,
  onUpdateOverlay,
  onAddOverlay,
  onDeleteOverlay,
  destinations,
  onToggleDestination,
  onUpdateDestinationKey,
  chatMessages,
  onSendChatMessage,
  onPinChatToStage,
  recordings,
  onPreviewRecording,
  onDeleteRecording,
  widthPx,
}) => {
  const [newOverlayType, setNewOverlayType] = useState<'lower-third' | 'file-card' | 'web-widget'>('file-card');
  const [newOverlayTitle, setNewOverlayTitle] = useState('');
  const [newOverlaySubtitle, setNewOverlaySubtitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const [editingDestId, setEditingDestId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');

  const handleCreateOverlay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOverlayTitle.trim()) return;
    onAddOverlay({
      type: newOverlayType,
      title: newOverlayTitle.trim(),
      subtitle: newOverlaySubtitle.trim() || 'Live Studio Overlay',
      codeSnippet: newOverlayType === 'file-card' ? newOverlaySubtitle.trim() : undefined,
      visible: true,
      x: 28,
      y: 26,
      width: newOverlayType === 'lower-third' ? 36 : 34,
    });
    setNewOverlayTitle('');
    setNewOverlaySubtitle('');
    setShowAddForm(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <aside
      style={{ width: `${widthPx}px` }}
      className="w-full lg:w-auto shrink-0 bg-[#0F1522] border-l border-slate-800/80 flex flex-col h-full overflow-hidden"
    >
      {/* Segmented Control Tabs */}
      <div className="p-3 border-b border-slate-800/80">
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            onClick={() => onChangeTab('overlays')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'overlays'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Elemen & Teks</span>
          </button>
          <button
            onClick={() => onChangeTab('destinations')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'destinations'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live & Chat</span>
          </button>
          <button
            onClick={() => onChangeTab('recordings')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'recordings'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Rekaman ({recordings.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SUBTITLES & FLOATING VISUAL OVERLAYS */}
      {activeTab === 'overlays' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* A. Subtitle / Auto-Caption Control */}
          <div className="space-y-3 pb-4 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <Captions className="w-4 h-4 text-amber-400" />
                <span>Subtitle & Teks Bawah (Live Caption)</span>
              </h3>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={subtitleConfig.enabled}
                  onChange={(e) => onUpdateSubtitle({ enabled: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-amber-500"
                />
                <span>Aktif</span>
              </label>
            </div>

            {/* Live Subtitle Text Input */}
            <div>
              <input
                type="text"
                value={subtitleConfig.text}
                onChange={(e) => onUpdateSubtitle({ text: e.target.value, enabled: true })}
                placeholder="Ketik teks subtitle di layar..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Auto Voice-to-Subtitle Trigger (Web Speech API) */}
            {speechRecognitionSupported && (
              <button
                onClick={onToggleSpeechRecognition}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  isListeningSpeech
                    ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Mic className={`w-3.5 h-3.5 ${isListeningSpeech ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                  <span>
                    {isListeningSpeech
                      ? 'Auto-Transcribe Suara Aktif (Bicara Sekarang)'
                      : 'Aktifkan Auto-Subtitle dari Suara Mikrofon'}
                  </span>
                </span>
                <span className="font-mono text-[10px]">ID/EN</span>
              </button>
            )}

            {/* Quick Script Prompter Cues */}
            <div>
              <div className="text-[11px] text-slate-400 mb-1.5">
                Klik Cepat Baris Narasi (Teleprompter):
              </div>
              <div className="space-y-1">
                {subtitleConfig.scriptLines.map((line, idx) => {
                  const isCurrent = subtitleConfig.text === line && subtitleConfig.enabled;
                  return (
                    <button
                      key={idx}
                      onClick={() =>
                        onUpdateSubtitle({
                          enabled: true,
                          text: line,
                          activeScriptIndex: idx,
                        })
                      }
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors truncate ${
                        isCurrent
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium'
                          : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {idx + 1}. &ldquo;{line}&rdquo;
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* B. Dynamic Floating Overlay Layers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Layer Visual Melayang (Drag & Drop)</span>
              </h3>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Layer</span>
              </button>
            </div>

            {showAddForm && (
              <form
                onSubmit={handleCreateOverlay}
                className="p-3 rounded-lg bg-slate-900 border border-slate-700 space-y-2.5"
              >
                <div className="grid grid-cols-3 gap-1">
                  {(
                    [
                      { id: 'file-card', label: 'File / Kode' },
                      { id: 'web-widget', label: 'Widget Web' },
                      { id: 'lower-third', label: 'Banner Nama' },
                    ] as const
                  ).map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setNewOverlayType(t.id)}
                      className={`py-1 px-2 rounded text-[11px] font-medium border ${
                        newOverlayType === t.id
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={newOverlayTitle}
                  onChange={(e) => setNewOverlayTitle(e.target.value)}
                  placeholder="Judul Layer (mis: sudo omarchy-install)"
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-100"
                />
                <textarea
                  rows={2}
                  value={newOverlaySubtitle}
                  onChange={(e) => setNewOverlaySubtitle(e.target.value)}
                  placeholder="Isi kode, catatan file, atau sub-judul..."
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-2.5 py-1 rounded text-xs text-slate-400 hover:text-slate-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-sky-500 text-slate-950 text-xs font-semibold"
                  >
                    Tampilkan di Layar
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {overlays.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    item.visible
                      ? 'bg-slate-900/90 border-slate-700'
                      : 'bg-slate-900/40 border-slate-800/70 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-mono text-sky-400">
                        {item.type === 'lower-third'
                          ? 'LOWER-THIRD BANNER'
                          : item.type === 'file-card'
                            ? 'FILE / TERMINAL CARD'
                            : item.type === 'web-widget'
                              ? 'WEB WIDGET OVERLAY'
                              : 'SOROTAN KOMENTAR'}
                      </div>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => onUpdateOverlay(item.id, { title: e.target.value })}
                        className="w-full bg-transparent text-xs font-semibold text-slate-100 focus:outline-none border-b border-transparent focus:border-slate-700 mt-0.5"
                      />
                      <input
                        type="text"
                        value={item.subtitle}
                        onChange={(e) =>
                          onUpdateOverlay(item.id, {
                            subtitle: e.target.value,
                            codeSnippet: item.type === 'file-card' ? e.target.value : item.codeSnippet,
                          })
                        }
                        className="w-full bg-transparent text-[11px] font-mono text-slate-400 focus:outline-none border-b border-transparent focus:border-slate-700 mt-0.5"
                      />
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onUpdateOverlay(item.id, { visible: !item.visible })}
                        className={`p-1.5 rounded border transition-colors ${
                          item.visible
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                        title={item.visible ? 'Sembunyikan dari layar' : 'Tampilkan di layar'}
                      >
                        {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => onDeleteOverlay(item.id)}
                        className="p-1.5 rounded bg-slate-800/80 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-slate-700/80"
                        title="Hapus layer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-PLATFORM STREAMING DESTINATIONS & LIVE CHAT */}
      {activeTab === 'destinations' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Half: RTMP Multi-Platform Simulcast Destinations */}
          <div className="p-4 border-b border-slate-800/80 space-y-2.5 overflow-y-auto max-h-[52%]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-200">
                Tujuan Siaran Langsung (Multi-Stream RTMP)
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {destinations.filter((d) => d.enabled).length} Aktif
              </span>
            </div>

            <div className="space-y-2">
              {destinations.map((dest) => (
                <div
                  key={dest.id}
                  className={`p-2.5 rounded-lg border transition-colors ${
                    dest.enabled
                      ? 'bg-slate-900/95 border-slate-700'
                      : 'bg-slate-900/40 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            dest.status === 'live'
                              ? 'bg-rose-500 animate-pulse'
                              : dest.enabled
                                ? 'bg-emerald-400'
                                : 'bg-slate-600'
                          }`}
                        />
                        <span className="text-xs font-semibold text-slate-100 truncate">
                          {dest.platform}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                        {dest.status === 'live'
                          ? `LIVE · ${dest.viewers.toLocaleString()} penonton`
                          : dest.rtmpUrl}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() =>
                          setEditingDestId(editingDestId === dest.id ? null : dest.id)
                        }
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="Atur Stream Key RTMP"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onToggleDestination(dest.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                          dest.enabled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {dest.enabled ? 'Siap' : 'Nonaktif'}
                      </button>
                    </div>
                  </div>

                  {editingDestId === dest.id && (
                    <div className="mt-2 pt-2 border-t border-slate-800 space-y-1.5">
                      <label className="block text-[10px] font-mono text-slate-400">
                        STREAM KEY ({dest.platform.toUpperCase()})
                      </label>
                      <input
                        type="password"
                        value={dest.streamKey}
                        onChange={(e) => onUpdateDestinationKey(dest.id, e.target.value)}
                        placeholder="Tempel Stream Key RTMP..."
                        className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Half: Unified Live Chat with "Pin to Stage" action */}
          <div className="flex-1 flex flex-col min-h-0 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-200">
                Komentar Penonton (Klik Pin ke Layar)
              </h3>
              <span className="text-[11px] text-slate-400">Real-Time</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/90 flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-200">{msg.author}</span>
                      <span>·</span>
                      <span className="font-mono text-[10px] text-amber-400">{msg.platform}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums text-[10px]">{msg.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 break-words">{msg.text}</p>
                  </div>

                  <button
                    onClick={() => onPinChatToStage(msg)}
                    className={`p-1.5 rounded border shrink-0 transition-colors ${
                      msg.pinnedOnStage
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                    title="Tampilkan komentar ini di layar siaran"
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!chatInput.trim()) return;
                onSendChatMessage(chatInput.trim());
                setChatInput('');
              }}
              className="mt-2.5 flex items-center gap-1.5"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Kirim pesan / simulasi komentar..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
                title="Kirim"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: RECORDED VIDEO CLIPS */}
      {activeTab === 'recordings' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200">
              Hasil Rekaman Studio (.WEBM)
            </h3>
            <span className="text-[11px] font-mono tabular-nums text-slate-400">
              {recordings.length} File
            </span>
          </div>

          {recordings.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center space-y-2">
              <Film className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="text-xs font-semibold text-slate-200">
                Belum Ada Rekaman Tersimpan
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Klik tombol <strong className="text-amber-400">Mulai Rekam</strong> di kanan atas untuk merekam seluruh aktivitas panggung beserta kamera depan dan audio Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recordings.map((clip) => (
                <div
                  key={clip.id}
                  className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-100 truncate flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{clip.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums text-slate-400 mt-1">
                        <span>{clip.durationSec} dtk</span>
                        <span>·</span>
                        <span>{formatBytes(clip.sizeBytes)}</span>
                        <span>·</span>
                        <span>{clip.resolution}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteRecording(clip.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400"
                      title="Hapus rekaman"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onPreviewRecording(clip)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 text-amber-400" />
                      <span>Putar Pratinjau</span>
                    </button>
                    <a
                      href={clip.url}
                      download={`${clip.title.replace(/\s+/g, '-').toLowerCase()}.webm`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-amber-500 hover:bg-amber-400 text-xs font-semibold text-slate-950 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Video</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

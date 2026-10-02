import React, { useEffect, useRef, useState } from 'react';
import {
  CameraConfig,
  ChatMessage,
  FloatingOverlayItem,
  LayoutPresetId,
  LayoutSnapshotPreset,
  RecordedClip,
  StageSourceType,
  StreamDestination,
  SubtitleConfig,
} from './types/studio';
import { BroadcastStage } from './components/BroadcastStage';
import { StudioSidebarLeft } from './components/StudioSidebarLeft';
import { StudioSidebarRight } from './components/StudioSidebarRight';
import {
  CircleDot,
  Radio,
  Square,
  X,
  Download,
  AlertCircle,
} from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Hidden media elements feeding the real-time Canvas Compositor
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const uploadedVideoRef = useRef<HTMLVideoElement | null>(null);
  const [uploadedImageEl, setUploadedImageEl] = useState<HTMLImageElement | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Active Layout & Stage Source (Defaults to exact reference screenshot look!)
  const [layoutPreset, setLayoutPreset] = useState<LayoutPresetId>('pip-vertical-capsule');
  const [stageSource, setStageSource] = useState<StageSourceType>('linux-desktop-sim');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [slideIndex, setSlideIndex] = useState<number>(0);

  // Web Embed source state
  const [webEmbedData, setWebEmbedData] = useState({
    url: 'omarchy.org/docs/quickstart-installer',
    title: 'Omarchy Linux · Panduan Instalasi & Konfigurasi Cepat',
    headlines: [
      'Ketik "install" pada menu launcher untuk memilih paket aplikasi inti',
      'Gunakan fitur Preinstalls untuk membersihkan bloatware sistem secara instan',
      'Kompatibel penuh dengan Hyprland Wayland Compositor & Tiling otomatis',
    ],
  });

  // Camera PiP Configuration (Matches reference screenshot: vertical capsule on bottom-right with golden border & badge)
  const [cameraConfig, setCameraConfig] = useState<CameraConfig>({
    enabled: true,
    useRealWebcam: false,
    x: 88,
    y: 69,
    width: 16.5,
    aspectRatio: '3:4',
    shape: 'capsule',
    borderColor: '#F59E0B',
    borderWidth: 6,
    mirrored: false,
    showBadge: true,
    badgeText: 'NETWORK',
    badgeSubtext: 'STUDIO LIVE',
    showCoHost: false,
  });

  // Live Subtitle Configuration (Matches "Ketik install dan" at bottom of reference screenshot!)
  const [subtitleConfig, setSubtitleConfig] = useState<SubtitleConfig>({
    enabled: true,
    text: 'Ketik install dan',
    autoSpeechToText: false,
    language: 'id-ID',
    positionY: 91,
    fontSize: 'md',
    scriptLines: [
      'Ketik install dan',
      'Pilih menu Install untuk menambahkan paket baru ke sistem',
      'Atau pilih Preinstalls untuk menghapus aplikasi bawaan',
      'Seluruh perubahan diterapkan secara real-time tanpa reboot',
    ],
    activeScriptIndex: 0,
  });

  // Floating Dynamic Overlays
  const [overlays, setOverlays] = useState<FloatingOverlayItem[]>([
    {
      id: 'ov-cmd-1',
      type: 'file-card',
      title: 'Perintah Terminal Cepat',
      subtitle: '$ omarchy-menu --launch install\n> Memuat daftar paket resmi...',
      codeSnippet: '$ omarchy-menu --launch install\n> Memuat daftar paket resmi...',
      visible: false,
      x: 24,
      y: 24,
      width: 34,
    },
    {
      id: 'ov-lower-1',
      type: 'lower-third',
      title: 'Rizki Firmansyah · Live Coding & Infrastruktur',
      subtitle: 'Topik: Otomatisasi Setup Linux & Jaringan Produksi',
      visible: false,
      x: 28,
      y: 78,
      width: 42,
    },
  ]);

  // Multi-Platform Streaming Destinations
  const [destinations, setDestinations] = useState<StreamDestination[]>([
    {
      id: 'dest-yt',
      platform: 'YouTube Live',
      rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2',
      streamKey: 'yt-live-9841-xxxx-xxxx',
      enabled: true,
      status: 'idle',
      viewers: 0,
    },
    {
      id: 'dest-twitch',
      platform: 'Twitch',
      rtmpUrl: 'rtmp://live.twitch.tv/app',
      streamKey: 'live_772194_xxxxxxxxxxxx',
      enabled: true,
      status: 'idle',
      viewers: 0,
    },
    {
      id: 'dest-tiktok',
      platform: 'TikTok Live',
      rtmpUrl: 'rtmp://push.tiktokv.com/live',
      streamKey: 'tt-stream-5521-xxxx',
      enabled: false,
      status: 'idle',
      viewers: 0,
    },
    {
      id: 'dest-zoom',
      platform: 'Zoom / Teams RTMP',
      rtmpUrl: 'rtmps://live.zoom.us/rtmp/publish',
      streamKey: 'zm-webinar-8820-xxxx',
      enabled: false,
      status: 'idle',
      viewers: 0,
    },
  ]);

  // Unified Audience Live Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'chat-1',
      author: 'Dimas Pratama',
      platform: 'YouTube Live',
      text: 'Bang, cara munculin menu install mengambang kayak gitu pakai shortcut apa?',
      timestamp: '21:44',
      pinnedOnStage: false,
    },
    {
      id: 'chat-2',
      author: 'Nadia DevOps',
      platform: 'Twitch',
      text: 'Tampilan kamera PiP kapsul di kanan bawah rapi banget, masih kelihatan jelas terminalnya!',
      timestamp: '21:45',
      pinnedOnStage: false,
    },
    {
      id: 'chat-3',
      author: 'Arif Rahman',
      platform: 'YouTube Live',
      text: 'Kalau pilih menu Preinstalls itu otomatis hapus aplikasi bawaan ya?',
      timestamp: '21:46',
      pinnedOnStage: false,
    },
  ]);

  // Right Sidebar Active Tab
  const [rightTab, setRightTab] = useState<'overlays' | 'destinations' | 'recordings'>('overlays');

  // Persistent Layout Snapshots (Camera position, Overlay placement & visibility)
  const SNAPSHOT_STORAGE_KEY = 'castframe_layout_snapshots_v1';
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>('snap-default-tutorial');
  const [savedSnapshots, setSavedSnapshots] = useState<LayoutSnapshotPreset[]>(() => {
    try {
      const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to default starter presets
    }
    return [
      {
        id: 'snap-default-tutorial',
        name: 'Tutorial Kanan Bawah (Default)',
        createdAt: '21:45',
        layoutPreset: 'pip-vertical-capsule',
        cameraConfig: {
          enabled: true,
          useRealWebcam: false,
          x: 88,
          y: 69,
          width: 16.5,
          aspectRatio: '3:4',
          shape: 'capsule',
          borderColor: '#F59E0B',
          borderWidth: 6,
          mirrored: false,
          showBadge: true,
          badgeText: 'NETWORK',
          badgeSubtext: 'STUDIO LIVE',
          showCoHost: false,
        },
        overlays: [
          {
            id: 'ov-cmd-1',
            type: 'file-card',
            title: 'Perintah Terminal Cepat',
            subtitle: '$ omarchy-menu --launch install\n> Memuat daftar paket resmi...',
            codeSnippet: '$ omarchy-menu --launch install\n> Memuat daftar paket resmi...',
            visible: false,
            x: 24,
            y: 24,
            width: 34,
          },
          {
            id: 'ov-lower-1',
            type: 'lower-third',
            title: 'Rizki Firmansyah · Live Coding & Infrastruktur',
            subtitle: 'Topik: Otomatisasi Setup Linux & Jaringan Produksi',
            visible: false,
            x: 28,
            y: 78,
            width: 42,
          },
        ],
        subtitleEnabled: true,
        subtitlePositionY: 91,
      },
      {
        id: 'snap-demo-coding',
        name: 'Live Terminal + Kode Kiri Atas',
        createdAt: '21:50',
        layoutPreset: 'pip-circle-bubble',
        cameraConfig: {
          enabled: true,
          useRealWebcam: false,
          x: 86,
          y: 74,
          width: 15,
          aspectRatio: '1:1',
          shape: 'circle',
          borderColor: '#10B981',
          borderWidth: 5,
          mirrored: false,
          showBadge: false,
          badgeText: 'NETWORK',
          badgeSubtext: 'STUDIO LIVE',
          showCoHost: false,
        },
        overlays: [
          {
            id: 'ov-cmd-1',
            type: 'file-card',
            title: 'Perintah Terminal Cepat',
            subtitle: '$ omarchy-menu --launch install\n> Memuat daftar paket resmi...',
            codeSnippet: '$ omarchy-menu --launch install\n> Memuat daftar paket resmi...',
            visible: true,
            x: 24,
            y: 24,
            width: 34,
          },
          {
            id: 'ov-lower-1',
            type: 'lower-third',
            title: 'Rizki Firmansyah · Live Coding & Infrastruktur',
            subtitle: 'Topik: Otomatisasi Setup Linux & Jaringan Produksi',
            visible: true,
            x: 28,
            y: 78,
            width: 42,
          },
        ],
        subtitleEnabled: true,
        subtitlePositionY: 91,
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(savedSnapshots));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedSnapshots]);

  const handleSaveSnapshot = (customName?: string) => {
    const newId = `snap-${Date.now()}`;
    const name =
      customName && customName.trim().length > 0
        ? customName.trim()
        : `Snapshot #${savedSnapshots.length + 1} (${Math.round(cameraConfig.x)}%, ${Math.round(cameraConfig.y)}%)`;

    const snapshot: LayoutSnapshotPreset = {
      id: newId,
      name,
      createdAt: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      layoutPreset,
      cameraConfig: { ...cameraConfig },
      overlays: overlays.map((o) => ({ ...o })),
      subtitleEnabled: subtitleConfig.enabled,
      subtitlePositionY: subtitleConfig.positionY,
    };

    setSavedSnapshots((prev) => [snapshot, ...prev]);
    setActiveSnapshotId(newId);
    showNotice(`Snapshot tata letak "${name}" berhasil disimpan!`);
  };

  const handleApplySnapshot = (snapshot: LayoutSnapshotPreset) => {
    setLayoutPreset(snapshot.layoutPreset);
    setCameraConfig((prev) => ({
      ...snapshot.cameraConfig,
      // Preserve live hardware webcam stream toggle so active camera stays connected
      useRealWebcam: prev.useRealWebcam,
    }));
    setOverlays(snapshot.overlays.map((o) => ({ ...o })));
    setSubtitleConfig((prev) => ({
      ...prev,
      enabled: snapshot.subtitleEnabled,
      positionY: snapshot.subtitlePositionY,
    }));
    setActiveSnapshotId(snapshot.id);
    showNotice(`Snapshot "${snapshot.name}" diterapkan ke panggung siaran.`);
  };

  const handleOverwriteSnapshot = (id: string) => {
    setSavedSnapshots((prev) =>
      prev.map((snap) =>
        snap.id === id
          ? {
              ...snap,
              createdAt: new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              layoutPreset,
              cameraConfig: { ...cameraConfig },
              overlays: overlays.map((o) => ({ ...o })),
              subtitleEnabled: subtitleConfig.enabled,
              subtitlePositionY: subtitleConfig.positionY,
            }
          : snap
      )
    );
    setActiveSnapshotId(id);
    showNotice('Snapshot berhasil diperbarui dengan posisi kamera & layer saat ini.');
  };

  const handleDeleteSnapshot = (id: string) => {
    setSavedSnapshots((prev) => prev.filter((s) => s.id !== id));
    if (activeSnapshotId === id) {
      setActiveSnapshotId(null);
    }
    showNotice('Preset snapshot dihapus.');
  };

  // Hardware Streams, Audio Analyser & Recording State
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState<boolean>(false);
  const [micLevel, setMicLevel] = useState<number>(0);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [recordings, setRecordings] = useState<RecordedClip[]>([]);
  const [previewClip, setPreviewClip] = useState<RecordedClip | null>(null);

  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Speech Recognition (Auto-Subtitles)
  const recognitionRef = useRef<any>(null);
  const [isListeningSpeech, setIsListeningSpeech] = useState<boolean>(false);
  const speechRecognitionSupported =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const showNotice = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => {
      setStatusToast((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Timer for Recording / Live Streaming
  useEffect(() => {
    if (!isRecording && !isStreaming) {
      setRecordingSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording, isStreaming]);

  // Simulate viewer count updates while Live Streaming
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setDestinations((prev) =>
        prev.map((d) =>
          d.enabled
            ? {
                ...d,
                status: 'live',
                viewers: Math.max(12, d.viewers + Math.floor(Math.random() * 14) - 3),
              }
            : d
        )
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  // Microphone Audio Level Analyser
  useEffect(() => {
    if (!micEnabled || !micStream) {
      setMicLevel(0);
      return;
    }
    let audioCtx: AudioContext | null = null;
    let animId: number;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new AudioContextClass();
      const source = audioCtx.createMediaStreamSource(micStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animId = requestAnimationFrame(updateLevel);
      };
      animId = requestAnimationFrame(updateLevel);
    } catch {
      // Fallback if AudioContext restricted
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };
  }, [micEnabled, micStream]);

  // Start Real Screen Share via getDisplayMedia
  const handleStartRealScreenShare = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      showNotice('Browser Anda tidak mendukung fitur tangkap layar (getDisplayMedia).');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60 },
        },
        audio: true,
      });

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
        await screenVideoRef.current.play();
      }

      stream.getVideoTracks()[0].onended = () => {
        setScreenStream(null);
        setStageSource('linux-desktop-sim');
        showNotice('Berbagi layar dihentikan. Kembali ke panggung interaktif.');
      };

      setScreenStream(stream);
      setStageSource('screen-live');
      showNotice('Layar asli berhasil ditampilkan ke panggung siaran!');
    } catch {
      showNotice(
        'Izin tangkap layar dibatalkan atau dibatasi oleh lingkungan pratinjau. Menampilkan layar demo interaktif.'
      );
      setStageSource('linux-desktop-sim');
    }
  };

  // Toggle Real Front Camera (Webcam) via getUserMedia
  const handleToggleRealWebcam = async () => {
    if (cameraConfig.useRealWebcam && webcamStream) {
      webcamStream.getTracks().forEach((t) => t.stop());
      setWebcamStream(null);
      setCameraConfig((prev) => ({ ...prev, useRealWebcam: false }));
      showNotice('Kamera depan asli dinonaktifkan. Menggunakan avatar studio.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
        await webcamVideoRef.current.play();
      }

      setWebcamStream(stream);
      setCameraConfig((prev) => ({ ...prev, enabled: true, useRealWebcam: true }));
      showNotice('Kamera depan (Webcam) aktif di panggung siaran!');
    } catch {
      showNotice(
        'Tidak dapat mengakses kamera depan (pastikan izin kamera diberikan). Menampilkan kamera studio.'
      );
    }
  };

  // Toggle Microphone Audio
  const handleToggleMic = async () => {
    if (micEnabled && micStream) {
      micStream.getTracks().forEach((t) => t.stop());
      setMicStream(null);
      setMicEnabled(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      });
      setMicStream(stream);
      setMicEnabled(true);
      showNotice('Mikrofon aktif dan terhubung ke mixer rekaman.');
    } catch {
      showNotice('Izin mikrofon ditolak atau perangkat audio tidak ditemukan.');
    }
  };

  // Handle Uploading a Local Video or Image File onto the Stage
  const handleUploadMediaFile = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setUploadedFileName(file.name);

    if (file.type.startsWith('video/')) {
      setUploadedImageEl(null);
      if (uploadedVideoRef.current) {
        uploadedVideoRef.current.src = objectUrl;
        uploadedVideoRef.current.loop = true;
        uploadedVideoRef.current.muted = false;
        uploadedVideoRef.current.play().catch(() => {});
      }
      setStageSource('video-file');
      showNotice(`Video "${file.name}" berhasil dimuat ke panggung utama!`);
    } else if (file.type.startsWith('image/')) {
      if (uploadedVideoRef.current) {
        uploadedVideoRef.current.pause();
        uploadedVideoRef.current.removeAttribute('src');
      }
      const img = new Image();
      img.onload = () => {
        setUploadedImageEl(img);
        setStageSource('video-file');
        showNotice(`Gambar "${file.name}" berhasil ditampilkan di panggung utama!`);
      };
      img.src = objectUrl;
    }
  };

  // Toggle Web Speech API Live Auto-Subtitles
  const handleToggleSpeechRecognition = () => {
    if (!speechRecognitionSupported) return;

    if (isListeningSpeech && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListeningSpeech(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = subtitleConfig.language;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let latestTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          latestTranscript += event.results[i][0].transcript;
        }
        if (latestTranscript.trim()) {
          setSubtitleConfig((prev) => ({
            ...prev,
            enabled: true,
            text: latestTranscript.trim().slice(-95),
          }));
        }
      };

      recognition.onerror = () => {
        setIsListeningSpeech(false);
      };

      recognition.onend = () => {
        setIsListeningSpeech(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListeningSpeech(true);
      showNotice('Auto-Subtitle aktif! Silakan berbicara, teks akan muncul otomatis di layar.');
    } catch {
      showNotice('Gagal memulai pengenalan suara di browser ini.');
    }
  };

  // Start / Stop Real Canvas Composite Video Recording via MediaRecorder
  const handleToggleRecording = () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const canvasStream = canvas.captureStream(30);
      // Merge microphone audio tracks if enabled
      if (micStream) {
        micStream.getAudioTracks().forEach((track) => {
          canvasStream.addTrack(track);
        });
      }
      if (screenStream) {
        screenStream.getAudioTracks().forEach((track) => {
          canvasStream.addTrack(track);
        });
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
          ? 'video/webm;codecs=vp8'
          : 'video/webm';

      const recorder = new MediaRecorder(canvasStream, {
        mimeType,
        videoBitsPerSecond: 6_000_000,
      });

      recordedChunksRef.current = [];
      const startedAtSec = recordingSeconds;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const newClip: RecordedClip = {
          id: `rec-${Date.now()}`,
          title: `Rekaman Studio #${recordings.length + 1}`,
          url,
          createdAt: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          durationSec: Math.max(1, recordingSeconds - startedAtSec),
          sizeBytes: blob.size,
          resolution: '1920×1080',
        };
        setRecordings((prev) => [newClip, ...prev]);
        setRightTab('recordings');
        setPreviewClip(newClip);
        showNotice('Rekaman selesai! Video siap diputar atau diunduh.');
      };

      recorder.start(500);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      showNotice('Perekaman layar & komposisi kamera dimulai (1080p 30fps).');
    } catch {
      showNotice('Gagal menginisialisasi perekam MediaRecorder pada browser ini.');
    }
  };

  // Start / Stop Multi-Platform Live Streaming
  const handleToggleStreaming = () => {
    if (isStreaming) {
      setIsStreaming(false);
      setDestinations((prev) =>
        prev.map((d) => ({ ...d, status: 'idle', viewers: 0 }))
      );
      showNotice('Siaran langsung dihentikan di seluruh platform.');
      return;
    }

    const activeCount = destinations.filter((d) => d.enabled).length;
    if (activeCount === 0) {
      setRightTab('destinations');
      showNotice('Pilih minimal 1 platform tujuan streaming (mis: YouTube/Twitch) terlebih dahulu.');
      return;
    }

    setIsStreaming(true);
    setDestinations((prev) =>
      prev.map((d) =>
        d.enabled
          ? { ...d, status: 'live', viewers: Math.floor(Math.random() * 45) + 18 }
          : d
      )
    );
    setRightTab('destinations');
    showNotice(`ON AIR! Siaran langsung aktif ke ${activeCount} platform sekaligus.`);
  };

  // Pin / Unpin a Live Chat message onto the Broadcast Stage as a floating overlay
  const handlePinChatToStage = (msg: ChatMessage) => {
    const spotlightId = `chat-pin-${msg.id}`;
    const exists = overlays.find((o) => o.id === spotlightId);

    if (exists) {
      setOverlays((prev) => prev.filter((o) => o.id !== spotlightId));
      setChatMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, pinnedOnStage: false } : m))
      );
    } else {
      // Remove any previously pinned chat first so stage stays clean
      setOverlays((prev) => [
        ...prev.filter((o) => o.type !== 'chat-spotlight'),
        {
          id: spotlightId,
          type: 'chat-spotlight',
          title: `${msg.author} (${msg.platform})`,
          subtitle: msg.text,
          visible: true,
          x: 34,
          y: 76,
          width: 46,
        },
      ]);
      setChatMessages((prev) =>
        prev.map((m) => ({
          ...m,
          pinnedOnStage: m.id === msg.id,
        }))
      );
      showNotice(`Komentar dari ${msg.author} ditampilkan ke panggung siaran!`);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-[#0B0F17] text-slate-100 overflow-hidden">
      {/* Hidden Video Elements for Canvas Compositor */}
      <video ref={screenVideoRef} className="hidden" playsInline muted />
      <video ref={webcamVideoRef} className="hidden" playsInline muted />
      <video ref={uploadedVideoRef} className="hidden" playsInline loop />

      {/* STRICT 3-ZONE TOP BAR CONTRACT */}
      <header className="h-14 shrink-0 flex items-center justify-between px-5 bg-[#0B0F17] border-b border-slate-800/90">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#studio"
          onClick={(e) => e.preventDefault()}
          className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap"
        >
          CastFrame Studio
        </a>

        {/* Zone 2: 4 clean navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          <button
            onClick={() => setRightTab('overlays')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap ${
              rightTab === 'overlays' ? 'text-slate-100 underline underline-offset-8 decoration-amber-500' : ''
            }`}
          >
            Komposisi Layar
          </button>
          <button
            onClick={() => setStageSource('linux-desktop-sim')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap ${
              stageSource === 'linux-desktop-sim' ? 'text-slate-100' : ''
            }`}
          >
            Sumber Media
          </button>
          <button
            onClick={() => setRightTab('destinations')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap ${
              rightTab === 'destinations' ? 'text-slate-100 underline underline-offset-8 decoration-amber-500' : ''
            }`}
          >
            Multi-Stream RTMP
          </button>
          <button
            onClick={() => setRightTab('recordings')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap ${
              rightTab === 'recordings' ? 'text-slate-100 underline underline-offset-8 decoration-amber-500' : ''
            }`}
          >
            Rekaman Video ({recordings.length})
          </button>
        </nav>

        {/* Zone 3: 2 primary actions (Record & Go Live) */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleToggleRecording}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              isRecording
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Selesai Rekam</span>
              </>
            ) : (
              <>
                <CircleDot className="w-3.5 h-3.5 text-amber-400" />
                <span>Mulai Rekam</span>
              </>
            )}
          </button>

          <button
            onClick={handleToggleStreaming}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              isStreaming
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isStreaming ? 'Akhiri Siaran Live' : 'Siaran Langsung (Go Live)'}</span>
          </button>
        </div>
      </header>

      {/* Non-intrusive Status Toast Banner */}
      {statusToast && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900/95 border border-amber-500/50 text-xs font-medium text-slate-100 shadow-2xl">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{statusToast}</span>
        </div>
      )}

      {/* MAIN 3-COLUMN STUDIO WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Sidebar: Scene Layouts, Sources & Camera Frame Styling */}
        <StudioSidebarLeft
          layoutPreset={layoutPreset}
          onSelectLayout={setLayoutPreset}
          stageSource={stageSource}
          onSelectSource={setStageSource}
          onStartRealScreenShare={handleStartRealScreenShare}
          onUploadMediaFile={handleUploadMediaFile}
          uploadedFileName={uploadedFileName}
          cameraConfig={cameraConfig}
          onUpdateCamera={(patch) => setCameraConfig((prev) => ({ ...prev, ...patch }))}
          webEmbedData={webEmbedData}
          onUpdateWebEmbed={(patch) => setWebEmbedData((prev) => ({ ...prev, ...patch }))}
          savedSnapshots={savedSnapshots}
          activeSnapshotId={activeSnapshotId}
          onSaveSnapshot={handleSaveSnapshot}
          onApplySnapshot={handleApplySnapshot}
          onOverwriteSnapshot={handleOverwriteSnapshot}
          onDeleteSnapshot={handleDeleteSnapshot}
        />

        {/* Center Interactive Broadcast Canvas Stage */}
        <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
          <BroadcastStage
            canvasRef={canvasRef}
            layoutPreset={layoutPreset}
            stageSource={stageSource}
            cameraConfig={cameraConfig}
            onUpdateCamera={(patch) => setCameraConfig((prev) => ({ ...prev, ...patch }))}
            subtitleConfig={subtitleConfig}
            overlays={overlays}
            onUpdateOverlay={(id, patch) =>
              setOverlays((prev) =>
                prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
              )
            }
            screenVideoEl={screenVideoRef.current}
            webcamVideoEl={webcamVideoRef.current}
            uploadedVideoEl={uploadedVideoRef.current}
            uploadedImageEl={uploadedImageEl}
            isRecording={isRecording}
            isStreaming={isStreaming}
            recordingSeconds={recordingSeconds}
            micEnabled={micEnabled}
            micLevel={micLevel}
            onToggleMic={handleToggleMic}
            onStartRealScreenShare={handleStartRealScreenShare}
            onToggleRealWebcam={handleToggleRealWebcam}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            slideIndex={slideIndex}
            onChangeSlide={setSlideIndex}
            webEmbedData={webEmbedData}
          />
        </main>

        {/* Right Sidebar: Live Subtitles, Floating Overlays, Multi-Stream RTMP & Recordings */}
        <StudioSidebarRight
          activeTab={rightTab}
          onChangeTab={setRightTab}
          subtitleConfig={subtitleConfig}
          onUpdateSubtitle={(patch) => setSubtitleConfig((prev) => ({ ...prev, ...patch }))}
          speechRecognitionSupported={speechRecognitionSupported}
          isListeningSpeech={isListeningSpeech}
          onToggleSpeechRecognition={handleToggleSpeechRecognition}
          overlays={overlays}
          onUpdateOverlay={(id, patch) =>
            setOverlays((prev) =>
              prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
            )
          }
          onAddOverlay={(newItem) =>
            setOverlays((prev) => [
              ...prev,
              { ...newItem, id: `ov-${Date.now()}` },
            ])
          }
          onDeleteOverlay={(id) =>
            setOverlays((prev) => prev.filter((item) => item.id !== id))
          }
          destinations={destinations}
          onToggleDestination={(id) =>
            setDestinations((prev) =>
              prev.map((d) => (d.id === id ? { ...d, enabled: !d.enabled } : d))
            )
          }
          onUpdateDestinationKey={(id, streamKey) =>
            setDestinations((prev) =>
              prev.map((d) => (d.id === id ? { ...d, streamKey } : d))
            )
          }
          chatMessages={chatMessages}
          onSendChatMessage={(text) =>
            setChatMessages((prev) => [
              ...prev,
              {
                id: `chat-${Date.now()}`,
                author: 'Anda (Host Studio)',
                platform: 'YouTube Live',
                text,
                timestamp: new Date().toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              },
            ])
          }
          onPinChatToStage={handlePinChatToStage}
          recordings={recordings}
          onPreviewRecording={setPreviewClip}
          onDeleteRecording={(id) =>
            setRecordings((prev) => prev.filter((r) => r.id !== id))
          }
        />
      </div>

      {/* Instant Video Recording Preview Modal */}
      {previewClip && (
        <div
          onClick={() => setPreviewClip(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl rounded-xl bg-[#0F1522] border border-slate-700 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  {previewClip.title}
                </h3>
                <p className="text-xs font-mono tabular-nums text-slate-400">
                  {previewClip.resolution} · Durasi {previewClip.durationSec} detik · Direkam pukul {previewClip.createdAt}
                </p>
              </div>
              <button
                onClick={() => setPreviewClip(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-black aspect-video">
              <video
                src={previewClip.url}
                controls
                autoPlay
                className="w-full h-full"
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Seluruh tata letak panggung, kamera depan, dan teks subtitle telah digabungkan dalam video ini.
              </span>
              <a
                href={previewClip.url}
                download={`${previewClip.title.replace(/\s+/g, '-').toLowerCase()}.webm`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Video (.WEBM)</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

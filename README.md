# CastFrame Studio — Live Streaming & Screen Recording Broadcast Studio

**CastFrame Studio** adalah aplikasi studio siaran langsung (*live streaming*) dan perekam layar (*screen recorder*) berbasis web real-time. Aplikasi ini memungkinkan kreator konten, pengajar, dan engineer untuk menggabungkan tangkapan layar, kamera depan (*Picture-in-Picture* maupun *split-screen* ala Zoom/Teams), file video/gambar lokal, *slide deck* presentasi, halaman web, serta subtitle otomatis dalam satu kanvas komposisi 1080p 60 FPS yang dapat diatur secara dinamis saat siaran berlangsung.

---

## Fitur Utama

### 1. Komposisi Panggung & Kamera Depan Dinamis (Real-Time Canvas 1080p)
- **Drag & Resize Langsung di Panggung**: Geser posisi kamera depan (*webcam*) atau ubah ukurannya secara bebas di atas kanvas menggunakan *pointer handle* interaktif.
- **6 Preset Tata Letak Siaran Instan**:
  - **PiP Kapsul**: Bingkai kamera vertikal di sudut kanan bawah dengan *ring light border* emas dan watermark kreator.
  - **PiP Lingkaran**: Kamera bulat melayang bergaya modern (Loom-style).
  - **Zoom / Teams Split Stage**: Proporsi layar utama 70% di sisi kiri dengan panel kamera host & co-host bertumpuk di sisi kanan.
  - **Split 50 : 50**: Tampilan berdampingan seimbang antara layar materi dan kamera presenter.
  - **Layar Penuh**: Fokus 100% pada materi layar tanpa kamera.
  - **Kamera Penuh**: Fokus 100% pada wajah presenter.
- **Kustomisasi Bingkai Kamera**: Pengaturan bentuk bingkai (*Kapsul, Bulat, Lengkung, Kotak*), warna garis tepi (*Emas, Emerald, Biru, Merah, Putih, Off*), efek cermin (*Mirror*), mode **+ Co-Host (Zoom)**, serta teks *watermark* di dalam bingkai kamera.
- **Save Layout Snapshot (Preset Persisten)**: Simpan kombinasi posisi kamera, ukuran, tata letak panggung, penempatan *floating layer*, dan status visibilitas ke daftar preset pengguna (`localStorage`) yang dapat diterapkan atau diperbarui kapan saja dengan satu klik.

### 2. Multi-Sumber Media (Layar, Video/Gambar, Slide, & Web)
- **Tangkap Layar Asli (*Screen Share*)**: Terhubung langsung dengan Web API `navigator.mediaDevices.getDisplayMedia` untuk menangkap seluruh layar, jendela aplikasi, atau tab browser beserta audio sistem.
- **Kamera Depan Asli (*Webcam*)**: Menggunakan `navigator.mediaDevices.getUserMedia` dengan *fallback* otomatis ke potret studio apabila kamera belum diaktifkan.
- **Layar Demo Interaktif (Linux Installer)**: Simulasi desktop Linux interaktif (menu `Install`, `Remove`, dan `Preinstalls`) yang dapat diklik langsung di panggung.
- **Unggah File Video & Gambar Lokal**: Putar file `.mp4`, `.webm`, atau tampilkan gambar referensi langsung di panggung utama sembari wajah presenter tetap terlihat.
- **Slide Deck Presentasi & Halaman Web Live**: Navigasi *slide* presentasi atau tampilkan URL/dokumentasi web secara langsung di dalam kanvas siaran.

### 3. Visualisasi Gelombang Audio (*Dynamic Audio Waveform Visualizer*)
- **Analisis Mikrofon Real-Time**: Menggunakan Web Audio API (`AudioContext` & `AnalyserNode`) untuk mengukur level suara (`micLevel`) dan desibel (`dB`).
- **3 Titik Visualisasi Audio**:
  - **Dock Spektrum & Osiloskop**: Kanvas gelombang multi-bar dengan kurva osiloskop dan indikator `dB` (`tabular-nums`) di *control bar* bawah.
  - **HUD Gelombang di Panggung**: Spektrum audio simetris di sudut kiri bawah kanvas siaran (dapat diaktifkan/dinonaktifkan melalui tombol **HUD Gelombang**).
  - **Indikator Suara di Dalam Kamera**: Bar spektrum reaktif di sudut kiri bawah bingkai kamera presenter.
- **Mode Tes Gelombang**: Fitur simulasi sinyal audio untuk menguji animasi gelombang meskipun mikrofon fisik sedang dibisukan.

### 4. Subtitle Otomatis, Layer Melayang, & Perekam Video (`.WEBM`)
- **Live Subtitle & Auto-Transcribe**: Mendukung pengetikan teks manual, baris narasi cepat (*teleprompter*), serta transkripsi suara-ke-teks otomatis (*Web Speech API* Bahasa Indonesia & Inggris).
- **Floating Visual Overlays**: Tambahkan kartu kode/terminal, *widget* web, *lower-third banner*, atau sematkan (*Pin*) komentar penonton dari *live chat* langsung ke atas layar siaran.
- **Perekam Video Komposit (`MediaRecorder`)**: Merekam seluruh kanvas komposisi 1920×1080 beserta audio mikrofon menjadi file video `.webm` yang dapat langsung diputar di modal pratinjau atau diunduh ke perangkat.
- **Multi-Stream RTMP & Live Chat**: Konfigurasi *Stream Key* untuk YouTube Live, Twitch, TikTok Live, serta Zoom/Teams RTMP dengan simulasi penonton dan interaksi komentar langsung.

---

## Teknologi yang Digunakan

- **Frontend Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (`Plus Jakarta Sans` & `JetBrains Mono` dengan dukungan `tabular-nums`)
- **Media & Broadcast Engine**:
  - HTML5 `<canvas>` 2D Real-Time 60 FPS Compositor (1920×1080)
  - `MediaDevices.getDisplayMedia()` & `MediaDevices.getUserMedia()`
  - `MediaRecorder` API (`canvas.captureStream(30)`)
  - Web Audio API (`AudioContext`, `AnalyserNode`)
  - Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
- **Ikonografi**: `lucide-react`

---

## Cara Menjalankan Secara Lokal

1. **Instal dependensi**:
   ```bash
   npm install
   ```

2. **Jalankan server pengembangan (Port 3000)**:
   ```bash
   npm run dev
   ```

3. **Buka di browser**:
   Akses `http://localhost:3000` dan berikan izin akses kamera, mikrofon, atau tangkapan layar saat diminta oleh browser untuk menggunakan perangkat keras asli.

4. **Build untuk produksi**:
   ```bash
   npm run build
   ```

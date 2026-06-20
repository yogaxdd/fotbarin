# Implementasi Plan: Web Photobooth + Custom Frame Community

**Tanggal:** 18 Juni 2026  
**Target awal:** Gen Z, fandom/anime/waifu-husbando, bestie/couple photobooth, dan pengguna yang ingin bikin photo strip cepat tanpa install aplikasi.  
**Platform:** Web app, deploy ke Vercel.  
**Prinsip utama:** foto user tidak disimpan di server. Foto diproses lokal di browser, lalu user download hasilnya.

---

## 1. Ringkasan Produk

Produk yang ingin dibuat adalah web photobooth modern dengan sistem template frame. User bisa langsung foto menggunakan kamera browser, memilih layout, memilih frame, lalu export hasil sebagai PNG/JPEG.

Pembeda utamanya bukan hanya photobooth biasa, tetapi:

- Photobooth berbasis web, tanpa install aplikasi.
- Template frame siap pakai.
- Layout untuk fotbar biasa, fotbar bareng karakter/waifu/husbando, bestie, couple, dan photo strip ala Korean 4-cut.
- Frame editor untuk user premium.
- Community template: user free bisa memakai frame dari creator premium.
- Privacy-first: foto tidak diupload dan tidak disimpan.

Positioning yang disarankan:

> Bikin photobooth bareng teman, karakter favorit, atau waifu/husbando langsung dari browser. Foto kamu diproses di perangkatmu dan tidak kami simpan.

---

## 2. Kenapa Perlu Diferensiasi

Web photobooth sudah ada cukup banyak. Beberapa kompetitor/referensi sudah menawarkan fitur dasar seperti ambil foto via browser, pilih frame, tambah efek/stiker, dan download hasil.

Contoh referensi pasar:

- BeautyPlus Photo Booth: online webcam, frame, sticker, photo strip.
- Jepreto: photobooth digital dengan template dan creator/community angle.
- Fremio: online photobooth dengan frame, sticker, effect, download.
- Funcam: photobooth langsung dari browser, pilih frame, download tanpa app.

Artinya, produk ini sebaiknya tidak diposisikan sebagai “web photobooth biasa”. Diferensiasi yang lebih kuat adalah:

**Photobooth + custom frame editor + community frame + fandom/fotbar vibe + privacy-first.**

---

## 3. Target User

### Primary user

Gen Z yang suka:

- Foto lucu untuk IG Story/TikTok.
- Fandom/anime/K-pop/game.
- Photocard, photo strip, scrapbook, Y2K, sticker aesthetic.
- Fotbar online dengan teman, pasangan, atau karakter favorit.
- Tools cepat, mobile-first, tidak ribet login.

### Secondary user

- Creator template/frame.
- Fanbase kecil yang ingin bikin template event.
- Panitia acara kecil, ulang tahun, gathering, komunitas.
- User yang ingin bikin frame custom tanpa software desain berat.

---

## 4. Model User dan Akses Fitur

### 4.1 User anonim / free tanpa login

Bisa:

- Buka kamera.
- Pilih layout/template bawaan.
- Pakai frame public dari community.
- Ambil foto.
- Retake foto.
- Export/download hasil.

Tidak bisa:

- Save frame custom.
- Publish frame ke community.
- Like/favorite/report jika fitur ini dibatasi untuk user login.
- Mengakses fitur creator premium.

### 4.2 User login free

Bisa:

- Semua fitur anonim.
- Login Google.
- Favorite frame.
- Riwayat frame yang disukai.
- Report frame community.
- Mungkin simpan preferensi kecil seperti default mirror setting.

Tidak bisa:

- Publish custom frame.
- Save private custom frame.
- Upload asset frame custom.

### 4.3 User premium

Bisa:

- Semua fitur free.
- Membuat frame sendiri.
- Mengatur posisi dan ukuran kotak foto.
- Menambah background, text, sticker, shape, asset upload.
- Save frame private.
- Publish frame ke community.
- Remix frame orang lain jika diizinkan.
- Melihat analytics sederhana: jumlah pemakaian, like, favorite.
- Mendapat badge creator/premium.

---

## 5. Fitur MVP

Prioritas MVP adalah membuat pengalaman photobooth yang cepat, lucu, dan shareable.

### 5.1 Layout picker

Layout awal yang perlu disediakan:

1. 4-cut vertical classic.
2. 3-cut vertical.
3. 2x2 grid.
4. 1 foto besar + 3 foto kecil.
5. Couple/bestie layout.
6. Character side-by-side layout.
7. Photocard layout.
8. Polaroid grid.
9. Black film strip.
10. Soft pastel Korean booth.

### 5.2 Camera capture

Fitur wajib:

- Request kamera via browser.
- Countdown 3 detik.
- Ambil 1-4 foto sesuai layout.
- Retake per slot.
- Flash animation.
- Switch camera untuk mobile.
- Upload photo fallback jika kamera tidak bisa dibuka.
- Camera permission error handling.

### 5.3 Mirror setting

Request penting dari teman: kamera jangan mirror.

Rekomendasi UX:

- Preview mirror: ON/OFF.
- Final export mirror: OFF by default.

Teknis:

- Untuk preview mirror, gunakan CSS `transform: scaleX(-1)`.
- Untuk hasil export, gambar ke canvas tanpa flip kecuali user memang memilih opsi mirror final.

Alasan:

- Banyak user nyaman melihat preview seperti cermin.
- Tetapi hasil akhir biasanya tidak boleh kebalik, terutama kalau ada tulisan di baju, background, atau poster.

### 5.4 Frame renderer

Semua frame harus berbasis JSON agar scalable. Jangan hardcode layout satu per satu.

Contoh struktur data:

```ts
type FrameTemplate = {
  id: string;
  name: string;
  description?: string;
  canvas: {
    width: number;
    height: number;
    backgroundColor?: string;
  };
  slots: PhotoSlot[];
  layers: FrameLayer[];
  tags: string[];
  visibility: "private" | "public";
};

type PhotoSlot = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  rotation?: number;
  fit: "cover" | "contain";
  zIndex: number;
};

type FrameLayer =
  | {
      type: "text";
      id: string;
      text: string;
      x: number;
      y: number;
      fontSize: number;
      fontFamily: string;
      color: string;
      zIndex: number;
    }
  | {
      type: "image";
      id: string;
      src: string;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation?: number;
      zIndex: number;
    }
  | {
      type: "shape";
      id: string;
      shape: "rect" | "circle" | "line";
      x: number;
      y: number;
      width?: number;
      height?: number;
      fill?: string;
      stroke?: string;
      radius?: number;
      zIndex: number;
    };
```

### 5.5 Export dan share

Fitur export:

- Download PNG.
- Download JPEG.
- Pilihan kualitas export.
- Rasio siap pakai:
  - Photo strip vertical.
  - IG Story / TikTok 9:16.
  - Feed 4:5.
  - Square 1:1.

Catatan penting:

- Jangan upload hasil foto ke server.
- Export dilakukan dari canvas di browser.
- Setelah user selesai, clear captured photos dari memory.

### 5.6 Community frame basic

MVP community:

- Explore page.
- Search frame.
- Filter tag.
- Sort by newest, trending, most used.
- Like/favorite.
- Report.
- Frame detail page.
- Use this frame CTA.

---

## 6. Fitur Premium

Premium harus terasa sebagai creator unlock, bukan sekadar paywall download.

Fitur premium yang disarankan:

- Custom frame editor.
- Save private frame.
- Publish frame to community.
- Upload custom asset/sticker/frame overlay.
- More export quality.
- Remove watermark, jika watermark dipakai di free.
- Remix frame orang lain.
- Creator profile.
- Badge premium/creator.
- Analytics sederhana:
  - Berapa kali frame dipakai.
  - Jumlah like.
  - Jumlah favorite.
  - Trending rank.

Prinsip pricing:

- Free tetap harus enak dipakai karena free user adalah distribusi organik.
- Premium fokus ke creator, customization, dan community contribution.

Contoh pricing awal:

- Free: pakai template bawaan/community + download.
- Premium monthly: Rp15.000 - Rp29.000.
- Premium yearly: diskon.
- Early creator lifetime: harga promo untuk 50-100 user pertama.

---

## 7. Stack Teknis yang Disarankan

### 7.1 Frontend dan framework

Gunakan:

- Next.js App Router.
- React.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Zustand atau Jotai untuk state client.

Alasan:

- Next.js cocok untuk app React modern dan mudah dideploy ke Vercel.
- Vercel punya integrasi native untuk Next.js.
- TypeScript membantu menjaga struktur frame JSON agar tidak gampang rusak.

### 7.2 Kamera

Gunakan browser API:

- `navigator.mediaDevices.getUserMedia()`.

Catatan:

- API kamera membutuhkan secure context seperti HTTPS atau localhost.
- Vercel sudah cocok karena deployment production memakai HTTPS.

### 7.3 Canvas/editor

Pilihan utama:

- Fabric.js.

Alasan:

- Mendukung object model di atas HTML canvas.
- Cocok untuk editor drag, resize, rotate, text, image, shape.
- Mendukung serialization, sehingga desain frame bisa disimpan sebagai JSON.

Alternatif:

- Konva, jika ingin editor lebih ringan dan terstruktur.
- Canvas manual, hanya untuk renderer sederhana, bukan editor kompleks.

Rekomendasi:

- MVP renderer bisa canvas manual.
- Editor premium lebih aman pakai Fabric.js.

### 7.4 Auth

Gunakan:

- Firebase Auth.
- Google Sign-In.

Flow:

- Free/anonim bisa langsung pakai web.
- Saat user ingin fitur premium, favorite, publish, atau report, minta login Google.

### 7.5 Database

Gunakan:

- Firestore.

Disimpan:

- User profile minimal.
- Frame JSON.
- Metadata frame.
- Like/favorite/report.
- Subscription status.

Tidak disimpan:

- Foto user.
- Hasil export user.
- Base64 captured image.

### 7.6 Storage

Gunakan:

- Firebase Storage.

Disimpan:

- Asset frame.
- Sticker custom dari creator.
- Thumbnail frame kosong/preview template.

Tidak disimpan:

- Foto hasil jepretan user.
- Hasil akhir photobooth user.

### 7.7 Payment

Pilihan Indonesia:

- Midtrans recurring/subscription.
- Xendit Subscriptions.

Saran awal:

- Untuk beta, bisa mulai tanpa payment otomatis dan manual premium whitelist.
- Setelah validasi demand, integrasikan payment gateway.
- Untuk production, update `plan` user hanya dari server/webhook, jangan dari client.

### 7.8 Analytics

Gunakan:

- Plausible, PostHog, atau Vercel Analytics.

Yang dilacak:

- Landing page view.
- Template used.
- Export clicked.
- Premium CTA clicked.
- Editor opened.
- Frame published.

Yang jangan dilacak:

- Foto user.
- Canvas hasil foto.
- Session replay di halaman kamera/editor.

---

## 8. Arsitektur Aplikasi

### 8.1 Struktur halaman

```txt
/
  Landing page

/shoot
  Camera photobooth flow

/templates
  Template gallery

/templates/[id]
  Template detail + use button

/editor
  Premium custom frame editor

/community
  Explore community frames

/pricing
  Premium pricing

/account
  User account, saved frames, subscription

/admin
  Moderation dashboard, optional
```

### 8.2 Struktur folder Next.js

```txt
app/
  page.tsx
  shoot/page.tsx
  templates/page.tsx
  templates/[id]/page.tsx
  editor/page.tsx
  community/page.tsx
  pricing/page.tsx
  account/page.tsx

components/
  camera/
    CameraPreview.tsx
    CountdownCapture.tsx
    RetakePanel.tsx
  frame/
    FrameRenderer.tsx
    TemplatePicker.tsx
    ExportButton.tsx
  editor/
    FrameEditorCanvas.tsx
    SlotInspector.tsx
    LayerPanel.tsx
    AssetUploader.tsx
  auth/
    LoginButton.tsx
    PremiumGate.tsx

lib/
  firebase.ts
  auth.ts
  firestore.ts
  storage.ts
  frame-types.ts
  frame-renderer.ts
  canvas-utils.ts
  mirror-utils.ts
  privacy-cleanup.ts

store/
  shoot-store.ts
  editor-store.ts
```

---

## 9. Data Model Firestore

### 9.1 Users

```txt
users/{uid}
  displayName: string
  photoURL: string
  email: string
  plan: "free" | "premium"
  role: "user" | "moderator" | "admin"
  createdAt: timestamp
  updatedAt: timestamp
```

### 9.2 Frames

```txt
frames/{frameId}
  ownerId: string
  name: string
  description: string
  layoutJson: object
  thumbnailUrl: string
  visibility: "private" | "public"
  status: "draft" | "pending" | "approved" | "rejected"
  tags: string[]
  likesCount: number
  usesCount: number
  remixOf: string | null
  createdAt: timestamp
  updatedAt: timestamp
```

### 9.3 Favorites

```txt
users/{uid}/favorites/{frameId}
  frameId: string
  createdAt: timestamp
```

### 9.4 Reports

```txt
reports/{reportId}
  frameId: string
  reporterId: string
  reason: string
  status: "open" | "reviewed" | "dismissed" | "actioned"
  createdAt: timestamp
```

### 9.5 Frame usage events

Untuk analytics ringan, bisa pakai agregat saja.

```txt
frameUsage/{frameId}
  usesCount: number
  lastUsedAt: timestamp
```

Atau langsung update `usesCount` di document frame.

---

## 10. Security Rules Konsep

Aturan umum:

- Semua orang boleh membaca frame `public` dengan status `approved`.
- Owner boleh membaca dan mengedit frame miliknya sendiri.
- Hanya premium user yang boleh membuat frame custom.
- Hanya premium user yang boleh publish frame.
- Hanya admin/moderator yang boleh approve/reject frame.
- Hanya server/webhook yang boleh mengubah `users/{uid}.plan`.
- User login boleh report frame.

Contoh pseudo-rule:

```js
match /frames/{frameId} {
  allow read: if resource.data.visibility == "public"
              && resource.data.status == "approved";

  allow create: if request.auth != null
                && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.plan == "premium";

  allow update, delete: if request.auth != null
                        && resource.data.ownerId == request.auth.uid;
}
```

Catatan:

- Security rules final perlu dites pakai Firebase Emulator.
- Jangan percaya data `plan` dari client.
- Payment webhook harus berjalan di server/API route/Cloud Function.

---

## 11. Privacy Plan

Privacy adalah fitur jualan utama.

### 11.1 Data yang tidak boleh disimpan

- Foto hasil kamera user.
- Hasil export photo strip user.
- Base64 image user.
- Screenshot editor yang mengandung foto user.
- Session replay halaman kamera/editor.

### 11.2 Data yang boleh disimpan

- Frame/template JSON.
- Asset frame yang diupload creator.
- Thumbnail frame kosong/placeholder.
- Metadata frame.
- Like/favorite/report.
- User profile minimal untuk login.
- Subscription status.

### 11.3 Copy privacy untuk UI

Letakkan di halaman kamera:

> Foto kamu diproses langsung di browser dan tidak kami upload/simpan.

Letakkan di halaman export:

> Setelah kamu menutup halaman ini, foto yang kamu ambil akan hilang dari session browser.

### 11.4 Implementasi teknis privacy

- Simpan captured photo hanya di React state/Zustand memory.
- Jangan simpan ke localStorage/sessionStorage kecuali benar-benar perlu.
- Jangan upload photo blob ke Firebase.
- Jangan kirim image data ke analytics.
- Jangan log base64/blob di console.
- Gunakan `URL.revokeObjectURL()` setelah selesai.
- Clear state setelah export atau saat user klik reset.
- Matikan session replay pada route `/shoot` dan `/editor`.

---

## 12. Frame Editor Plan

Editor premium adalah fitur yang paling kompleks. Jangan dikerjakan sebelum renderer stabil.

### 12.1 Fitur editor versi awal

- Canvas size preset.
- Add photo slot.
- Drag photo slot.
- Resize photo slot.
- Rotate photo slot.
- Set radius/corner rounded.
- Add text.
- Add sticker/image layer.
- Add background color/image.
- Layer ordering.
- Preview dengan placeholder.
- Save draft.
- Publish to community.

### 12.2 Fitur editor versi lanjutan

- Snap/grid alignment.
- Lock layer.
- Duplicate layer.
- Group layer.
- Template remix.
- Export frame preview thumbnail.
- Custom font.
- Blend mode/filter.
- Masking photo slot.

### 12.3 UX editor

Panel kiri:

- Add slot.
- Add text.
- Add sticker.
- Upload asset.
- Background.

Canvas tengah:

- Area desain frame.

Panel kanan:

- Inspector untuk selected object:
  - X/Y.
  - Width/height.
  - Rotation.
  - Radius.
  - Color.
  - Z-index.

Bottom/top bar:

- Save draft.
- Preview.
- Publish.

---

## 13. Moderation dan Community Safety

Karena user premium bisa upload/publish frame, harus ada basic moderation.

Risiko:

- NSFW.
- Hate/offensive content.
- Spam.
- Copyrighted assets.
- Impersonation.
- Frame yang sengaja misleading.

Fitur safety minimum:

- Report button.
- Frame status: draft, pending, approved, rejected.
- Admin/moderator page.
- Takedown manual.
- Community guidelines.
- Limit upload size.
- Limit file type: PNG, JPG, SVG jika aman, WebP.
- Optional: auto-moderation untuk image asset ke depannya.

Catatan copyright:

- Untuk template bawaan, hindari pakai karakter anime/game resmi tanpa izin.
- Lebih aman menyediakan layout/slot untuk user mengupload karakter sendiri secara personal.
- Community frame harus punya mekanisme report dan takedown.

---

## 14. Template Awal yang Perlu Disiapkan

Minimal siapkan 20 template sebelum launch beta:

1. 4-cut classic white.
2. 4-cut classic black.
3. Korean Life4Cuts pastel pink.
4. Korean Life4Cuts pastel blue.
5. 3-cut vertical soft.
6. 2x2 bestie grid.
7. Couple heart frame.
8. Character side-by-side.
9. Photocard idol style.
10. Polaroid stack.
11. Sticker bomb Y2K.
12. Dark anime vibe.
13. Magazine cover.
14. Scrapbook beige.
15. Birthday frame.
16. School/yearbook frame.
17. Minimal clean white.
18. Cute pixel frame.
19. Date stamp film frame.
20. Seasonal/event frame.

Template awal penting karena:

- User akan menilai produk dari first impression.
- Community belum ada di awal, jadi supply template harus disediakan sendiri.
- Template yang bagus lebih mudah viral daripada fitur teknisnya.

---

## 15. Roadmap Implementasi

### Phase 1: Prototype kamera dan export

Estimasi: 2-4 hari.

Deliverable:

- `/shoot` page.
- Kamera browser aktif.
- Preview kamera.
- Countdown capture.
- Ambil 4 foto.
- Render ke photo strip vertical.
- Download PNG.
- Tidak ada login.
- Tidak ada database.
- Foto hanya di memory.

Acceptance criteria:

- User bisa membuka web, izinkan kamera, ambil 4 foto, dan download hasil.
- Hasil final tidak mirror by default.
- Bisa retake foto.

### Phase 2: MVP layout dan template

Estimasi: 5-10 hari.

Deliverable:

- Layout picker.
- 5-10 starter templates.
- Mirror preview toggle.
- Switch camera mobile.
- Upload photo fallback.
- Export ratio.
- Basic mobile responsive.

Acceptance criteria:

- User bisa memilih minimal 5 template.
- User bisa pakai HP dan desktop.
- User bisa export hasil yang terlihat rapi.

### Phase 3: Frame engine JSON

Estimasi: 5-7 hari.

Deliverable:

- `FrameTemplate` schema.
- Renderer dari JSON ke canvas.
- Slot mapping foto.
- Layer background/text/image/shape.
- Template seed data.

Acceptance criteria:

- Semua template bawaan memakai JSON yang sama.
- Menambah template baru tidak perlu bikin komponen baru.

### Phase 4: Custom frame editor premium

Estimasi: 7-14 hari.

Deliverable:

- Editor canvas.
- Drag/resize photo slot.
- Add text/sticker/background.
- Save frame JSON.
- Preview frame.
- Export thumbnail frame.

Acceptance criteria:

- Premium user bisa membuat frame baru dari nol.
- Frame bisa dipakai di `/shoot`.

### Phase 5: Auth dan community

Estimasi: 5-10 hari.

Deliverable:

- Firebase Auth Google.
- Firestore users/frames.
- Community explore page.
- Like/favorite/report.
- Public/private frame.
- Moderation status.

Acceptance criteria:

- User login bisa favorite/report.
- Premium creator bisa publish frame.
- Free user bisa memakai frame approved dari community.

### Phase 6: Premium/payment

Estimasi: 3-7 hari.

Deliverable:

- Pricing page.
- Payment gateway integration.
- Webhook update subscription.
- Premium gate.
- Account page.

Acceptance criteria:

- User bisa upgrade premium.
- `plan` user berubah lewat webhook/server.
- Fitur premium terkunci untuk non-premium.

### Phase 7: Polish dan launch beta

Estimasi: 3-7 hari.

Deliverable:

- Landing page.
- SEO metadata.
- Error states.
- Loading states.
- Mobile Safari testing.
- Privacy copy.
- Community guidelines.
- Template seed 20+.
- Launch content untuk TikTok/IG.

Acceptance criteria:

- Produk siap dicoba public beta.
- Tidak ada bug fatal pada kamera/export.
- User paham bahwa foto tidak disimpan.

---

## 16. Estimasi Timeline

Jika coding dibantu AI agent dan scope dikunci:

- Prototype: 2-4 hari.
- MVP usable: 1-2 minggu.
- Beta dengan auth/community/editor basic: 3-6 minggu.
- Versi lebih mature dengan payment dan moderation: 1-2 bulan.

Bagian yang paling rawan makan waktu:

- Camera behavior di berbagai browser/mobile.
- Canvas export quality.
- Editor drag/resize/serialization.
- Firestore security rules.
- Payment webhook.
- Moderation flow.

---

## 17. Prompt untuk AI Agent

### 17.1 Prompt prototype

```txt
Build a Next.js TypeScript web photobooth app.

Requirements:
- Use App Router, Tailwind, shadcn/ui.
- Implement /shoot page.
- Request camera using navigator.mediaDevices.getUserMedia.
- Show live camera preview.
- Add optional mirror preview toggle.
- Final exported image must not be mirrored by default.
- Add countdown capture for 4 shots.
- Allow retake per slot.
- Render selected photos into a vertical 4-cut photo strip using canvas.
- Export as PNG.
- Do not upload or persist photos anywhere.
- Keep captured photos only in client memory.
- Add a basic layout JSON system with slots.
- Create 3 starter layouts.
- Make the UI mobile-first.
```

### 17.2 Prompt frame engine

```txt
Add a frame template engine.

A frame template contains:
- canvas size
- photo slots
- background layer
- text layers
- image/sticker layers
- shape layers

Create a renderer function that receives FrameTemplate + captured photos and outputs a canvas/blob.
Add a template picker page and 10 sample templates.
All templates must be data-driven JSON, not hardcoded components.
```

### 17.3 Prompt auth dan community

```txt
Add Firebase Auth with Google login.

Add Firestore collections for:
- users
- frames
- favorites
- reports

Rules:
- Only store frame templates, metadata, and frame assets.
- Never store user captured photos or exported photobooth results.
- Anonymous users can use approved public frames.
- Logged-in users can favorite and report frames.
- Premium users can create, save, and publish frames.

Create a community explore page with search, tags, newest, trending, and most used sorting.
```

### 17.4 Prompt editor premium

```txt
Build a premium frame editor using Fabric.js.

Features:
- Create a new frame template.
- Set canvas size.
- Add photo slots.
- Drag, resize, rotate photo slots.
- Set border radius for slots.
- Add text layers.
- Add image/sticker layers.
- Add background color or background image.
- Reorder layers.
- Save editor state as FrameTemplate JSON.
- Generate a frame thumbnail without user photos.
- Publish frame to community if user is premium.
```

### 17.5 Prompt privacy audit

```txt
Audit the app for privacy.

Requirements:
- Captured photos must only exist in browser memory.
- No captured photo may be uploaded to Firebase, analytics, logs, or server routes.
- No captured photo may be saved to localStorage/sessionStorage.
- Export must happen locally using canvas.
- Clear captured photo state after reset/export.
- Revoke object URLs after use.
- Add privacy copy to /shoot and export screens.
```

---

## 18. Checklist yang Harus Disiapkan

### 18.1 Branding

- Nama produk.
- Logo sederhana.
- Warna utama.
- Font.
- Tone UI: kawaii, clean Korean, Y2K, scrapbook, atau anime dark.
- Copywriting singkat.

### 18.2 Legal dan policy

- Privacy Policy.
- Terms of Service.
- Community Guidelines.
- Takedown/report process.
- Disclaimer bahwa user bertanggung jawab atas asset yang diupload/publish.

### 18.3 Technical account

- GitHub repo.
- Vercel account.
- Firebase project.
- Firebase Auth Google provider.
- Firestore.
- Firebase Storage.
- Payment gateway sandbox.
- Domain.
- Analytics.
- Email support.

### 18.4 Content/template

- Minimal 20 template launch.
- 5 template yang sangat shareable untuk konten TikTok.
- Thumbnail template.
- Tag template.
- Demo result image, tanpa memakai foto orang tanpa izin.

### 18.5 Testing device

Test minimal di:

- Chrome desktop.
- Edge desktop.
- Chrome Android.
- Safari iPhone.
- Browser dengan camera permission denied.
- Device tanpa kamera.
- Koneksi lambat.

---

## 19. Nama Web yang Disarankan

### Nama yang terasa lokal Indonesia

1. **Fotbarin** — paling cocok untuk market Indonesia, mudah diingat, langsung kebayang “fotbar”.
2. **FrameBar** — frame + fotbar, terdengar seperti platform template.
3. **PictBar** — picture + fotbar.
4. **KomaKita** — unik, terasa seperti panel/komik/photo strip.
5. **JepretBar** — jelas, lokal, santai.

### Nama yang lebih global

1. **Boothmate** — cocok untuk konsep foto bareng teman/karakter.
2. **SnapStrip** — jelas untuk photo strip.
3. **PosePals** — lucu, social, cocok untuk Gen Z.
4. **Cutly Booth** — cute, mengarah ke 4-cut.
5. **Framefie** — frame + selfie.

### Nama yang fandom/anime-oriented

1. **CharaBooth** — jelas untuk karakter/waifu/husbando.
2. **WaifuFrame** — niche, kuat untuk anime, tapi mungkin terlalu sempit.
3. **OshiBooth** — cocok untuk idol/K-pop/anime oshi culture.
4. **FandomFrame** — jelas, tapi agak panjang.
5. **PoseWith** — fleksibel untuk “pose with anyone”.

Rekomendasi final:

- Untuk market Indonesia: **Fotbarin**.
- Untuk market global: **Boothmate**.
- Untuk positioning community frame: **FrameBar**.
- Untuk fandom-heavy: **CharaBooth** atau **OshiBooth**.

---

## 20. Strategi Launch

Jangan launch dengan angle “ini web photobooth”. Launch dengan angle yang lebih emosional dan shareable:

> Bikin photobooth bareng waifu/husbando/oshi/karakter favorit langsung dari browser. Tanpa app. Foto tidak disimpan.

### 20.1 Konten TikTok/IG awal

Ide konten:

1. “Aku bikin web buat photobooth bareng karakter favorit.”
2. “POV: photobooth sama waifu/husbando tanpa install app.”
3. “Foto kamu nggak diupload, hasilnya langsung download.”
4. “Bikin frame fotbar sendiri terus orang lain bisa pakai.”
5. “Drop karakter yang harus kubuatin template-nya.”
6. “Free template community photobooth.”
7. “No mirror export test.”

### 20.2 Growth loop

Growth loop produk:

1. User pakai template.
2. User download hasil.
3. User post ke TikTok/IG.
4. Viewer penasaran dan buka link.
5. Viewer pakai template juga.
6. Creator premium bikin frame baru.
7. Community frame makin banyak.
8. Free user makin sering kembali.

### 20.3 CTA yang kuat

- “Use this frame.”
- “Bikin versi kamu.”
- “Remix frame ini.”
- “Share frame ke community.”
- “Foto tidak kami simpan.”

---

## 21. Risiko dan Mitigasi

### Risiko 1: Photobooth trend menurun

Mitigasi:

- Jangan bergantung pada trend photobooth saja.
- Fokus ke template community dan fandom personalization.
- Buat seasonal/event template.

### Risiko 2: Terlalu banyak fitur di awal

Mitigasi:

- MVP harus sederhana: camera, 4-cut, template, export.
- Editor dan payment dikerjakan setelah renderer stabil.

### Risiko 3: Masalah privasi

Mitigasi:

- Jangan simpan foto.
- Jangan analytics image data.
- Jelaskan privacy di UI.
- Audit route kamera/editor.

### Risiko 4: Konten community bermasalah

Mitigasi:

- Publish butuh login/premium.
- Frame public masuk pending dulu.
- Report dan takedown.
- Admin moderation.

### Risiko 5: Copyright karakter

Mitigasi:

- Template bawaan jangan memakai karakter resmi tanpa izin.
- Sediakan slot/upload pribadi untuk user.
- Community guidelines jelas.
- Report/takedown cepat.

### Risiko 6: Kamera bermasalah di mobile

Mitigasi:

- Test banyak device.
- Sediakan upload fallback.
- Error handling permission.
- Switch camera.

---

## 22. Definisi Sukses MVP

MVP dianggap sukses jika:

- User bisa membuat hasil photobooth dalam kurang dari 1 menit.
- User bisa download tanpa login.
- Hasil export tidak mirror by default.
- Template terlihat bagus di mobile.
- Foto tidak pernah masuk server/storage.
- Minimal 20 template tersedia.
- Ada beberapa user yang mau share hasil ke IG/TikTok.
- Ada sinyal bahwa user ingin membuat frame sendiri.

Metric awal yang bisa dipantau:

- Landing page visits.
- Start shooting clicks.
- Completed photo sessions.
- Export/download clicks.
- Template usage count.
- Premium/editor CTA clicks.
- Community frame views.
- Returning users.

---

## 23. Next Action Paling Dekat

Urutan kerja yang paling disarankan:

1. Tentukan nama sementara, misalnya **Fotbarin** atau **FrameBar**.
2. Buat repo Next.js + Tailwind + shadcn/ui.
3. Buat `/shoot` prototype kamera.
4. Implement 4-cut canvas export.
5. Pastikan no-mirror export.
6. Tambah 5 template JSON.
7. Test di mobile.
8. Buat landing page sederhana.
9. Launch mini beta ke teman dekat.
10. Baru lanjut editor premium dan community.

---

## 24. Referensi Teknis dan Pasar

### Official technical references

- Next.js App Router docs: https://nextjs.org/docs/app
- Vercel Next.js docs: https://vercel.com/docs/frameworks/full-stack/nextjs
- MDN `getUserMedia()`: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- Firebase Auth: https://firebase.google.com/docs/auth/
- Firebase Auth + Security Rules: https://firebase.google.com/docs/rules/rules-and-auth
- Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started
- Firebase Storage web upload docs: https://firebase.google.com/docs/storage/web/upload-files
- Fabric.js: https://fabricjs.com/
- Midtrans recurring payment: https://midtrans.com/features/recurring-payment
- Midtrans Create Subscription API: https://docs.midtrans.com/reference/create-subscription
- Xendit Subscriptions: https://www.xendit.co/en-id/products/subscriptions/

### Market/reference examples

- BeautyPlus Photo Booth: https://www.beautyplus.com/photo-booth
- Jepreto: https://jepreto.com/
- Fremio: https://fremio.id/
- Funcam: https://funcam.id/
- Canva photo booth templates: https://www.canva.com/templates/s/photo-booth/

---

## 25. Kesimpulan

Ide ini masih layak, tetapi harus punya pembeda yang jelas. Jangan hanya membuat photobooth online biasa. Fokus pada kombinasi:

**Cepat dipakai + template lucu + custom frame editor + community frame + privacy-first.**

MVP jangan terlalu besar. Buat dulu flow paling penting: buka kamera, ambil foto, pilih template, export. Setelah itu baru bangun frame engine, editor premium, community, dan payment.

Kalau dieksekusi dengan scope yang ketat dan AI agent yang diarahkan dengan prompt jelas, versi MVP bisa dibuat cepat. Tantangan utamanya bukan sekadar coding, tetapi kualitas template, UX mobile, privasi, dan alasan kenapa user mau balik lagi.

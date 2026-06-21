# Fotbarin

Fotbarin adalah web photobooth privacy-first untuk membuat photo strip langsung dari browser. User bisa ambil foto, pilih frame/template, memakai frame komunitas, dan export hasil PNG tanpa upload foto pribadi ke server.

## Fitur Utama

| Area | Status | Ringkasan |
|---|---:|---|
| Browser photobooth | ✅ | Ambil foto dari kamera browser, retake slot, upload fallback, dan export PNG. |
| Template bawaan | ✅ | Theme bawaan seperti Rose Studio, Sky Receipt, Matcha Frame, Classic White, Ink Film, dan Lavender Note. |
| Community frame | ✅ | Frame yang dipublish dari editor tampil di halaman Community dan bisa dibuka detailnya. |
| Custom frame editor | ✅ | Editor standalone ala Canva untuk upload photostrip PNG transparan, tambah photo box, text, sticker, dan publish. |
| Premium upload frame | ✅ | User premium/admin bisa upload photostrip PNG/WebP custom sebagai overlay frame. |
| Admin otomatis premium | ✅ | `isAdmin: true` otomatis dianggap premium. |
| Pricing trial/mock premium | ✅ | Trial 1 hari dan tombol Beli Premium mock/gratis sementara sampai payment gateway siap. |
| Payment gateway | 🚧 | Belum terhubung, tombol beli masih mock activation. |

## Flow Utama

```text
Frame Editor → Publish → Community → Detail Frame → Buat dengan template ini → Shoot → Export PNG
```

## Recap 21 Juni 2026

| No | Bagian | Yang Dikerjakan | File Utama |
|---:|---|---|---|
| 1 | Frame editor | Editor dipisah dari dashboard menjadi workspace clean ala Canva: topbar, tool rail, canvas kosong, panel properties. | `components/frame/FrameEditorClient.tsx` |
| 2 | Upload photostrip | Upload PNG/WebP transparan premium jadi overlay depan dan otomatis membuat 3 photo slot di belakang frame. | `components/frame/FrameEditorClient.tsx` |
| 3 | Layer system | Tambah layer `frame`, urutan render: slot → text/sticker → frame overlay. | `components/frame/FrameEditorClient.tsx`, `lib/community-frames.ts` |
| 4 | Properties panel | Fix panel properties yang overflow/amburadul: lebar 320px, input transform full width, overflow-x hidden. | `components/frame/FrameEditorClient.tsx` |
| 5 | Community cards | Card frame di Community dibuat clickable dan keyboard accessible. | `components/frame/PublishedFrameCard.tsx`, `app/community/page.tsx` |
| 6 | Detail modal | Klik frame membuka modal berisi preview, creator, username, judul, deskripsi, jumlah slot, canvas, dan CTA. | `app/community/page.tsx` |
| 7 | Use template | Tombol “Buat dengan template ini” menyimpan frame pilihan dan mengarahkan ke `/shoot`. | `app/community/page.tsx`, `lib/community-frames.ts` |
| 8 | Shoot integration | `/shoot` membaca frame Community terpilih, menampilkan selected frame, slot count ikut template, dan export pakai frame custom. | `components/camera/ShootClient.tsx` |
| 9 | Renderer custom frame | Tambah renderer untuk menggambar photo slot, text, sticker, dan overlay PNG frame komunitas. | `lib/frame-renderer.ts` |
| 10 | Pricing | Trial memakai `setDoc(..., { merge: true })`; kalau trial sudah dipakai, CTA jadi “Beli Premium” mock/gratis 30 hari. | `app/pricing/page.tsx` |
| 11 | Premium admin | Admin otomatis dianggap premium. | `components/auth/AuthProvider.tsx` |
| 12 | Recap file | Catatan pekerjaan disimpan sebagai `recap-21-juni.txt`. | `recap-21-juni.txt` |

## Struktur Penting

| Path | Fungsi |
|---|---|
| `app/community/page.tsx` | Halaman komunitas, list frame terbaru, modal detail frame, dan aksi pakai template. |
| `app/pricing/page.tsx` | Halaman harga, trial premium, dan mock beli premium. |
| `components/camera/ShootClient.tsx` | Flow kamera, slot foto, pemilihan frame, preview, dan export. |
| `components/frame/FrameEditorClient.tsx` | Editor custom frame standalone. |
| `components/frame/PublishedFrameCard.tsx` | Preview/card frame komunitas. |
| `components/auth/AuthProvider.tsx` | Auth state, premium/admin logic. |
| `lib/community-frames.ts` | Tipe dan localStorage untuk published/community frame. |
| `lib/frame-renderer.ts` | Renderer photo strip bawaan dan frame komunitas. |

## Catatan Development

```bash
npm run dev
npm run build
```

Jika browser masih menampilkan UI lama setelah edit besar, lakukan hard refresh atau restart dev server.

## Next Improvements

| Prioritas | Ide | Catatan |
|---:|---|---|
| P1 | Auto-detect transparent holes | Baca alpha channel PNG untuk menemukan slot transparan otomatis, bukan preset 3 slot. |
| P1 | Payment gateway | Ganti mock “Beli Premium” dengan PG asli. |
| P2 | Backend frame storage | Simpan frame ke database/storage, bukan hanya localStorage. |
| P2 | Mobile editor polish | Panel editor perlu dibuat lebih nyaman untuk layar kecil. |
| P3 | Template analytics | Track frame paling sering dipakai/trending. |

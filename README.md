# Sistem Pengurusan Aset HTAR

Sistem pengurusan aset digital untuk Jabatan Kecemasan & Trauma Hospital Tengku Ampuan Rahimah (HTAR).

## 📋 Fitur Utama

✅ **Dashboard Interaktif** - Statistik aset real-time  
✅ **Pengurusan Aset Perubatan** - Ventilator, monitor, defibrillator, dll.  
✅ **Pengurusan Aset Bukan Perubatan** - Komputer, perabot, kenderaan  
✅ **Sistem PPM (Penyelenggaraan Pencegahan)** - Notifikasi automatik  
✅ **Laporan & Analitik** - Chart, eksport Excel/PDF  
✅ **Google Sheets Integration** - Penyimpanan data cloud  
✅ **Multi-user Login** - Sistem keselamatan  
✅ **Responsive Design** - Mobile & desktop friendly  

## 🚀 Cara Deploy ke Netlify

### Langkah 1: Siapkan File
1. Buat folder baru bernama `sistem-aset-htarbin`
2. Copy semua file di atas ke dalam folder tersebut

### Langkah 2: Setup Google Sheets
1. Buka [sheets.new](https://sheets.new)
2. Klik **Extensions > Apps Script**
3. Hapus semua kode, paste kode dari `appsscript.js`
4. Klik **Save** (beri nama: `HTAR Asset System`)
5. Klik **Deploy > New deployment**
6. Pilih **Web app**
7. Set:
   - Description: `HTAR Asset Management API`
   - Execute as: `Me`
   - Who has access: `Anyone` (untuk testing) atau `Anyone with Google account`
8. Klik **Deploy**
9. **SALIN URL** yang diberikan (contoh: `https://script.google.com/macros/s/.../exec`)
10. Buka file `script.js`, cari line ini:
    ```javascript
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwA9ymZdaAD3rf98fxR9dnpShJsqDxaFiBhCkLIFTAKEQouxFNDxzhW8fDPycTbN3Ic/exec";
    ```
11. Ganti dengan URL Anda

### Langkah 3: Deploy ke Netlify
**Pilihan A: Drag & Drop (Paling Mudah)**
1. Buka [app.netlify.com](https://app.netlify.com)
2. Login dengan GitHub/Google/email
3. Drag folder `sistem-aset-htarbin` ke area "Drag and drop your site folder here"
4. Tunggu deploy selesai
5. Dapat URL: `https://your-site-name.netlify.app`

**Pilihan B: GitHub (Rekomendasi)**
1. Buat repository GitHub baru
2. Upload semua file ke repository
3. Di Netlify, klik **Add new site > Import an existing project**
4. Pilih GitHub, authorize, pilih repository
5. Klik **Deploy site**

### Langkah 4: Testing
1. Buka URL Netlify Anda
2. Login dengan:
   - Username: `admin`
   - Password: `@klang41200@`
3. Tambah aset percubaan
4. Periksa Google Sheets Anda - data sepatutnya muncul

## 🔧 Troubleshooting

### Issue: CORS Error
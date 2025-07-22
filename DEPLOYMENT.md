## 🚀 Panduan Deploy

### **Persiapan**

1. **Siapkan Google Account dengan akses ke:**
   - Google Apps Script
   - Google Drive
   - Google Sheets
   - Gemini API

2. **Dapatkan Gemini API Key:**
   - Kunjungi [Google AI Studio](https://aistudio.google.com/)
   - Buat API key baru
   - Simpan API key dengan aman

### **Langkah Deploy**

#### Step 1: Setup Google Sheets
1. Buat Google Sheets baru
2. Rename menjadi "Document Regulatory Database"
3. Catat Spreadsheet ID dari URL
4. Script akan otomatis membuat sheet yang diperlukan

#### Step 2: Setup Google Drive
1. Buat folder baru di Google Drive
2. Rename menjadi "Regulatory Documents Storage"
3. Catat Folder ID dari URL
4. Set sharing permissions sesuai kebutuhan

#### Step 3: Deploy Apps Script

1. **Buka Google Apps Script:**
   ```
   https://script.google.com/
   ```

2. **Buat Project Baru:**
   - Klik "New Project"
   - Rename project: "Document Regulatory API"

3. **Copy Script:**
   - Hapus kode default
   - Copy seluruh script ke editor
   - Save project (Ctrl+S)

4. **Konfigurasi:**
   ```javascript
   const CONFIG = {
     GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE',
     GEMINI_MODEL: 'gemini-2.0-flash',
     SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',
     FOLDER_ID: 'YOUR_DRIVE_FOLDER_ID_HERE',
     // ... other config
   };
   ```

5. **Enable APIs:**
   - Klik "Libraries" di sidebar
   - Tambahkan library yang diperlukan (jika ada)
   - Enable Google Drive API di Google Cloud Console

6. **Deploy as Web App:**
   - Klik "Deploy" > "New deployment"
   - Type: "Web app"
   - Execute as: "Me"
   - Who has access: "Anyone" (untuk public API)
   - Klik "Deploy"

7. **Copy Web App URL:**
   ```
   https://script.google.com/macros/s/{SCRIPT_ID}/exec
   ```

#### Step 4: Testing

1. **Test Health Endpoint:**
   ```bash
   curl "https://script.google.com/macros/s/{SCRIPT_ID}/exec?action=health"
   ```

2. **Test dengan Sample Document:**
   - Upload sample PDF melalui API
   - Cek hasil di Google Sheets
   - Verifikasi file tersimpan di Drive

#### Step 5: Security & Monitoring

1. **API Security:**
   - Pertimbangkan implementasi API key authentication
   - Set rate limiting jika diperlukan
   - Monitor usage melalui logs

2. **Backup:**
   - Backup script secara berkala
   - Export Google Sheets data
   - Monitor Google Drive storage

### **Troubleshooting Deploy**

**Error: "Script function not found"**
- Pastikan function names sesuai
- Check syntax errors
- Reload Apps Script editor

**Error: "Permission denied"**
- Check script permissions
- Reauthorize APIs
- Verify sharing settings

**Error: "Gemini API not working"**
- Verify API key validity
- Check API quotas
- Enable Gemini API in Console

**Error: "Sheets/Drive access failed"**
- Check IDs validity
- Verify permissions
- Test manual access

---

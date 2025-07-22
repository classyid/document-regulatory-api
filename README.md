# 🏛️ Document Regulatory API

> Automated Indonesian legal document analysis system powered by Google Apps Script and Gemini AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?logo=google&logoColor=white)](https://script.google.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)

## 🎯 Overview

Document Regulatory API adalah sistem otomatis untuk menganalisis dan mengekstrak metadata dari dokumen peraturan/regulasi Indonesia. Sistem ini menggunakan AI (Google Gemini) untuk memproses dokumen PDF dan gambar, lalu menyimpan data terstruktur ke Google Sheets dengan akses melalui RESTful API.

## ✨ Features

- 🤖 **AI-Powered Analysis** - Gemini 2.0 Flash untuk ekstraksi metadata
- 📄 **Multi-Format Support** - PDF, JPG, PNG, GIF
- 🔍 **Smart Document Recognition** - Deteksi otomatis dokumen peraturan
- 📊 **Structured Data Extraction** - 15 field metadata terstruktur
- 🚀 **RESTful API** - Complete CRUD operations
- 📈 **Analytics & Statistics** - Dashboard dan reporting
- 🔍 **Advanced Search** - Full-text search capabilities
- 📝 **Activity Logging** - Comprehensive audit trail

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client Apps   │ => │  Apps Script API │ => │   Gemini AI     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                       ┌────────┴────────┐
                       │                 │
                ┌──────▼──────┐   ┌──────▼──────┐
                │ Google      │   │ Google      │
                │ Sheets      │   │ Drive       │
                │ (Database)  │   │ (Storage)   │
                └─────────────┘   └─────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Google Account
- Google Drive access
- Gemini API key

### Setup

1. **Clone or copy the script**
2. **Configure constants in CONFIG object**
3. **Set up Google Sheets and Drive folder**
4. **Deploy as web app**

Detailed setup instructions in [DEPLOYMENT.md](DEPLOYMENT.md)

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | System health check |
| POST | `/upload` | Upload and analyze document |
| GET | `/documents` | List documents with pagination |
| GET | `/document` | Get single document details |
| GET | `/search` | Search documents |
| GET | `/stats` | Get system statistics |
| GET | `/logs` | Get system logs |

## 📋 Data Schema

### Document Fields
- Jenis Dokumen
- Nomor Peraturan  
- Tahun Terbit
- Judul/Tentang
- Instansi Penerbit
- Tanggal Ditetapkan
- Tanggal Diundangkan
- Nomor Lembaran Negara
- Nomor Tambahan Lembaran Negara
- Sumber Hukum
- Kata Kunci
- Bidang/Sektor
- Status Dokumen
- Ringkasan Singkat
- Pasal Penting

## 🔧 Configuration

```javascript
const CONFIG = {
  GEMINI_API_KEY: 'your_gemini_api_key',
  GEMINI_MODEL: 'gemini-2.0-flash',
  SPREADSHEET_ID: 'your_spreadsheet_id',
  FOLDER_ID: 'your_drive_folder_id'
};
```

## 📱 Usage Examples

### Upload Document
```javascript
const formData = new FormData();
formData.append('fileData', base64Data);
formData.append('fileName', 'regulation.pdf');
formData.append('mimeType', 'application/pdf');

fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=upload', {
  method: 'POST',
  body: formData
});
```

### Search Documents
```javascript
fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=search&q=OJK&limit=10')
  .then(response => response.json())
  .then(data => console.log(data));
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for document analysis
- Google Apps Script platform
- Indonesian government for open regulation access

## 📞 Support

- 📧 Email: [kontak@classy.id]

```

---

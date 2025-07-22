## 📡 Dokumentasi API Lengkap

### **Base URL**
```
https://script.google.com/macros/s/{SCRIPT_ID}/exec
```

### **Authentication**
API menggunakan Google Apps Script authentication. Pastikan script di-deploy sebagai "Execute as: Me" dan "Who has access: Anyone".

### **Response Format**
Semua response menggunakan format JSON konsisten:

```json
{
  "success": true|false,
  "message": "Success message",
  "data": {},
  "timestamp": "2025-07-22T10:30:00.000Z",
  "version": "1.0.0"
}
```

### **Error Response**
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": 400,
    "timestamp": "2025-07-22T10:30:00.000Z",
    "details": "Additional error details"
  },
  "version": "1.0.0"
}
```

### **Endpoints Detail**

#### 1. **Health Check**
```http
GET /?action=health
```

**Response:**
```json
{
  "success": true,
  "message": "API is healthy",
  "data": {
    "status": "OK",
    "version": "1.0.0",
    "timestamp": "2025-07-22T10:30:00.000Z",
    "services": {
      "gemini": "Connected",
      "spreadsheet": "Connected",
      "drive": "Connected"
    }
  }
}
```

#### 2. **Upload Document**
```http
POST /?action=upload
Content-Type: application/json

{
  "fileData": "base64_encoded_file",
  "fileName": "document.pdf",
  "mimeType": "application/pdf"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Document processed successfully",
  "data": {
    "document": {
      "fileName": "document.pdf",
      "fileUrl": "https://drive.google.com/file/d/...",
      "description": "Extracted document data...",
      "dataSaved": true,
      "processedAt": "2025-07-22T10:30:00.000Z"
    }
  }
}
```

#### 3. **Get Documents**
```http
GET /?action=documents&limit=10&offset=0&type=all
```

**Parameters:**
- `limit` (optional): Number of documents (default: 10)
- `offset` (optional): Pagination offset (default: 0)
- `type` (optional): Filter by document type (default: "all")

**Response:**
```json
{
  "success": true,
  "message": "Retrieved 10 documents",
  "data": {
    "documents": [
      {
        "timestamp": "2025-07-22T10:30:00.000Z",
        "file_name": "document.pdf",
        "jenis_dokumen": "Peraturan OJK",
        "nomor_peraturan": "1/POJK.03/2025",
        "tahun_terbit": "2025",
        "judul_tentang": "Tentang...",
        "instansi_penerbit": "OJK",
        // ... other fields
      }
    ],
    "pagination": {
      "total": 100,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

#### 4. **Get Single Document**
```http
GET /?action=document&fileName=document.pdf
```

**Response:**
```json
{
  "success": true,
  "message": "Document retrieved successfully",
  "data": {
    "document": {
      "timestamp": "2025-07-22T10:30:00.000Z",
      "file_name": "document.pdf",
      "jenis_dokumen": "Peraturan OJK",
      // ... all document fields
    }
  }
}
```

#### 5. **Search Documents**
```http
GET /?action=search&q=OJK&field=all&limit=10
```

**Parameters:**
- `q` (required): Search query
- `field` (optional): Search in specific field (default: "all")
- `limit` (optional): Number of results (default: 10)

**Response:**
```json
{
  "success": true,
  "message": "Found 5 matching documents",
  "data": {
    "results": [
      // Array of matching documents
    ],
    "total": 5,
    "query": "OJK",
    "field": "all"
  }
}
```

#### 6. **Get Statistics**
```http
GET /?action=stats
```

**Response:**
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "totalDocuments": 150,
    "byType": {
      "Peraturan OJK": 45,
      "Undang-Undang": 30,
      "Peraturan Pemerintah": 25
    },
    "byYear": {
      "2025": 20,
      "2024": 50,
      "2023": 80
    },
    "byInstitution": {
      "OJK": 45,
      "BI": 30,
      "Kemenkeu": 25
    },
    "lastUpdated": "2025-07-22T10:30:00.000Z"
  }
}
```

#### 7. **Get Logs**
```http
GET /?action=logs&limit=50&level=all
```

**Parameters:**
- `limit` (optional): Number of log entries (default: 50)
- `level` (optional): Filter by log level (default: "all")

**Response:**
```json
{
  "success": true,
  "message": "Retrieved 50 log entries",
  "data": {
    "logs": [
      {
        "timestamp": "2025-07-22T10:30:00.000Z",
        "action": "Document Upload",
        "message": "File processed successfully",
        "level": "SUCCESS"
      }
    ],
    "total": 200,
    "limit": 50,
    "level": "all"
  }
}
```

---

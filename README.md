# 人臉表情識別系統 😊

## 功能介紹

這是一個完全基於前端的實時人臉表情識別系統，可以：

- 📷 實時偵測臉部
- 😊 識別 6 種表情：**喜悅、悲傷、憤怒、驚恐、厭惡、中立**
- 📊 顯示每種表情的置信度百分比
- 📱 完全響應式設計，支援手機、平板、電腦
- 🔒 完全隱私保護 - 所有處理在本地進行，無上傳數據

## 技術棧

- **HTML5** - 基本結構
- **CSS3** - 響應式設計
- **JavaScript (ES6+)** - 邏輯處理
- **face-api.js** - 人臉檢測和表情識別（基於 TensorFlow.js）
- **TensorFlow.js** - 深度學習推理

## 使用方法

### 基本使用
1. 在瀏覽器中打開 `index.html`
2. 點擊 **「🎥 開始識別」** 按鈕
3. 允許瀏覽器訪問攝像頭
4. 將臉部對著攝像頭，系統將實時識別您的表情
5. 點擊 **「⏹️ 停止」** 按鈕結束

### 系統要求
- ✅ 現代瀏覽器（Chrome、Firefox、Safari、Edge）
- ✅ 攝像頭設備
- ✅ 互聯網連接（首次加載 TensorFlow.js 和 face-api.js 庫）
- ✅ HTTPS 或 localhost 環境

## 文件結構

```
project/
├── index.html       # 主 HTML 文件
├── styles.css       # 樣式表
├── script.js        # JavaScript 邏輯
└── README.md        # 本文件
```

## 快速開始

### 方式 1：直接打開 HTML
在文件管理器中雙擊 `index.html` 打開

### 方式 2：使用本地伺服器
如果直接打開出現問題，可以使用 Python 啟動本地伺服器：

```bash
# Python 3
python -m http.server 8000

# 然後訪問 http://localhost:8000
```

或使用 Node.js（http-server）：
```bash
npx http-server
```

## 功能說明

### 表情識別
系統能識別以下 6 種表情：

| 表情 | 說明 |
|------|------|
| 😊 喜悅 (Happy) | 開心、愉快的表情 |
| 😢 悲傷 (Sad) | 傷心、難過的表情 |
| 😠 憤怒 (Angry) | 生氣、惱怒的表情 |
| 😨 驚恐 (Fear) | 害怕、恐懼的表情 |
| 🤢 厭惡 (Disgusted) | 不滿、反感的表情 |
| 😐 中立 (Neutral) | 無表情、冷漠 |

### 置信度
每個表情都有對應的置信度百分比，表示系統對該判斷的可信度。

## 隱私和安全

- 🔒 **本地處理**：所有面部識別在您的設備上進行，不上傳任何數據
- 🔐 **無伺服器**：無需後端伺服器，純前端應用
- ✅ **完全免費**：使用開源庫，無任何費用

## 常見問題

### Q: 為什麼看不到實時效果？
**A:** 
- 檢查瀏覽器是否允許訪問攝像頭
- 確保有充足的光線
- 檢查攝像頭是否被其他應用使用
- 嘗試使用 HTTPS 或 localhost

### Q: 識別不準確怎麼辦？
**A:** 
- 確保光線充足
- 臉部盡量正對攝像頭
- 避免過度的陰影或背光
- 確保攝像頭清晰

### Q: 支援多個人臉同時識別嗎？
**A:** 目前系統只識別視頻中的第一張臉，如需多人識別可修改 script.js

### Q: 可以離線使用嗎？
**A:** 首次使用需要下載 TensorFlow.js 和 face-api.js 庫，之後可離線使用

## 自訂修改

### 修改識別的臉部數量
在 `script.js` 中找到以下代碼：
```javascript
const detections = await window.faceapi
    .detectAllFaces(video)
    .withFaceExpressions();

if (detections.length > 0) {
    const detection = detections[0];  // 改這裡可改為其他索引
```

### 修改顏色主題
編輯 `styles.css` 中的漸變色：
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

## 瀏覽器兼容性

| 瀏覽器 | 支援版本 |
|------|--------|
| Chrome | 79+ |
| Firefox | 87+ |
| Safari | 14+ |
| Edge | 79+ |

## 許可證

此項目使用 MIT 許可證

## 參考資源

- [face-api.js 文檔](https://github.com/justadudewhohacks/face-api.js/)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [MDN Web API - getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

---

祝您使用愉快！😊

let video;
let canvas;
let ctx;
let isRunning = false;
const emotionEmojis = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    fearful: '😨',
    disgusted: '🤢',
    surprised: '😲',
    neutral: '😐'
};

const emotionEmojisMap = {
    HAPPY: '😊',
    SADNESS: '😢',
    ANGER: '😠',
    FEAR: '😨',
    DISGUST: '🤢',
    SURPRISE: '😲',
    NEUTRAL: '😐'
};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    // 設定 canvas 大小
    function resizeCanvas() {
        const rect = video.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    window.addEventListener('resize', resizeCanvas);

    // 監聽按鈕
    document.getElementById('startBtn').addEventListener('click', startCamera);
    document.getElementById('stopBtn').addEventListener('click', stopCamera);

    // 檢查 face-api 是否已載入
    await waitForFaceApi();
});

async function waitForFaceApi() {
    const maxRetries = 50;
    for (let i = 0; i < maxRetries; i++) {
        if (window.faceapi) {
            console.log('face-api 已載入');
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.error('face-api 載入超時');
}

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });

        video.srcObject = stream;
        video.onloadedmetadata = () => {
            // 等待影片播放
            setTimeout(() => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                isRunning = true;
                document.getElementById('startBtn').disabled = true;
                document.getElementById('stopBtn').disabled = false;
                updateStatus('系統已啟動，正在分析中...');
                detectEmotion();
            }, 500);
        };
    } catch (error) {
        console.error('無法訪問攝像頭:', error);
        updateStatus('❌ 錯誤：無法訪問攝像頭。請檢查權限設定。');
        alert('無法訪問攝像頭。請確保：\n1. 允許網站使用攝像頭\n2. 攝像頭未被其他應用使用\n3. 使用 HTTPS 或 localhost');
    }
}

function stopCamera() {
    isRunning = false;
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    updateStatus('已停止');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    resetEmotionDisplay();
}

async function detectEmotion() {
    if (!isRunning) return;

    try {
        // 清除 canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!window.faceapi) {
            await new Promise(resolve => setTimeout(resolve, 100));
            detectEmotion();
            return;
        }

        // 偵測臉部和表情
        const detections = await window.faceapi
            .detectAllFaces(video)
            .withFaceExpressions();

        if (detections.length > 0) {
            // 只處理第一張臉
            const detection = detections[0];
            const expressions = detection.expressions;

            // 找到最主要的表情
            const maxEmotion = Object.entries(expressions).reduce((prev, current) =>
                prev[1] > current[1] ? prev : current
            );

            const emotionName = maxEmotion[0];
            const confidence = Math.round(maxEmotion[1] * 100);

            // 更新表情顯示
            updateEmotionDisplay(emotionName, confidence, expressions);

            // 繪製臉部框
            const box = detection.detection.box;
            drawBox(box, emotionName, confidence);

            updateStatus(`✅ 偵測到臉部 | 主要表情：${emotionName} (${confidence}%)`);
        } else {
            resetEmotionDisplay();
            updateStatus('未偵測到臉部，請將臉對著攝像頭');
        }

        // 繼續檢測
        requestAnimationFrame(detectEmotion);
    } catch (error) {
        console.error('表情檢測錯誤:', error);
        setTimeout(detectEmotion, 100);
    }
}

function updateEmotionDisplay(mainEmotion, confidence, expressions) {
    // 更新主要表情顯示
    const mainEmotionEl = document.getElementById('mainEmotion');
    const emoji = emotionEmojisMap[mainEmotion.toUpperCase()] || '😐';
    const emotionText = translateEmotion(mainEmotion);

    mainEmotionEl.innerHTML = `
        <span class="emoji">${emoji}</span>
        <span class="emotion-text">${emotionText}</span>
    `;

    // 更新所有表情條
    const emotionMap = {
        happy: 'happy',
        sad: 'sad',
        angry: 'angry',
        fearful: 'fear',
        disgusted: 'disgusted',
        surprised: 'surprise',
        neutral: 'neutral'
    };

    for (const [key, barId] of Object.entries(emotionMap)) {
        const percentage = Math.round((expressions[key] || 0) * 100);
        const bar = document.getElementById(barId);
        const valueSpan = document.getElementById(barId + 'Value');

        if (bar && valueSpan) {
            bar.style.width = percentage + '%';
            valueSpan.textContent = percentage + '%';
        }
    }
}

function drawBox(box, emotion, confidence) {
    const displaySize = { width: canvas.width, height: canvas.height };

    // 繪製邊框
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // 繪製表情文字
    const text = `${translateEmotion(emotion)} ${confidence}%`;
    ctx.fillStyle = '#667eea';
    ctx.font = 'bold 16px Arial';
    ctx.fillRect(box.x, box.y - 30, 200, 30);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, box.x + 5, box.y - 10);
}

function translateEmotion(emotion) {
    const translations = {
        happy: '喜悅',
        sad: '悲傷',
        angry: '憤怒',
        fearful: '驚恐',
        disgusted: '厭惡',
        surprised: '驚訝',
        neutral: '中立'
    };
    return translations[emotion] || emotion;
}

function updateStatus(message) {
    document.getElementById('status').textContent = message;
}

function resetEmotionDisplay() {
    document.getElementById('mainEmotion').innerHTML = `
        <span class="emoji">😐</span>
        <span class="emotion-text">等待中</span>
    `;

    const emotions = ['happy', 'sad', 'angry', 'fear', 'disgusted', 'neutral'];
    emotions.forEach(emotion => {
        const bar = document.getElementById(emotion);
        const valueSpan = document.getElementById(emotion + 'Value');
        if (bar && valueSpan) {
            bar.style.width = '0%';
            valueSpan.textContent = '0%';
        }
    });
}

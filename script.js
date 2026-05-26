let video;
let canvas;
let ctx;
let stream = null;
let faceMesh = null;
let isRunning = false;
let currentFacingMode = 'user';

const emotionEmojis = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    fear: '😨',
    disgusted: '🤢',
    neutral: '😐'
};

const emotionTranslations = {
    happy: '喜悅',
    sad: '悲傷',
    angry: '憤怒',
    fear: '驚恐',
    disgusted: '厭惡',
    neutral: '中立'
};

const faceMeshBaseUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/';

// 初始化
window.addEventListener('DOMContentLoaded', async () => {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    document.getElementById('startBtn').addEventListener('click', startCamera);
    document.getElementById('stopBtn').addEventListener('click', stopCamera);
    document.getElementById('switchBtn').addEventListener('click', switchCamera);

    await initFaceMesh();
});

async function initFaceMesh() {
    if (typeof FaceMesh === 'undefined') {
        updateStatus('❌ MediaPipe FaceMesh 未載入，請稍候重新整理');
        return;
    }

    faceMesh = new FaceMesh({
        locateFile: (file) => faceMeshBaseUrl + file
    });

    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onResults);
}

async function startCamera() {
    try {
        await stopCamera();

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: currentFacingMode,
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        });

        video.srcObject = stream;
        await video.play();

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        isRunning = true;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
        document.getElementById('switchBtn').disabled = false;
        updateStatus('系統已啟動，正在分析中...');

        requestAnimationFrame(runPrediction);
    } catch (error) {
        console.error('無法訪問攝像頭:', error);
        updateStatus('❌ 錯誤：無法訪問攝像頭。請檢查權限設定。');
        alert('無法訪問攝像頭。請確保：\n1. 允許網站使用攝像頭\n2. 攝像頭未被其他應用使用\n3. 使用 HTTPS 或 localhost');
    }
}

async function switchCamera() {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    updateStatus('正在切換鏡頭...');
    if (isRunning) {
        await startCamera();
    }
}

async function stopCamera() {
    isRunning = false;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }

    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('switchBtn').disabled = true;
    updateStatus('已停止');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    resetEmotionDisplay();
}

async function runPrediction() {
    if (!isRunning || !faceMesh) {
        return;
    }

    await faceMesh.send({ image: video });
    requestAnimationFrame(runPrediction);
}

function onResults(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        resetEmotionDisplay();
        updateStatus('未偵測到臉部，請將臉對著攝像頭');
        return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    const expressions = estimateExpression(landmarks);
    const mainEmotion = getMainEmotion(expressions);

    updateEmotionDisplay(mainEmotion, expressions);
    drawFaceBox(landmarks, mainEmotion);
    updateStatus(`✅ 已偵測到臉部 | 主要表情：${translateEmotion(mainEmotion)}`);
}

function estimateExpression(landmarks) {
    const mouthLeft = landmarks[61];
    const mouthRight = landmarks[291];
    const mouthTop = landmarks[13];
    const mouthBottom = landmarks[14];
    const leftEyeTop = landmarks[159];
    const leftEyeBottom = landmarks[145];
    const leftEyeLeft = landmarks[33];
    const leftEyeRight = landmarks[133];
    const rightEyeTop = landmarks[386];
    const rightEyeBottom = landmarks[374];
    const rightEyeLeft = landmarks[362];
    const rightEyeRight = landmarks[263];
    const leftBrowTop = landmarks[65];
    const rightBrowTop = landmarks[295];
    const leftBrowBottom = landmarks[159];
    const rightBrowBottom = landmarks[386];
    const noseTip = landmarks[1];
    const upperLip = landmarks[13];
    const faceTop = landmarks[10];
    const faceBottom = landmarks[152];
    const faceLeft = landmarks[127];
    const faceRight = landmarks[356];

    const mouthWidth = distance(mouthLeft, mouthRight);
    const mouthHeight = distance(mouthTop, mouthBottom);
    const faceHeight = distance(faceTop, faceBottom);
    const faceWidth = distance(faceLeft, faceRight);
    const eyeOpen = (eyeOpenRatio(landmarks, 159, 145, 33, 133) + eyeOpenRatio(landmarks, 386, 374, 362, 263)) / 2;
    const browHeight = ((distance(leftBrowTop, leftBrowBottom) + distance(rightBrowTop, rightBrowBottom)) / 2) / faceHeight;
    const mouthRatio = mouthHeight / (mouthWidth + 1e-6);
    const smileRatio = clamp((mouthWidth / (mouthHeight + 1e-6) - 2.5) / 2.5, 0, 1);
    const openMouth = clamp((mouthHeight / faceHeight - 0.02) * 8, 0, 1);
    const noseLift = clamp((distance(noseTip, upperLip) / faceHeight - 0.08) * 6, 0, 1);
    const browFurrow = clamp((0.18 - browHeight) * 3, 0, 1);

    const happy = clamp(smileRatio * 0.9 + (1 - mouthRatio) * 0.25, 0, 1);
    const fear = clamp(openMouth * 0.7 + eyeOpen * 0.5 + (browHeight - 0.18) * 1.5, 0, 1);
    const angry = clamp(browFurrow * 0.9 + (mouthRatio < 0.14 ? 0.4 : 0), 0, 1);
    const sad = clamp((1 - smileRatio) * 0.6 + (browHeight < 0.16 ? 0.3 : 0), 0, 1);
    const disgusted = clamp(noseLift * 0.7 + (mouthRatio < 0.12 ? 0.4 : 0), 0, 1);
    const neutral = Math.max(0, 1 - Math.max(happy, fear, angry, sad, disgusted));

    return normalizeScores({
        happy,
        sad,
        angry,
        fear,
        disgusted,
        neutral
    });
}

function getMainEmotion(expressions) {
    return Object.entries(expressions).reduce((best, current) => {
        return current[1] > best[1] ? current : best;
    }, ['neutral', 0])[0];
}

function updateEmotionDisplay(mainEmotion, expressions) {
    const mainEmotionEl = document.getElementById('mainEmotion');
    const emoji = emotionEmojis[mainEmotion] || '😐';
    const emotionText = translateEmotion(mainEmotion);

    mainEmotionEl.innerHTML = `
        <span class="emoji">${emoji}</span>
        <span class="emotion-text">${emotionText}</span>
    `;

    const emotionMap = {
        happy: 'happy',
        sad: 'sad',
        angry: 'angry',
        fear: 'fear',
        disgusted: 'disgusted',
        neutral: 'neutral'
    };

    for (const [key, barId] of Object.entries(emotionMap)) {
        const percentage = expressions[key] || 0;
        const bar = document.getElementById(barId);
        const valueSpan = document.getElementById(barId + 'Value');

        if (bar && valueSpan) {
            bar.style.width = `${percentage}%`;
            valueSpan.textContent = `${percentage}%`;
        }
    }
}

function drawFaceBox(landmarks, emotion) {
    const box = getBoundingBox(landmarks);
    const label = translateEmotion(emotion);

    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    ctx.fillStyle = '#667eea';
    ctx.font = 'bold 16px Arial';
    ctx.fillRect(box.x, box.y - 30, 170, 30);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, box.x + 8, box.y - 10);
}

function getBoundingBox(landmarks) {
    let minX = 1;
    let minY = 1;
    let maxX = 0;
    let maxY = 0;

    for (const point of landmarks) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
    }

    return {
        x: minX * canvas.width,
        y: minY * canvas.height,
        width: (maxX - minX) * canvas.width,
        height: (maxY - minY) * canvas.height
    };
}

function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function eyeOpenRatio(landmarks, topIndex, bottomIndex, leftIndex, rightIndex) {
    const vertical = distance(landmarks[topIndex], landmarks[bottomIndex]);
    const horizontal = distance(landmarks[leftIndex], landmarks[rightIndex]);
    return horizontal === 0 ? 0 : vertical / horizontal;
}

function normalizeScores(scores) {
    const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
    const normalized = {};

    if (total === 0) {
        return {
            happy: 0,
            sad: 0,
            angry: 0,
            fear: 0,
            disgusted: 0,
            neutral: 100
        };
    }

    for (const [key, value] of Object.entries(scores)) {
        normalized[key] = Math.round((value / total) * 100);
    }

    return normalized;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function translateEmotion(emotion) {
    return emotionTranslations[emotion] || emotion;
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

// ==========================================
// ECOAI - FRONTEND APPLICATION
// Upload ảnh - Camera - AI Classification
// History - Local Storage
// ==========================================

const STORAGE_KEY = "ecoai_history";

// DOM elements
const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const classifyButton = document.getElementById("classifyButton");
const cameraButton = document.getElementById("cameraButton");
const captureButton = document.getElementById("captureButton");
const cameraVideo = document.getElementById("cameraVideo");
const resultBox = document.getElementById("result");

let cameraStream = null;
let currentImage = null;

// ==========================================
// 1. HISTORY
// ==========================================

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHistory(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearHistory() {
  if (!confirm("Bạn có chắc muốn xóa toàn bộ lịch sử?")) return;

  saveHistory([]);
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById("historyList");
  if (!list) return;

  const history = getHistory();

  if (history.length === 0) {
    list.innerHTML = `
      <div class="empty">
        <div style="font-size:50px">🕘</div>
        <h3>Chưa có lịch sử phân loại</h3>
        <p>Những lần phân loại sẽ được lưu tại đây.</p>
      </div>`;
    return;
  }

  list.innerHTML = history.map(item => `
    <div class="history-item">
      <img src="${item.image}" alt="Ảnh rác">
      <div class="history-info">
        <strong>${escapeHTML(item.name)}</strong>
        <p>${escapeHTML(item.date)}</p>
        <p>${escapeHTML(item.category || "")}</p>
      </div>
    </div>
  `).join("");
}

function addHistory(result, image) {
  const history = getHistory();

  history.unshift({
    name: result.name || "Vật thể chưa xác định",
    category: result.category || "Chưa xác định",
    date: new Date().toLocaleString("vi-VN"),
    image: image
  });

  // Chỉ lưu 20 kết quả gần nhất
  saveHistory(history.slice(0, 20));
  renderHistory();
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// ==========================================
// 2. HIỂN THỊ ẢNH
// ==========================================

function showPreview(imageData) {
  if (!preview) return;

  currentImage = imageData;
  preview.src = imageData;
  preview.style.display = "block";

  if (resultBox) {
    resultBox.className = "result";
    resultBox.innerHTML = "";
  }
}

// ==========================================
// 3. UPLOAD IMAGE
// ==========================================
if (imageInput) {
  imageInput.addEventListener("change", function () {
    const file = this.files[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Vui lòng chọn ảnh JPG, PNG hoặc WEBP.");
      this.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.");
      this.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = event => {
      showPreview(event.target.result);
    };

    reader.onerror = () => {
      alert("Không thể đọc ảnh. Hãy thử lại.");
    };

    reader.readAsDataURL(file);
  });
}

// ==========================================
// 4. CAMERA
// ==========================================

if (cameraButton && cameraVideo) {
  cameraButton.addEventListener("click", async () => {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;

        cameraVideo.srcObject = null;
        cameraVideo.style.display = "none";
        cameraButton.textContent = "Mở camera";
        return;
      }

      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment"
        },
        audio: false
      });

      cameraVideo.srcObject = cameraStream;
      cameraVideo.style.display = "block";

      await cameraVideo.play();

      cameraButton.textContent = "Tắt camera";

    } catch (error) {
      console.error(error);
      alert("Không thể mở camera. Hãy kiểm tra quyền truy cập camera và HTTPS.");
    }
  });
}

// ==========================================
// 5. CAPTURE IMAGE
// ==========================================

if (captureButton) {
  captureButton.addEventListener("click", () => {
    if (!cameraStream || !cameraVideo || !cameraVideo.videoWidth) {
      alert("Hãy mở camera trước.");
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = cameraVideo.videoWidth;
    canvas.height = cameraVideo.videoHeight;

    const context = canvas.getContext("2d");

    context.drawImage(
      cameraVideo,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const imageData = canvas.toDataURL("image/jpeg", 0.8);

    showPreview(imageData);
  });
}

// ==========================================
// 6. DISPLAY AI RESULT
// ==========================================

function displayResult(data) {
  if (!resultBox) return;

  const confidence = Math.max(
    0,
    Math.min(100, Number(data.confidence) || 0)
  );

  resultBox.className = "result show";

  resultBox.innerHTML = `
    <div class="result-content">

      <h2>🌿 Kết quả phân loại EcoAI</h2>

      <h3>${escapeHTML(data.name || "Chưa xác định")}</h3>

      <div class="result-item">
        <strong>Nhóm rác:</strong>
        <span>${escapeHTML(data.category || "Chưa xác định")}</span>
      </div>

      <div class="result-item">
        <strong>Chất liệu:</strong>
        <span>${escapeHTML(data.material || "Chưa xác định")}</span>
      </div>

      <div class="result-item">
        <strong>Khả năng tái chế:</strong>
        <span>${data.recyclable === true ? "Có" :
          data.recyclable === false ? "Không" : "Chưa xác định"}</span>
      </div>

      <div class="result-item">
        <strong>Độ tin cậy do AI ước tính:</strong>
        <span>${confidence}%</span>
      </div>

      <div class="result-item">
        <strong>Mô tả:</strong>
        <p>${escapeHTML(data.description || "Không có mô tả.")}</p>
      </div>

      <div class="result-item">
        <strong>Hướng dẫn xử lý:</strong>
        <p>${escapeHTML(data.disposal || "Chưa có hướng dẫn.")}</p>
      </div>

    </div>
  `;
}

// ==========================================
// 7. SEND IMAGE TO GEMINI THROUGH BACKEND
// ==========================================

if (classifyButton) {
  classifyButton.addEventListener("click", async () => {

    if (!currentImage) {
      alert("Vui lòng tải ảnh hoặc chụp ảnh trước.");
      return;
    }

    classifyButton.disabled = true;
    classifyButton.textContent = "Đang phân tích...";

    if (resultBox) {
      resultBox.className = "result show";
      resultBox.innerHTML = `
        <h3>🤖 EcoAI đang phân tích hình ảnh...</h3>
        <p>Vui lòng đợi trong giây lát.</p>
      `;
    }

    try {
      const response = await fetch(
  "https://ecoai-backend.trantrunghauss123.workers.dev/api/classify",
  {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          imageData: currentImage
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Không thể phân loại hình ảnh.");
      }

      if (!data.result) {
        throw new Error("AI không trả về kết quả hợp lệ.");
      }

      displayResult(data.result);

      addHistory(data.result, currentImage);

    } catch (error) {
      console.error("EcoAI error:", error);

      if (resultBox) {
        resultBox.className = "result show";
        resultBox.innerHTML = `
          <h3>⚠️ Không thể phân loại</h3>
          <p>${escapeHTML(error.message)}</p>
          <p>Vui lòng kiểm tra kết nối và thử lại.</p>
        `;
      }

    } finally {
      classifyButton.disabled = false;
      classifyButton.textContent = "🌿 Phân loại";
    }
  });
}

// ==========================================
// 8. INITIALIZE
// ==========================================

renderHistory();

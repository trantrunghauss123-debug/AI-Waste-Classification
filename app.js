// ECOAI - CHỨC NĂNG WEBSITE

const STORAGE_KEY = "ecoai_history";

// Lấy lịch sử
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

// Lưu lịch sử
function saveHistory(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Xóa lịch sử
function clearHistory() {
  if (!confirm("Bạn có chắc muốn xóa toàn bộ lịch sử?")) return;
  saveHistory([]);
  renderHistory();
}

// Hiển thị lịch sử
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
      </div>
    </div>
  `).join("");
}

// Chống chèn HTML từ dữ liệu
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// Chọn ảnh và xem trước
const imageInput = document.getElementById("imageInput");

if (imageInput) {
  imageInput.addEventListener("change", function() {
    const file = this.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn một file hình ảnh.");
      return;
    }

    const preview = document.getElementById("preview");
    const reader = new FileReader();

    reader.onload = function(event) {
      preview.src = event.target.result;
      preview.style.display = "block";
    };

    reader.readAsDataURL(file);
  });
}

// Camera
const cameraButton = document.getElementById("cameraButton");
const cameraVideo = document.getElementById("cameraVideo");
let cameraStream = null;

if (cameraButton && cameraVideo) {
  cameraButton.addEventListener("click", async () => {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
        cameraVideo.style.display = "none";
        cameraButton.textContent = "Mở camera";
        return;
      }

      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });

      cameraVideo.srcObject = cameraStream;
      cameraVideo.style.display = "block";
      cameraButton.textContent = "Tắt camera";
    } catch (error) {
      alert("Không thể mở camera. Hãy cấp quyền camera và dùng HTTPS.");
    }
  });
}

// Chụp ảnh từ camera
const captureButton = document.getElementById("captureButton");

if (captureButton) {
  captureButton.addEventListener("click", () => {
    if (!cameraVideo || !cameraStream) {
      alert("Hãy mở camera trước.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = cameraVideo.videoWidth;
    canvas.height = cameraVideo.videoHeight;
    canvas.getContext("2d").drawImage(
      cameraVideo, 0, 0, canvas.width, canvas.height
    );

    const preview = document.getElementById("preview");
    preview.src = canvas.toDataURL("image/jpeg", 0.8);
    preview.style.display = "block";
  });
}

// Phân loại - chưa kết nối mô hình AI
const classifyButton = document.getElementById("classifyButton");

if (classifyButton) {
  classifyButton.addEventListener("click", () => {
    const preview = document.getElementById("preview");
    const result = document.getElementById("result");

    if (!preview || !preview.src || preview.style.display === "none") {
      alert("Vui lòng tải ảnh hoặc chụp ảnh trước.");
      return;
    }

    result.className = "result show";
    result.innerHTML = `
      <h3>Ảnh đã sẵn sàng!</h3>
      <p>Chức năng giao diện đã hoạt động. Hệ thống chưa kết nối mô hình AI nên chưa thể xác định chính xác loại rác.</p>
      <p>Hãy tích hợp mô hình nhận diện trước khi sử dụng phân loại thực tế.</p>
    `;
  });
}

// Khởi tạo lịch sử nếu đang ở trang lịch sử
renderHistory();

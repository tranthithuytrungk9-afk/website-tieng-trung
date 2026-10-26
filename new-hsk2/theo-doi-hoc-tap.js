/* NEW HSK 2 - Theo dõi học tập dùng chung */

(function () {
  "use strict";

  const API = "/api/new-hsk2";
  const match = location.pathname.match(/\/bai-(\d+)\/?/);
  const LESSON = match ? Number(match[1]) : 1;

  const ID_KEY = "newhsk2_student_id";
  const NAME_KEY = "newhsk2_student_name";
  const CLASS_KEY = "newhsk2_student_class";

  let studentId = localStorage.getItem(ID_KEY);
  let startedAt = Date.now();
  let currentPart = "tu_moi";
  let interactions = 0;

  async function send(data) {
    const response = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Không lưu được dữ liệu");
    }

    return result;
  }

  function createStudentForm() {
    const box = document.createElement("div");

    box.style.cssText =
      "background:#e1f3ed;padding:18px;border-radius:14px;" +
      "margin:16px 0;border:1px solid #b7d6ce";

    box.innerHTML = `
      <h3>👩‍🎓 Thông tin học sinh</h3>
      <p>Nhập họ tên và lớp để giáo viên theo dõi kết quả.</p>
      <input id="hskStudentName"
             placeholder="Họ và tên học sinh"
             maxlength="100">
      <input id="hskStudentClass"
             placeholder="Lớp"
             maxlength="60">
      <button id="hskStudentSave">Bắt đầu học</button>
      <p id="hskStudentStatus"></p>
    `;

    const header = document.querySelector("header");

    if (header) {
      header.insertAdjacentElement("afterend", box);
    } else {
      document.body.prepend(box);
    }

    const nameInput = box.querySelector("#hskStudentName");
    const classInput = box.querySelector("#hskStudentClass");
    const status = box.querySelector("#hskStudentStatus");

    nameInput.value = localStorage.getItem(NAME_KEY) || "";
    classInput.value = localStorage.getItem(CLASS_KEY) || "";

    if (studentId) {
      status.textContent =
        "✓ Đã có thông tin học sinh. Có thể tiếp tục học.";
    }

    box.querySelector("#hskStudentSave").onclick = async () => {
      const ho_ten = nameInput.value.trim();
      const lop = classInput.value.trim();

      if (ho_ten.length < 2 || !lop) {
        status.textContent = "Vui lòng nhập đủ họ tên và lớp.";
        return;
      }

      status.textContent = "Đang lưu thông tin...";

      try {
        const result = await send({
          action: "student",
          ho_ten,
          lop
        });

        studentId = result.hoc_sinh_id;

        localStorage.setItem(ID_KEY, studentId);
        localStorage.setItem(NAME_KEY, ho_ten);
        localStorage.setItem(CLASS_KEY, lop);

        status.textContent =
          "✓ Đã lưu thông tin. Em có thể bắt đầu học!";

      } catch (error) {
        status.textContent = "Lỗi: " + error.message;
      }
    };
  }

  function partName(id) {
    const names = {
      vocab: "tu_moi",
      hanzi: "chu_han",
      hanziTab: "chu_han",
      listen: "nghe",
      speak: "noi",
      grammar: "ngu_phap",
      review: "on_tap"
    };

    return names[id] || null;
  }

  async function saveProgress() {
    if (!studentId || !currentPart) return;

    const seconds = Math.min(
      100000,
      Math.floor((Date.now() - startedAt) / 1000)
    );

    if (seconds === 0 && interactions === 0) return;

    try {
      await send({
        action: "progress",
        hoc_sinh_id: studentId,
        bai_hoc: LESSON,
        phan_hoc: currentPart,
        muc_do: null,
        so_lan_tuong_tac: Math.min(interactions, 100000),
        so_cau_dung: 0,
        so_cau_sai: 0,
        thoi_gian_hoc_giay: seconds
      });
    } catch (error) {
      console.warn("Chưa lưu được tiến độ:", error.message);
    }
  }

  document.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-tab]");

    if (tab) {
      const nextPart = partName(tab.dataset.tab);

      saveProgress();

      currentPart = nextPart;
      startedAt = Date.now();
      interactions = 0;

      return;
    }

    if (event.target.closest("button")) {
      interactions++;
    }
  });

  async function saveScore() {
    if (!studentId) {
      alert("Hãy nhập thông tin học sinh trước khi nộp bài.");
      return;
    }

    // Đọc kết quả đã được bài học tự chấm.
    const scoreBox = document.getElementById("score");

    if (!scoreBox) return;

    const text = scoreBox.textContent || "";
    const match = text.match(/Điểm:\s*(\d+)\s*\/\s*100/i);

    if (!match) return;

    const score = Number(match[1]);
    const correct = Math.round(score / 4);

    if (!Number.isInteger(correct) || correct < 0 || correct > 25) {
      return;
    }

    let message = document.getElementById("hskSaveResult");

    if (!message) {
      message = document.createElement("p");
      message.id = "hskSaveResult";
      scoreBox.appendChild(message);
    }

    message.textContent = "Đang lưu điểm lên hệ thống...";

    try {
      await send({
        action: "score",
        hoc_sinh_id: studentId,
        bai_hoc: LESSON,
        so_cau_dung: correct
      });

      message.textContent =
        "✓ Đã gửi điểm lên bảng quản lý giáo viên.";

    } catch (error) {
      message.textContent =
        "✗ Chưa lưu được điểm: " + error.message;
    }
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest("#submit")) {
      setTimeout(saveScore, 100);
    }
  });

  createStudentForm();

  // Ghi nhận tiến độ định kỳ khi học sinh đang mở bài.
  setInterval(() => {
    if (!document.hidden && studentId && currentPart) {
      saveProgress();
      startedAt = Date.now();
      interactions = 0;
    }
  }, 60000);

})();

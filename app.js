// 유틸
const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function pad(n) {
  return String(n).padStart(2, "0");
}
function toYYYYMMDD(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function formatKoreanLabel(yyyyMmDd) {
  const d = new Date(yyyyMmDd + "T00:00:00");
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK_LABELS[d.getDay()]})`;
}
function escapeHtml(s) {
  return s.replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        m
      ])
  );
}

// 상태, 저장소
const STORAGE_KEY = "vanilla_todo_step3";

/** @typedef {{ id:string, text:string, done:boolean }} Todo */
/** @type {Todo[]} */
let todos = [];
let currentDate = toYYYYMMDD(new Date()); // 현재 보고 있는 날짜

// DOM 캐싱
const prevBtn = document.getElementById("prevDay");
const nextBtn = document.getElementById("nextDay");
const calBtn = document.getElementById("openCalendar");
const datePicker = document.getElementById("datePicker");
const todayEl = document.getElementById("todayLabel");

const form = document.getElementById("todoForm");
const input = document.getElementById("todoInput");
const listEl = document.getElementById("todoList");
const listSection = document.querySelector(".list-section");

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) todos = JSON.parse(raw) || [];
  todos.forEach((t) => {
    if (!t.due) t.due = currentDate;
  });
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// 렌더
function render() {
  todayEl.textContent = formatKoreanLabel(currentDate);
  listEl.innerHTML = "";
  const filtered = todos.filter((t) => t.due === currentDate);
  filtered.forEach((t) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (t.done ? " done" : "");
    li.dataset.id = t.id;
    li.innerHTML = `
      <span class="title">${escapeHtml(t.text)}</span>
      <div class="actions">
        <label style="margin-right:8px;">
          <input type="checkbox" ${
            t.done ? "checked" : ""
          } data-action="toggle">
        </label>
        <button data-action="delete" aria-label="삭제">X</button>
      </div>
    `;
    listEl.appendChild(li);
  });
  const items = listEl.querySelectorAll(".todo-item");
  if (items.length > 5) {
    // 앞의 5개 높이 + gap*4 만큼 max-height를 동적으로 계산
    let max = 0;
    for (let i = 0; i < 5; i++) {
      max += items[i].getBoundingClientRect().height;
    }
    const cs = getComputedStyle(listEl);
    const rowGap = parseFloat(cs.rowGap || cs.gap || 0);
    max += rowGap * 4;

    listSection.style.maxHeight = `${Math.ceil(max)}px`;
    listSection.classList.add("scrolling");
  } else {
    // 5개 이하이면 원래 상태로
    listSection.style.maxHeight = "";
    listSection.classList.remove("scrolling");
  }
}

function openNativeDatePicker() {
  // 지원 브라우저면 네이티브 picker 호출
  if (typeof datePicker.showPicker === "function") {
    datePicker.showPicker();
    return;
  }
  // 폴백: 포커스 후 클릭 (일부 브라우저는 focus 필요)
  datePicker.focus({ preventScroll: true });
  try {
    datePicker.click();
  } catch (_) {}
}

// 초기화
function init() {
  // 오늘 날짜 세팅
  currentDate = toYYYYMMDD(new Date());
  load();
  render();

  // 추가
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      addFromInput();
    });
  } else if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addFromInput();
    });
  }

  // 리스트 이벤트 위임
  listEl.addEventListener("click", (e) => {
    const target = e.target;
    const li = target.closest(".todo-item");
    if (!li) return;
    const id = li.dataset.id;
    const action = target.dataset.action;

    if (action === "delete") {
      todos = todos.filter((t) => t.id !== id);
      save();
      render();
      return;
    }
  });

  listEl.addEventListener("change", (e) => {
    const target = e.target;
    const li = target.closest(".todo-item");
    if (!li) return;

    const id = li.dataset.id;
    const action = target.dataset.action;

    if (action === "toggle") {
      const t = todos.find((t) => t.id === id);
      if (!t) return;
      t.done = !t.done;
      save();
      render();
    }
  });
  // 날짜 이동
  prevBtn?.addEventListener("click", () => {
    const d = new Date(currentDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    currentDate = toYYYYMMDD(d);
    render();
  });
  nextBtn?.addEventListener("click", () => {
    const d = new Date(currentDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    currentDate = toYYYYMMDD(d);
    render();
  });
  calBtn?.addEventListener("click", () => {
    datePicker.value = currentDate;
    openNativeDatePicker();
  });
  datePicker?.addEventListener("change", () => {
    if (datePicker.value) {
      currentDate = datePicker.value;
      render();
    }
  });
}

function addFromInput() {
  const value = input?.value?.trim();
  if (!value) return;
  todos.push({
    id: String(Date.now()) + Math.random().toString(16).slice(2),
    text: value,
    done: false,
    due: currentDate,
  });
  save();
  render();
  input.value = "";
  input.focus();
}

init();

const elements = {
  timerDisplay: document.getElementById("timer-display"),
  timerMode: document.getElementById("timer-mode"),
  sessionLabel: document.getElementById("session-label"),
  startBtn: document.getElementById("start-btn"),
  pauseBtn: document.getElementById("pause-btn"),
  resetBtn: document.getElementById("reset-btn"),
  skipBtn: document.getElementById("skip-btn"),
  focusMin: document.getElementById("focus-min"),
  shortBreak: document.getElementById("short-break"),
  longBreak: document.getElementById("long-break"),
  sessionsBeforeLong: document.getElementById("sessions-before-long"),
  autoStart: document.getElementById("auto-start"),
  saveSettings: document.getElementById("save-settings"),
  dailyProgress: document.getElementById("daily-progress"),
  weeklyProgress: document.getElementById("weekly-progress"),
  completionRate: document.getElementById("completion-rate"),
  dailyBar: document.getElementById("daily-bar"),
  weeklyBar: document.getElementById("weekly-bar"),
  weeklyChart: document.getElementById("weekly-chart"),
  weeklyGoal: document.getElementById("weekly-goal"),
  saveGoal: document.getElementById("save-goal"),
  goalProgress: document.getElementById("goal-progress"),
  goalBar: document.getElementById("goal-bar"),
  milestones: document.getElementById("milestones"),
  todayFocus: document.getElementById("today-focus"),
  weeklySprints: document.getElementById("weekly-sprints"),
  focusScore: document.getElementById("focus-score"),
  reflectionInput: document.getElementById("reflection-input"),
  saveReflection: document.getElementById("save-reflection"),
  reflectionList: document.getElementById("reflection-list"),
  suggestions: document.getElementById("suggestions"),
  refreshSuggestions: document.getElementById("refresh-suggestions"),
  quote: document.getElementById("quote"),
  darkMode: document.getElementById("dark-mode"),
  shareProgress: document.getElementById("share-progress"),
  newTask: document.getElementById("new-task"),
  taskModal: document.getElementById("task-modal"),
  closeModal: document.getElementById("close-modal"),
  taskForm: document.getElementById("task-form"),
  taskTitle: document.getElementById("task-title"),
  taskPriority: document.getElementById("task-priority"),
  taskEstimate: document.getElementById("task-estimate"),
  taskStatus: document.getElementById("task-status"),
  todoList: document.getElementById("todo-list"),
  doingList: document.getElementById("doing-list"),
  doneList: document.getElementById("done-list")
};

const STORAGE_KEYS = {
  settings: "sprintlearn_settings",
  sessions: "sprintlearn_sessions",
  reflections: "sprintlearn_reflections",
  goal: "sprintlearn_goal",
  tasks: "sprintlearn_tasks",
  theme: "sprintlearn_theme"
};

const defaultSettings = {
  focusMinutes: 25,
  shortBreak: 5,
  longBreak: 15,
  sessionsBeforeLong: 4,
  autoStart: false
};

let state = {
  settings: { ...defaultSettings },
  mode: "focus",
  remaining: defaultSettings.focusMinutes * 60,
  running: false,
  timerId: null,
  sprintCount: 1,
  startedSprints: 0,
  completedSprints: 0,
  sessions: [],
  reflections: [],
  tasks: [],
  weeklyGoal: 12
};

const QUOTES = [
  "Short sprints build long-term mastery.",
  "Finish the sprint, then reflect on the gain.",
  "Consistency beats intensity when learning.",
  "One focused block can change the whole day.",
  "Momentum comes from small, repeatable wins."
];

const AI_STEPS = [
  "Review your toughest card first to build confidence.",
  "Move one task to doing and block notifications.",
  "End the sprint with a 2-minute recap for retention.",
  "Switch topics after each sprint to keep energy high.",
  "Plan the next sprint before you stop for the day."
];

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
};

const loadData = () => {
  const storedSettings = localStorage.getItem(STORAGE_KEYS.settings);
  const storedSessions = localStorage.getItem(STORAGE_KEYS.sessions);
  const storedReflections = localStorage.getItem(STORAGE_KEYS.reflections);
  const storedGoal = localStorage.getItem(STORAGE_KEYS.goal);
  const storedTasks = localStorage.getItem(STORAGE_KEYS.tasks);
  const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);

  if (storedSettings) state.settings = { ...defaultSettings, ...JSON.parse(storedSettings) };
  if (storedSessions) state.sessions = JSON.parse(storedSessions);
  if (storedReflections) state.reflections = JSON.parse(storedReflections);
  if (storedGoal) state.weeklyGoal = JSON.parse(storedGoal).weeklyGoal ?? state.weeklyGoal;
  if (storedTasks) state.tasks = JSON.parse(storedTasks);

  if (storedTheme === "dark") {
    document.body.classList.add("dark");
    elements.darkMode.checked = true;
  }

  const counts = state.sessions.reduce(
    (acc, session) => {
      if (session.type === "focus") {
        acc.started += 1;
        if (session.completed) acc.completed += 1;
      }
      return acc;
    },
    { started: 0, completed: 0 }
  );
  state.startedSprints = counts.started;
  state.completedSprints = counts.completed;
};

const saveSettings = () => {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
};

const saveSessions = () => {
  localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(state.sessions.slice(-200)));
};

const saveReflections = () => {
  localStorage.setItem(STORAGE_KEYS.reflections, JSON.stringify(state.reflections.slice(-50)));
};

const saveGoal = () => {
  localStorage.setItem(STORAGE_KEYS.goal, JSON.stringify({ weeklyGoal: state.weeklyGoal }));
};

const saveTasks = () => {
  localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(state.tasks));
};

const updateTimerDisplay = () => {
  elements.timerDisplay.textContent = formatTime(state.remaining);
  elements.timerMode.textContent =
    state.mode === "focus" ? "Focus" : state.mode === "short" ? "Short Break" : "Long Break";
  elements.sessionLabel.textContent = `Sprint ${state.sprintCount}`;
};

const setMode = (mode) => {
  state.mode = mode;
  const duration =
    mode === "focus"
      ? state.settings.focusMinutes
      : mode === "short"
        ? state.settings.shortBreak
        : state.settings.longBreak;
  state.remaining = duration * 60;
  updateTimerDisplay();
  renderSuggestions();
};

const startTimer = () => {
  if (state.running) return;

  if (state.mode === "focus") {
    state.startedSprints += 1;
  }

  state.running = true;
  elements.startBtn.disabled = true;

  state.timerId = setInterval(() => {
    state.remaining -= 1;
    updateTimerDisplay();
    if (state.remaining <= 0) {
      handleSessionComplete();
    }
  }, 1000);
};

const pauseTimer = () => {
  state.running = false;
  elements.startBtn.disabled = false;
  clearInterval(state.timerId);
};

const resetTimer = () => {
  pauseTimer();
  setMode(state.mode);
};

const logSession = (completed) => {
  state.sessions.push({
    type: state.mode,
    duration:
      state.mode === "focus"
        ? state.settings.focusMinutes
        : state.mode === "short"
          ? state.settings.shortBreak
          : state.settings.longBreak,
    completed,
    timestamp: new Date().toISOString()
  });
  saveSessions();
};

const handleSessionComplete = () => {
  pauseTimer();
  logSession(true);

  if (state.mode === "focus") {
    state.completedSprints += 1;
    const isLongBreak = state.sprintCount % state.settings.sessionsBeforeLong === 0;
    setMode(isLongBreak ? "long" : "short");
  } else {
    state.sprintCount += 1;
    setMode("focus");
  }

  updateAnalytics();

  if (state.settings.autoStart) {
    startTimer();
  }
};

const skipBreak = () => {
  if (state.mode === "focus") return;
  setMode("focus");
  state.sprintCount += 1;
  if (state.settings.autoStart) {
    startTimer();
  }
};

const updateSettingsForm = () => {
  elements.focusMin.value = state.settings.focusMinutes;
  elements.shortBreak.value = state.settings.shortBreak;
  elements.longBreak.value = state.settings.longBreak;
  elements.sessionsBeforeLong.value = state.settings.sessionsBeforeLong;
  elements.autoStart.checked = state.settings.autoStart;
};

const applySettings = () => {
  state.settings = {
    focusMinutes: Number(elements.focusMin.value),
    shortBreak: Number(elements.shortBreak.value),
    longBreak: Number(elements.longBreak.value),
    sessionsBeforeLong: Number(elements.sessionsBeforeLong.value),
    autoStart: elements.autoStart.checked
  };
  saveSettings();
  setMode(state.mode);
};

const addReflection = () => {
  const text = elements.reflectionInput.value.trim();
  if (!text) return;
  state.reflections.unshift({ text, timestamp: new Date().toISOString() });
  elements.reflectionInput.value = "";
  saveReflections();
  renderReflections();
};

const renderReflections = () => {
  elements.reflectionList.innerHTML = "";
  state.reflections.slice(0, 6).forEach((note) => {
    const noteEl = document.createElement("div");
    noteEl.className = "note";
    const time = new Date(note.timestamp);
    noteEl.innerHTML = `<time>${time.toLocaleString()}</time><p>${note.text}</p>`;
    elements.reflectionList.appendChild(noteEl);
  });
};

const filterSessions = (days) => {
  const now = new Date();
  return state.sessions.filter((session) => {
    const date = new Date(session.timestamp);
    const diff = (now - date) / (1000 * 60 * 60 * 24);
    return diff <= days;
  });
};

const calculateFocusScore = () => {
  if (state.startedSprints === 0) return 0;
  return Math.round((state.completedSprints / state.startedSprints) * 100);
};

const updateAnalytics = () => {
  const dailySessions = filterSessions(1).filter((s) => s.type === "focus");
  const weeklySessions = filterSessions(7).filter((s) => s.type === "focus");

  const dailyMinutes = dailySessions.reduce((sum, s) => sum + s.duration, 0);
  const weeklyMinutes = weeklySessions.reduce((sum, s) => sum + s.duration, 0);

  const dailyTarget = state.settings.focusMinutes * 4;
  const weeklyTarget = state.settings.focusMinutes * state.weeklyGoal;

  elements.dailyProgress.textContent = `${dailyMinutes} / ${dailyTarget} min`;
  elements.weeklyProgress.textContent = `${weeklyMinutes} / ${weeklyTarget} min`;

  elements.dailyBar.style.width = `${Math.min((dailyMinutes / dailyTarget) * 100, 100)}%`;
  elements.weeklyBar.style.width = `${Math.min((weeklyMinutes / weeklyTarget) * 100, 100)}%`;

  const completion = calculateFocusScore();
  elements.completionRate.textContent = `${completion}%`;
  elements.focusScore.textContent = `${completion}%`;
  elements.todayFocus.textContent = dailyMinutes;
  elements.weeklySprints.textContent = weeklySessions.length;

  updateWeeklyChart(weeklySessions);
  updateGoals(weeklySessions.length);
};

const updateWeeklyChart = (weeklySessions) => {
  const buckets = Array.from({ length: 7 }, () => 0);
  const now = new Date();

  weeklySessions.forEach((session) => {
    const date = new Date(session.timestamp);
    const dayDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (dayDiff >= 0 && dayDiff < 7) {
      buckets[6 - dayDiff] += session.duration;
    }
  });

  const max = Math.max(...buckets, 1);
  elements.weeklyChart.innerHTML = "";
  buckets.forEach((value) => {
    const bar = document.createElement("span");
    bar.style.height = `${(value / max) * 100}%`;
    elements.weeklyChart.appendChild(bar);
  });
};

const updateGoals = (weeklyCount) => {
  const goal = state.weeklyGoal;
  elements.goalProgress.textContent = `${weeklyCount} / ${goal} sprints`;
  elements.goalBar.style.width = `${Math.min((weeklyCount / goal) * 100, 100)}%`;

  const milestones = [25, 50, 75, 100];
  elements.milestones.innerHTML = "";
  milestones.forEach((percent) => {
    const required = Math.ceil((goal * percent) / 100);
    const item = document.createElement("li");
    const achieved = weeklyCount >= required;
    item.className = achieved ? "completed" : "";
    item.innerHTML = `${achieved ? "✔" : "○"} ${percent}% milestone (${required} sprints)`;
    elements.milestones.appendChild(item);
  });
};

const renderSuggestions = () => {
  elements.suggestions.innerHTML = "";
  const pool = AI_STEPS.sort(() => 0.5 - Math.random()).slice(0, 3);
  pool.forEach((text) => {
    const item = document.createElement("div");
    item.className = "suggestion";
    item.textContent = text;
    elements.suggestions.appendChild(item);
  });
};

const renderQuote = () => {
  const index = Math.floor(Math.random() * QUOTES.length);
  elements.quote.textContent = QUOTES[index];
};

const toggleDarkMode = () => {
  const enabled = elements.darkMode.checked;
  document.body.classList.toggle("dark", enabled);
  localStorage.setItem(STORAGE_KEYS.theme, enabled ? "dark" : "light");
};

const shareProgress = async () => {
  const text = `SprintLearn update: ${state.completedSprints} completed sprints, focus score ${calculateFocusScore()}%.`;
  try {
    await navigator.clipboard.writeText(text);
    elements.shareProgress.textContent = "Copied!";
    setTimeout(() => {
      elements.shareProgress.textContent = "Share progress";
    }, 1500);
  } catch {
    alert(text);
  }
};

const openModal = () => {
  elements.taskModal.classList.add("show");
  elements.taskModal.setAttribute("aria-hidden", "false");
};

const closeModal = () => {
  elements.taskModal.classList.remove("show");
  elements.taskModal.setAttribute("aria-hidden", "true");
};

const addTask = (task) => {
  state.tasks.unshift(task);
  saveTasks();
  renderTasks();
};

const updateTaskStatus = (id, status) => {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;
  task.status = status;
  saveTasks();
  renderTasks();
};

const removeTask = (id) => {
  state.tasks = state.tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
};

const renderTasks = () => {
  elements.todoList.innerHTML = "";
  elements.doingList.innerHTML = "";
  elements.doneList.innerHTML = "";

  const createTask = (task) => {
    const card = document.createElement("div");
    card.className = "task";
    card.innerHTML = `
      <strong>${task.title}</strong>
      <div class="task__meta">
        <span class="tag">${task.priority}</span>
        <span>${task.estimate} min</span>
      </div>
      <div class="task__actions">
        <button class="btn ghost" data-action="move" data-status="todo" data-id="${task.id}">To do</button>
        <button class="btn ghost" data-action="move" data-status="doing" data-id="${task.id}">Doing</button>
        <button class="btn ghost" data-action="move" data-status="done" data-id="${task.id}">Done</button>
        <button class="btn ghost" data-action="delete" data-id="${task.id}">Delete</button>
      </div>
    `;
    return card;
  };

  state.tasks.forEach((task) => {
    const card = createTask(task);
    if (task.status === "todo") elements.todoList.appendChild(card);
    if (task.status === "doing") elements.doingList.appendChild(card);
    if (task.status === "done") elements.doneList.appendChild(card);
  });
};

const setupListeners = () => {
  elements.startBtn.addEventListener("click", startTimer);
  elements.pauseBtn.addEventListener("click", pauseTimer);
  elements.resetBtn.addEventListener("click", resetTimer);
  elements.skipBtn.addEventListener("click", skipBreak);
  elements.saveSettings.addEventListener("click", applySettings);
  elements.refreshSuggestions.addEventListener("click", renderSuggestions);
  elements.saveReflection.addEventListener("click", addReflection);
  elements.saveGoal.addEventListener("click", () => {
    state.weeklyGoal = Number(elements.weeklyGoal.value);
    saveGoal();
    updateAnalytics();
  });
  elements.darkMode.addEventListener("change", toggleDarkMode);
  elements.shareProgress.addEventListener("click", shareProgress);
  elements.newTask.addEventListener("click", openModal);
  elements.closeModal.addEventListener("click", closeModal);
  elements.taskModal.addEventListener("click", (event) => {
    if (event.target === elements.taskModal) closeModal();
  });
  elements.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const task = {
      id: crypto.randomUUID(),
      title: elements.taskTitle.value.trim(),
      priority: elements.taskPriority.value,
      estimate: Number(elements.taskEstimate.value),
      status: elements.taskStatus.value
    };
    if (!task.title) return;
    addTask(task);
    elements.taskForm.reset();
    closeModal();
  });
  elements.board.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = button.dataset.id;
    const action = button.dataset.action;
    if (action === "move") updateTaskStatus(id, button.dataset.status);
    if (action === "delete") removeTask(id);
  });
};

const init = () => {
  loadData();
  updateSettingsForm();
  setMode(state.mode);
  renderReflections();
  renderTasks();
  renderSuggestions();
  renderQuote();
  updateAnalytics();
  setupListeners();
};

init();

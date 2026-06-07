const STORAGE_KEY = "sukmyeon-web-records";
const SETTINGS_KEY = "sukmyeon-web-settings";
const CALIBRATION_MS = 15000;
const MAX_SAMPLES = 180;

const DEFAULT_SETTINGS = {
  sensitivity: 12,
  sharedBedMode: true,
  keepAwake: true,
  meditationEnabled: false,
  meditationTime: "22:30",
  lastMeditationDate: "",
};

const STAGE_LABELS = {
  unknown: "--",
  deep: "깊은 수면 추정",
  stable: "안정 수면 추정",
  light: "얕은 수면 추정",
  awake: "깸 가능성",
};

const tabs = document.querySelectorAll("[data-target]");
const screens = document.querySelectorAll(".screen");
const installButton = document.querySelector("[data-install-button]");
const installPanel = document.querySelector("[data-install-panel]");
const installAction = document.querySelector("[data-install-action]");
const installMessage = document.querySelector("[data-install-message]");
const scoreRing = document.querySelector("[data-score-ring]");
const scoreValue = document.querySelector("[data-score-value]");
const scoreLabel = document.querySelector("[data-score-label]");
const statusLabel = document.querySelector("[data-status-label]");
const sessionTime = document.querySelector("[data-session-time]");
const sessionHint = document.querySelector("[data-session-hint]");
const startButton = document.querySelector("[data-start]");
const stopButton = document.querySelector("[data-stop]");
const dimButton = document.querySelector("[data-dim]");
const depthStage = document.querySelector("[data-depth-stage]");
const depthConfidence = document.querySelector("[data-depth-confidence]");
const depthBar = document.querySelector("[data-depth-bar]");
const depthNote = document.querySelector("[data-depth-note]");
const currentLevel = document.querySelector("[data-current-level]");
const eventCount = document.querySelector("[data-event-count]");
const snoreCount = document.querySelector("[data-snore-count]");
const awakeCount = document.querySelector("[data-awake-count]");
const eventSummary = document.querySelector("[data-event-summary]");
const eventList = document.querySelector("[data-event-list]");
const markAwakeButton = document.querySelector("[data-mark-awake]");
const canvas = document.querySelector("[data-canvas]");
const lastScore = document.querySelector("[data-last-score]");
const deepShare = document.querySelector("[data-deep-share]");
const recordCount = document.querySelector("[data-record-count]");
const recordList = document.querySelector("[data-record-list]");
const sensitivityInput = document.querySelector("[data-sensitivity]");
const sensitivityLabel = document.querySelector("[data-sensitivity-label]");
const sharedBedInput = document.querySelector("[data-shared-bed]");
const keepAwakeInput = document.querySelector("[data-keep-awake]");
const notificationButton = document.querySelector("[data-notification-permission]");
const exportButton = document.querySelector("[data-export]");
const clearButton = document.querySelector("[data-clear]");
const meditationEnabled = document.querySelector("[data-meditation-enabled]");
const meditationTime = document.querySelector("[data-meditation-time]");
const meditationStatus = document.querySelector("[data-meditation-status]");
const meditationPreview = document.querySelector("[data-meditation-preview]");
const meditationStop = document.querySelector("[data-meditation-stop]");
const overlay = document.querySelector("[data-overlay]");
const overlayClose = document.querySelector("[data-overlay-close]");
const overlayStatus = document.querySelector("[data-overlay-status]");
const overlayTime = document.querySelector("[data-overlay-time]");
const overlayDetail = document.querySelector("[data-overlay-detail]");

let settings = loadSettings();
let records = loadRecords();
let deferredInstallPrompt = null;
let audioContext = null;
let analyser = null;
let micStream = null;
let sourceNode = null;
let audioData = null;
let frameId = null;
let wakeLock = null;
let meditationContext = null;
let meditationNodes = [];
let meditationTimer = null;

let session = createSession();

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.target;
    tabs.forEach((item) => item.classList.remove("is-active"));
    screens.forEach((screen) => screen.classList.remove("is-active"));
    tab.classList.add("is-active");
    document.getElementById(target)?.classList.add("is-active");
  });
});

startButton?.addEventListener("click", startMonitoring);
stopButton?.addEventListener("click", stopMonitoring);
dimButton?.addEventListener("click", showOverlay);
overlayClose?.addEventListener("click", hideOverlay);
markAwakeButton?.addEventListener("click", markAwake);
sensitivityInput?.addEventListener("input", updateSettings);
sharedBedInput?.addEventListener("change", updateSettings);
keepAwakeInput?.addEventListener("change", updateSettings);
meditationEnabled?.addEventListener("change", updateSettings);
meditationTime?.addEventListener("change", updateSettings);
meditationPreview?.addEventListener("click", () => playMeditation("preview"));
meditationStop?.addEventListener("click", stopMeditation);
notificationButton?.addEventListener("click", requestNotificationPermission);
exportButton?.addEventListener("click", exportRecords);
clearButton?.addEventListener("click", clearRecords);
installButton?.addEventListener("click", installApp);
installAction?.addEventListener("click", installApp);
window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
window.addEventListener("appinstalled", handleAppInstalled);
document.addEventListener("visibilitychange", handleVisibilityChange);

registerServiceWorker();
renderSettings();
renderMonitor();
renderRecords();
renderInstallState();
drawCanvas();
window.setInterval(renderMonitor, 1000);
window.setInterval(checkMeditationAlarm, 15000);

async function startMonitoring() {
  if (session.active) return;

  if (!window.isSecureContext) {
    setError("마이크는 localhost 또는 HTTPS에서 사용할 수 있습니다.");
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    setError("이 브라우저는 마이크 측정을 지원하지 않습니다.");
    return;
  }

  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.18;
    audioData = new Float32Array(analyser.fftSize);
    sourceNode = audioContext.createMediaStreamSource(micStream);
    sourceNode.connect(analyser);

    const now = Date.now();
    session = createSession();
    session.active = true;
    session.status = "calibrating";
    session.startedAtMs = now;
    session.startedAt = new Date(now).toISOString();
    session.calibrationEndsAtMs = now + CALIBRATION_MS;
    session.lastFrameAtMs = now;

    await requestWakeLock();
    frameId = window.requestAnimationFrame(readAudio);
    renderMonitor();
  } catch (error) {
    stopAudio();
    setError(error?.name === "NotAllowedError" ? "마이크 권한이 거부되었습니다." : "마이크 연결에 실패했습니다.");
  }
}

function stopMonitoring() {
  if (!session.active) return;

  const now = Date.now();
  finalizeNoiseCandidate(now);
  session.active = false;
  session.status = "finished";
  session.endedAt = new Date(now).toISOString();
  session.durationMs = now - session.startedAtMs;

  const record = createRecord();
  records = [record, ...records].slice(0, 60);
  saveRecords(records);
  stopAudio();
  hideOverlay();
  renderMonitor();
  renderRecords();
}

function readAudio() {
  if (!session.active || !analyser) return;

  const now = Date.now();
  const deltaMs = Math.min(1000, Math.max(0, now - session.lastFrameAtMs));
  session.lastFrameAtMs = now;

  analyser.getFloatTimeDomainData(audioData);
  const db = getDb(audioData);
  session.currentDb = db;

  if (session.status === "calibrating") {
    session.calibrationSamples.push(db);
    if (now >= session.calibrationEndsAtMs) finishCalibration();
  }

  if (session.status === "monitoring") {
    updateMinute(db, now, deltaMs);
    detectNoise(db, now);
  }

  addSample(db);
  renderMonitor();
  drawCanvas();
  frameId = window.requestAnimationFrame(readAudio);
}

function finishCalibration() {
  const samples = [...session.calibrationSamples].sort((a, b) => a - b);
  const base = samples[Math.floor(samples.length * 0.55)] ?? -62;
  session.baselineDb = base;
  session.thresholdDb = base + Number(settings.sensitivity);
  session.status = "monitoring";
}

function updateMinute(db, now, deltaMs) {
  const minute = Math.floor((now - session.startedAtMs) / 60000);
  const item = session.minutes.get(minute) || { minute, count: 0, sumDb: 0, maxDb: -100, noisyMs: 0, measuredMs: 0 };
  item.count += 1;
  item.sumDb += db;
  item.maxDb = Math.max(item.maxDb, db);
  item.measuredMs += deltaMs;
  if (db > session.thresholdDb) item.noisyMs += deltaMs;
  session.minutes.set(minute, item);
  session.totalMeasuredMs += deltaMs;
  if (db > session.thresholdDb) session.noisyMs += deltaMs;
}

function detectNoise(db, now) {
  const isNoisy = db > session.thresholdDb;
  const releaseMs = 1500;

  if (isNoisy) {
    if (!session.candidate) {
      session.candidate = { startedAtMs: now, lastAboveAtMs: now, maxDb: db, sumDb: 0, count: 0 };
    }
    session.candidate.lastAboveAtMs = now;
    session.candidate.maxDb = Math.max(session.candidate.maxDb, db);
    session.candidate.sumDb += db;
    session.candidate.count += 1;
    return;
  }

  if (session.candidate && now - session.candidate.lastAboveAtMs > releaseMs) {
    finalizeNoiseCandidate(session.candidate.lastAboveAtMs);
  }
}

function finalizeNoiseCandidate(endAtMs) {
  if (!session.candidate) return;

  const candidate = session.candidate;
  session.candidate = null;
  const durationMs = endAtMs - candidate.startedAtMs;
  if (durationMs < 1600) return;

  const avgDb = candidate.count > 0 ? candidate.sumDb / candidate.count : candidate.maxDb;
  const maxOverDb = candidate.maxDb - session.baselineDb;
  const avgOverDb = avgDb - session.baselineDb;
  const type = getNoiseType(durationMs, maxOverDb, avgOverDb);
  const event = {
    id: createId(),
    type,
    startedAt: new Date(candidate.startedAtMs).toISOString(),
    endedAt: new Date(endAtMs).toISOString(),
    durationMs,
    maxOverDb,
    avgOverDb,
  };

  session.events.push(event);
  if (type !== "snore") detectAwakeWindow(event);
}

function getNoiseType(durationMs, maxOverDb, avgOverDb) {
  if (settings.sharedBedMode && isLikelySnore(durationMs, maxOverDb, avgOverDb)) return "snore";
  if (durationMs >= 18000) return "long";
  if (maxOverDb >= Number(settings.sensitivity) + 12) return "loud";
  return "noise";
}

function isLikelySnore(durationMs, maxOverDb, avgOverDb) {
  if (durationMs < 1200 || durationMs > 90000) return false;
  if (maxOverDb < 6 || maxOverDb > 38) return false;
  if (durationMs >= 12000) return true;

  const recent = session.events.filter((event) => {
    if (!["noise", "loud", "snore"].includes(event.type)) return false;
    const startedAtMs = Date.parse(event.startedAt);
    return Date.now() - startedAtMs < 4 * 60000 && event.maxOverDb >= 6 && event.maxOverDb <= 38;
  });
  return recent.length >= 2 && avgOverDb < maxOverDb;
}

function detectAwakeWindow(event) {
  const startedAtMs = Date.parse(event.startedAt);
  const recent = session.events.filter((item) => {
    if (!["noise", "long", "loud"].includes(item.type)) return false;
    return Date.parse(item.startedAt) >= startedAtMs - 10 * 60000;
  });

  if (event.type === "long" && event.durationMs >= 60000 || recent.length >= 3) {
    session.wakeWindows.push({ id: createId(), startedAt: event.startedAt, endedAt: event.endedAt });
  }
}

function markAwake() {
  if (!session.active) return;
  const now = new Date().toISOString();
  session.events.push({ id: createId(), type: "manual", startedAt: now, endedAt: now, durationMs: 0 });
  session.wakeWindows.push({ id: createId(), startedAt: now, endedAt: now });
  renderMonitor();
}

function createRecord() {
  const minutes = Array.from(session.minutes.values()).map((item) => ({
    minute: item.minute,
    avgDb: item.count ? item.sumDb / item.count : -100,
    maxDb: item.maxDb,
    noisyPercent: item.measuredMs ? (item.noisyMs / item.measuredMs) * 100 : 0,
  }));
  const noiseEvents = session.events.filter((event) => ["noise", "long", "loud"].includes(event.type));
  const snoreEvents = session.events.filter((event) => event.type === "snore");
  const noisyPercent = session.totalMeasuredMs ? (session.noisyMs / session.totalMeasuredMs) * 100 : 0;
  const depthSummary = summarizeDepth(minutes, session.events);
  const score = clamp(Math.round(100 - noiseEvents.length * 3 - snoreEvents.length * 1.1 - session.wakeWindows.length * 10 - noisyPercent * 0.45), 0, 100);

  return {
    id: createId(),
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationMs: session.durationMs,
    score,
    noisyPercent,
    eventCount: noiseEvents.length,
    snoreCount: snoreEvents.length,
    wakeCount: session.wakeWindows.length,
    events: session.events,
    minutes,
    depthSummary,
    settings: { ...settings },
  };
}

function summarizeDepth(minutes, events) {
  const counts = { deep: 0, stable: 0, light: 0, awake: 0 };
  let quietRun = 0;

  minutes.forEach((minute, index) => {
    const minuteEvents = events.filter((event) => Math.floor((Date.parse(event.startedAt) - session.startedAtMs) / 60000) === minute.minute);
    const hasSnore = minuteEvents.some((event) => event.type === "snore");
    const hasNoise = minuteEvents.some((event) => ["noise", "long", "loud"].includes(event.type));
    let stage = "stable";

    if (minute.noisyPercent >= (hasSnore ? 55 : 35) || minuteEvents.some((event) => event.type === "manual")) stage = "awake";
    else if (hasNoise || minute.noisyPercent >= 10 || (hasSnore && minute.noisyPercent >= 22)) stage = "light";
    else if (index >= 20 && quietRun >= 5) stage = "deep";

    if (stage === "stable" || stage === "deep") quietRun += 1;
    else quietRun = 0;
    counts[stage] += 1;
  });

  const total = Math.max(1, minutes.length);
  return {
    deepPercent: (counts.deep / total) * 100,
    stablePercent: (counts.stable / total) * 100,
    lightPercent: (counts.light / total) * 100,
    awakePercent: (counts.awake / total) * 100,
    dominantStage: Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown",
  };
}

function getLiveDepth() {
  if (session.status === "calibrating") return { stage: "unknown", score: 0, confidence: "기준 보정 중", note: "조용한 기준을 잡고 있습니다." };
  if (session.status !== "monitoring") {
    const record = records[0];
    if (!record) return { stage: "unknown", score: 0, confidence: "소리 기반 참고", note: "저장된 기록이 있으면 밤 전체의 깊이 추정을 볼 수 있습니다." };
    const summary = record.depthSummary || { dominantStage: "unknown", deepPercent: 0 };
    return { stage: summary.dominantStage, score: record.score, confidence: "최근 기록", note: `깊은 추정 ${summary.deepPercent.toFixed(0)}%` };
  }

  const minutes = Array.from(session.minutes.values()).map((item) => ({
    minute: item.minute,
    avgDb: item.count ? item.sumDb / item.count : -100,
    maxDb: item.maxDb,
    noisyPercent: item.measuredMs ? (item.noisyMs / item.measuredMs) * 100 : 0,
  }));
  const summary = summarizeDepth(minutes, session.events);
  const stage = summary.dominantStage;
  const score = { deep: 88, stable: 66, light: 43, awake: 18, unknown: 0 }[stage] || 0;
  return { stage, score, confidence: minutes.length < 20 ? "초기 추정" : "소리 기반 참고", note: getDepthNote(stage) };
}

function getDepthNote(stage) {
  if (stage === "deep") return "긴 조용함이 이어져 깊은 수면처럼 보입니다.";
  if (stage === "stable") return "큰 방해 없이 안정적인 수면처럼 보입니다.";
  if (stage === "light") return "작은 소리 변화가 있어 얕은 수면처럼 보입니다.";
  if (stage === "awake") return "소음이 많아 깼을 가능성이 있습니다.";
  return "소리만으로 실제 수면 단계는 구분하지 않습니다.";
}

function renderMonitor() {
  const elapsedMs = session.active ? Date.now() - session.startedAtMs : 0;
  const depth = getLiveDepth();
  const noiseEvents = session.events.filter((event) => ["noise", "long", "loud"].includes(event.type));
  const snoreEvents = session.events.filter((event) => event.type === "snore");
  const score = session.active ? Math.max(0, 100 - noiseEvents.length * 3 - snoreEvents.length - session.wakeWindows.length * 8) : records[0]?.score ?? null;

  if (scoreValue) scoreValue.textContent = score === null ? "--" : String(Math.round(score));
  if (scoreLabel) scoreLabel.textContent = session.active ? "예상 점수" : "최근 점수";
  if (scoreRing) {
    const angle = score === null ? 0 : score * 3.6;
    scoreRing.style.background = `conic-gradient(${getScoreColor(score)} ${angle}deg, #e6edf0 ${angle}deg)`;
  }
  if (statusLabel) statusLabel.textContent = getStatusText();
  if (sessionTime) sessionTime.textContent = formatDuration(elapsedMs || records[0]?.durationMs || 0);
  if (sessionHint) sessionHint.textContent = getHint();
  if (depthStage) depthStage.textContent = STAGE_LABELS[depth.stage] || "--";
  if (depthConfidence) depthConfidence.textContent = depth.confidence;
  if (depthNote) depthNote.textContent = depth.note;
  if (depthBar) {
    depthBar.style.width = `${depth.score}%`;
    depthBar.style.background = getStageColor(depth.stage);
  }
  if (currentLevel) currentLevel.textContent = session.currentDb === null ? "--" : `${dbToIndex(session.currentDb)} 지수`;
  if (eventCount) eventCount.textContent = `${noiseEvents.length}회`;
  if (snoreCount) snoreCount.textContent = `${snoreEvents.length}회`;
  if (awakeCount) awakeCount.textContent = `${session.wakeWindows.length}회`;
  if (eventSummary) eventSummary.textContent = getEventSummary(noiseEvents, snoreEvents);
  if (startButton) startButton.disabled = session.active;
  if (stopButton) stopButton.disabled = !session.active;
  if (dimButton) dimButton.disabled = !session.active;
  if (markAwakeButton) markAwakeButton.disabled = !session.active;
  renderEvents();
  renderOverlay();
  renderMeditationStatus();
}

function getStatusText() {
  if (session.status === "error") return session.error;
  if (session.status === "calibrating") return "기준 보정 중";
  if (session.status === "monitoring") return "측정 중";
  if (session.status === "finished") return "저장 완료";
  return "측정 대기";
}

function getHint() {
  if (session.status === "calibrating") return "방 안의 평소 조용한 소리를 기준으로 잡는 중입니다.";
  if (session.status === "monitoring") return settings.sharedBedMode ? "같이 자는 모드로 코골이 추정을 따로 기록합니다." : "방 전체 소리를 기준으로 기록합니다.";
  return "시작하면 15초 동안 조용한 기준을 잡습니다.";
}

function getEventSummary(noiseEvents, snoreEvents) {
  if (noiseEvents.length === 0 && snoreEvents.length === 0) return session.active ? "조용합니다." : "아직 기록 없음";
  if (snoreEvents.length > 0) return `방해 ${noiseEvents.length}회 · 코골이 추정 ${snoreEvents.length}회`;
  return `방해 ${noiseEvents.length}회 · 깸 가능성 ${session.wakeWindows.length}회`;
}

function renderEvents() {
  if (!eventList) return;
  eventList.innerHTML = "";
  const items = [...session.events].slice(-12).reverse();

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-events";
    empty.textContent = "조용합니다.";
    eventList.append(empty);
    return;
  }

  items.forEach((event) => {
    const row = document.createElement("article");
    const body = document.createElement("div");
    const title = document.createElement("strong");
    const meta = document.createElement("span");
    const chip = document.createElement("span");
    row.className = "event-item";
    title.textContent = getEventTitle(event.type);
    meta.textContent = `${formatClock(event.startedAt)} · ${formatDurationCompact(event.durationMs)}`;
    chip.className = "event-chip";
    chip.textContent = event.maxOverDb ? `${Math.max(0, event.maxOverDb).toFixed(0)}↑` : "";
    body.append(title, meta);
    row.append(body, chip);
    eventList.append(row);
  });
}

function renderRecords() {
  if (lastScore) lastScore.textContent = records[0] ? `${records[0].score}점` : "--";
  if (deepShare) deepShare.textContent = records[0] ? `${(records[0].depthSummary?.deepPercent || 0).toFixed(0)}%` : "--";
  if (recordCount) recordCount.textContent = `${records.length}일`;
  if (!recordList) return;

  recordList.innerHTML = "";
  if (records.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-events";
    empty.textContent = "저장된 수면 기록 없음";
    recordList.append(empty);
    return;
  }

  records.forEach((record) => {
    const row = document.createElement("article");
    const body = document.createElement("div");
    const title = document.createElement("strong");
    const meta = document.createElement("span");
    const button = document.createElement("button");
    title.textContent = formatDate(record.startedAt);
    meta.textContent = `${formatDuration(record.durationMs)} · ${record.score}점 · 코골이 ${record.snoreCount || 0}회`;
    button.type = "button";
    button.textContent = "보기";
    body.append(title, meta);
    row.append(body, button);
    recordList.append(row);
  });
}

function drawCanvas() {
  if (!canvas) return;
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#fbfcfe";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "#e5edf1";
  context.lineWidth = 1;
  for (let index = 1; index < 4; index += 1) {
    const y = (height / 4) * index;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  if (session.samples.length < 2) {
    context.fillStyle = "#667085";
    context.font = "700 28px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("마이크 대기", width / 2, height / 2);
    return;
  }

  context.strokeStyle = "#12806a";
  context.lineWidth = 3;
  context.beginPath();
  session.samples.forEach((sample, index) => {
    const x = (index / (session.samples.length - 1)) * width;
    const y = mapDbToY(sample.db, height);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();

  if (session.thresholdDb !== null) {
    const y = mapDbToY(session.thresholdDb, height);
    context.setLineDash([10, 8]);
    context.strokeStyle = "#c84a2f";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
    context.setLineDash([]);
  }
}

function addSample(db) {
  session.samples.push({ db, at: Date.now() });
  if (session.samples.length > MAX_SAMPLES) session.samples.shift();
}

function stopAudio() {
  if (frameId) window.cancelAnimationFrame(frameId);
  frameId = null;
  sourceNode?.disconnect();
  sourceNode = null;
  micStream?.getTracks().forEach((track) => track.stop());
  micStream = null;
  audioContext?.close().catch(() => {});
  audioContext = null;
  analyser = null;
  audioData = null;
  releaseWakeLock();
}

async function playMeditation(reason = "alarm") {
  stopMeditation();
  meditationContext = new (window.AudioContext || window.webkitAudioContext)();
  await meditationContext.resume();
  const duration = reason === "preview" ? 45 : 180;
  const now = meditationContext.currentTime;
  const master = meditationContext.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(0.22, now + 2);
  master.gain.linearRampToValueAtTime(0, now + duration);
  master.connect(meditationContext.destination);

  [174.61, 220, 261.63, 329.63].forEach((frequency, index) => {
    const oscillator = meditationContext.createOscillator();
    const gain = meditationContext.createGain();
    oscillator.type = index === 0 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.linearRampToValueAtTime(frequency * 1.005, now + duration);
    gain.gain.setValueAtTime(0.05 / (index + 1), now);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now);
    oscillator.stop(now + duration);
    meditationNodes.push(oscillator, gain);
  });

  meditationTimer = window.setTimeout(stopMeditation, duration * 1000);
  if (meditationStop) meditationStop.disabled = false;
  notifyMeditation(reason);
  renderMeditationStatus();
}

function stopMeditation() {
  if (meditationTimer) window.clearTimeout(meditationTimer);
  meditationTimer = null;
  meditationNodes.forEach((node) => {
    try {
      node.disconnect();
      node.stop?.();
    } catch {
      // Already stopped.
    }
  });
  meditationNodes = [];
  meditationContext?.close().catch(() => {});
  meditationContext = null;
  if (meditationStop) meditationStop.disabled = true;
  renderMeditationStatus();
}

function checkMeditationAlarm() {
  if (!settings.meditationEnabled || !settings.meditationTime) return;
  const now = new Date();
  const timeKey = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const dateKey = getDateKey(now);
  if (timeKey !== settings.meditationTime || settings.lastMeditationDate === dateKey) return;
  settings.lastMeditationDate = dateKey;
  saveSettings(settings);
  playMeditation("alarm").catch(() => {
    showNotification("숙면웹", "명상음악 시간이 되었어요. 앱 화면에서 미리 듣기를 눌러 재생할 수 있습니다.");
  });
}

function notifyMeditation(reason) {
  const message = reason === "preview" ? "명상음악 미리 듣기 중입니다." : "명상음악 시간이 되었어요.";
  showNotification("숙면웹", message);
}

function showNotification(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification(title, { body, icon: "./icon.svg" });
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("이 브라우저는 알림을 지원하지 않습니다.");
    return;
  }
  await Notification.requestPermission();
  renderMeditationStatus();
}

function renderMeditationStatus() {
  if (!meditationStatus) return;
  if (!settings.meditationEnabled) {
    meditationStatus.textContent = "꺼짐";
  } else if (meditationContext) {
    meditationStatus.textContent = "재생 중";
  } else {
    meditationStatus.textContent = `${settings.meditationTime} 알림`;
  }
}

function updateSettings() {
  settings.sensitivity = Number(sensitivityInput?.value || settings.sensitivity);
  settings.sharedBedMode = Boolean(sharedBedInput?.checked);
  settings.keepAwake = Boolean(keepAwakeInput?.checked);
  settings.meditationEnabled = Boolean(meditationEnabled?.checked);
  settings.meditationTime = meditationTime?.value || settings.meditationTime;
  if (session.baselineDb !== null) session.thresholdDb = session.baselineDb + Number(settings.sensitivity);
  saveSettings(settings);
  renderSettings();
  renderMonitor();
}

function renderSettings() {
  if (sensitivityInput) sensitivityInput.value = String(settings.sensitivity);
  if (sensitivityLabel) sensitivityLabel.textContent = settings.sensitivity <= 9 ? "예민" : settings.sensitivity >= 18 ? "둔감" : "보통";
  if (sharedBedInput) sharedBedInput.checked = settings.sharedBedMode;
  if (keepAwakeInput) keepAwakeInput.checked = settings.keepAwake;
  if (meditationEnabled) meditationEnabled.checked = settings.meditationEnabled;
  if (meditationTime) meditationTime.value = settings.meditationTime;
  renderMeditationStatus();
}

async function requestWakeLock() {
  if (!settings.keepAwake || !("wakeLock" in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
  } catch {
    wakeLock = null;
  }
}

function releaseWakeLock() {
  wakeLock?.release().catch(() => {});
  wakeLock = null;
}

function handleVisibilityChange() {
  if (document.visibilityState === "visible" && session.active) requestWakeLock();
  if (document.visibilityState !== "visible") releaseWakeLock();
}

function showOverlay() {
  if (!session.active || !overlay) return;
  overlay.hidden = false;
  requestWakeLock();
  renderOverlay();
}

function hideOverlay() {
  if (overlay) overlay.hidden = true;
}

function renderOverlay() {
  if (!overlay || overlay.hidden) return;
  const elapsedMs = session.active ? Date.now() - session.startedAtMs : 0;
  if (overlayStatus) overlayStatus.textContent = getStatusText();
  if (overlayTime) overlayTime.textContent = formatDuration(elapsedMs);
  if (overlayDetail) overlayDetail.textContent = `이벤트 ${session.events.length}회 · 코골이 ${session.events.filter((event) => event.type === "snore").length}회`;
}

function setError(message) {
  session = createSession();
  session.status = "error";
  session.error = message;
  renderMonitor();
}

function createSession() {
  return {
    active: false,
    status: "idle",
    startedAt: null,
    endedAt: null,
    startedAtMs: 0,
    durationMs: 0,
    calibrationEndsAtMs: 0,
    calibrationSamples: [],
    baselineDb: null,
    thresholdDb: null,
    currentDb: null,
    lastFrameAtMs: 0,
    totalMeasuredMs: 0,
    noisyMs: 0,
    minutes: new Map(),
    events: [],
    wakeWindows: [],
    samples: [],
    candidate: null,
  };
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}

function handleBeforeInstallPrompt(event) {
  event.preventDefault();
  deferredInstallPrompt = event;
  renderInstallState();
}

function handleAppInstalled() {
  deferredInstallPrompt = null;
  if (installPanel) installPanel.hidden = true;
  if (installButton) installButton.hidden = true;
}

function renderInstallState() {
  const isInstalled = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  if (isInstalled) {
    if (installPanel) installPanel.hidden = true;
    if (installButton) installButton.hidden = true;
    return;
  }
  if (installPanel) installPanel.hidden = !deferredInstallPrompt;
  if (installButton) installButton.hidden = !deferredInstallPrompt;
  if (installMessage) installMessage.textContent = "설치 버튼을 누르면 홈 화면에서 바로 열 수 있습니다.";
}

async function installApp() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  renderInstallState();
}

function exportRecords() {
  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), records }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sukmyeon-web-records-${getDateKey(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function clearRecords() {
  if (!window.confirm("저장된 수면 기록을 모두 삭제할까요?")) return;
  records = [];
  saveRecords(records);
  renderRecords();
  renderMonitor();
}

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(nextSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
  } catch {
    // Storage can fail in private or restricted browser modes.
  }
}

function loadRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveRecords(nextRecords) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRecords));
  } catch {
    // Storage can fail in private or restricted browser modes.
  }
}

function getDb(buffer) {
  let sum = 0;
  for (let index = 0; index < buffer.length; index += 1) sum += buffer[index] * buffer[index];
  const rms = Math.sqrt(sum / buffer.length);
  return clamp(rms > 0 ? 20 * Math.log10(rms) : -100, -100, 0);
}

function dbToIndex(db) {
  return clamp(Math.round((db + 80) * 1.45), 0, 100);
}

function mapDbToY(db, height) {
  const normalized = clamp((db + 82) / 70, 0, 1);
  return height - normalized * (height - 24) - 12;
}

function getScoreColor(score) {
  if (score === null) return "#7a8793";
  if (score >= 82) return "#12806a";
  if (score >= 62) return "#b7791f";
  return "#c84a2f";
}

function getStageColor(stage) {
  return { deep: "#164e63", stable: "#12806a", light: "#b7791f", awake: "#c84a2f" }[stage] || "#7a8793";
}

function getEventTitle(type) {
  return { noise: "방해 소리", loud: "큰 소리", long: "긴 소음", snore: "코골이 추정", manual: "깼음 표시" }[type] || "이벤트";
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const two = (value) => String(value).padStart(2, "0");
  return hours > 0 ? `${two(hours)}:${two(minutes)}:${two(seconds)}` : `${two(minutes)}:${two(seconds)}`;
}

function formatDurationCompact(milliseconds) {
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  return seconds < 60 ? `${seconds}초` : `${Math.floor(seconds / 60)}분`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatClock(value) {
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function getDateKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function createId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

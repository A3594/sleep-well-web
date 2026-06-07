const STORAGE_KEY = "sukmyeon-web-records";
const SETTINGS_KEY = "sukmyeon-web-settings";
const APP_VERSION = "1.6.1";
const APP_UPDATED_AT = "2026-06-07";
const DEFAULT_SLEEP_MUSIC_URL = "./sleep-music.m4a";
const DEFAULT_WAKE_MUSIC_URL = "./wake-music.m4a";
const MUSIC_DB_NAME = "sukmyeon-web-music";
const MUSIC_DB_VERSION = 1;
const MUSIC_STORE_NAME = "audioFiles";
const CALIBRATION_MS = 15000;
const MAX_SAMPLES = 180;

const DEFAULT_SETTINGS = {
  sensitivity: 12,
  sleepMode: "two",
  primaryName: "나",
  secondaryName: "상대",
  phoneSide: "self",
  sharedBedMode: true,
  keepAwake: true,
  startMusicEnabled: true,
  startMusicDuration: 15,
  startMusicSource: "asset",
  startMusicLink: "",
  startMusicFileName: "",
  startMusicFileStored: false,
  wakeMusicEnabled: false,
  wakeMusicTime: "07:00",
  wakeMusicDuration: 10,
  wakeMusicSource: "asset",
  wakeMusicLink: "",
  wakeMusicFileName: "",
  wakeMusicFileStored: false,
  lastWakeMusicDate: "",
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
const updatePanel = document.querySelector("[data-update-panel]");
const updateAction = document.querySelector("[data-update-action]");
const updateMessage = document.querySelector("[data-update-message]");
const appVersionLabel = document.querySelector("[data-app-version]");
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
const sleeperPanel = document.querySelector("[data-sleeper-panel]");
const sleeperGrid = document.querySelector("[data-sleeper-grid]");
const sleeperSummary = document.querySelector("[data-sleeper-summary]");
const sleeperModeLabel = document.querySelector("[data-sleeper-mode-label]");
const sleepModeLabel = document.querySelector("[data-sleep-mode-label]");
const sleepModeInputs = document.querySelectorAll("[data-sleep-mode]");
const twoPersonSettings = document.querySelector("[data-two-person-settings]");
const primaryNameInput = document.querySelector("[data-primary-name]");
const secondaryNameInput = document.querySelector("[data-secondary-name]");
const phoneSideInput = document.querySelector("[data-phone-side]");
const sensitivityInput = document.querySelector("[data-sensitivity]");
const sensitivityLabel = document.querySelector("[data-sensitivity-label]");
const sharedBedInput = document.querySelector("[data-shared-bed]");
const keepAwakeInput = document.querySelector("[data-keep-awake]");
const notificationButton = document.querySelector("[data-notification-permission]");
const exportButton = document.querySelector("[data-export]");
const clearButton = document.querySelector("[data-clear]");
const startMusicEnabled = document.querySelector("[data-start-music-enabled]");
const startMusicDuration = document.querySelector("[data-start-music-duration]");
const startMusicSource = document.querySelector("[data-start-music-source]");
const startMusicFile = document.querySelector("[data-start-music-file]");
const startMusicFileRow = document.querySelector("[data-start-music-file-row]");
const startMusicFileName = document.querySelector("[data-start-music-file-name]");
const startMusicLink = document.querySelector("[data-start-music-link]");
const startMusicLinkRow = document.querySelector("[data-start-music-link-row]");
const startMusicPreview = document.querySelector("[data-start-music-preview]");
const wakeMusicEnabled = document.querySelector("[data-wake-music-enabled]");
const wakeMusicTime = document.querySelector("[data-wake-music-time]");
const wakeMusicDuration = document.querySelector("[data-wake-music-duration]");
const wakeMusicSource = document.querySelector("[data-wake-music-source]");
const wakeMusicFile = document.querySelector("[data-wake-music-file]");
const wakeMusicFileRow = document.querySelector("[data-wake-music-file-row]");
const wakeMusicFileName = document.querySelector("[data-wake-music-file-name]");
const wakeMusicLink = document.querySelector("[data-wake-music-link]");
const wakeMusicLinkRow = document.querySelector("[data-wake-music-link-row]");
const wakeMusicPreview = document.querySelector("[data-wake-music-preview]");
const musicStatus = document.querySelector("[data-music-status]");
const musicStop = document.querySelector("[data-music-stop]");
const overlay = document.querySelector("[data-overlay]");
const overlayClose = document.querySelector("[data-overlay-close]");
const overlayStatus = document.querySelector("[data-overlay-status]");
const overlayTime = document.querySelector("[data-overlay-time]");
const overlayDetail = document.querySelector("[data-overlay-detail]");

let settings = loadSettings();
let records = loadRecords();
let deferredInstallPrompt = null;
let waitingServiceWorker = null;
let reloadingForUpdate = false;
let audioContext = null;
let analyser = null;
let micStream = null;
let sourceNode = null;
let audioData = null;
let frameId = null;
let wakeLock = null;
let musicContext = null;
let musicNodes = [];
let musicTimer = null;
let musicState = null;
let musicAudio = null;
let musicObjectUrl = null;

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
sleepModeInputs.forEach((input) => input.addEventListener("change", updateSettings));
primaryNameInput?.addEventListener("input", updateSettings);
secondaryNameInput?.addEventListener("input", updateSettings);
phoneSideInput?.addEventListener("change", updateSettings);
sharedBedInput?.addEventListener("change", updateSettings);
keepAwakeInput?.addEventListener("change", updateSettings);
startMusicEnabled?.addEventListener("change", updateSettings);
startMusicDuration?.addEventListener("input", updateSettings);
startMusicSource?.addEventListener("change", updateSettings);
startMusicFile?.addEventListener("change", (event) => handleMusicFileSelect("sleep", event));
startMusicLink?.addEventListener("input", updateSettings);
startMusicPreview?.addEventListener("click", () => playMusic("sleep", "preview"));
wakeMusicEnabled?.addEventListener("change", updateSettings);
wakeMusicTime?.addEventListener("change", updateSettings);
wakeMusicDuration?.addEventListener("input", updateSettings);
wakeMusicSource?.addEventListener("change", updateSettings);
wakeMusicFile?.addEventListener("change", (event) => handleMusicFileSelect("wake", event));
wakeMusicLink?.addEventListener("input", updateSettings);
wakeMusicPreview?.addEventListener("click", () => playMusic("wake", "preview"));
musicStop?.addEventListener("click", () => stopMusic());
notificationButton?.addEventListener("click", requestNotificationPermission);
exportButton?.addEventListener("click", exportRecords);
clearButton?.addEventListener("click", clearRecords);
installButton?.addEventListener("click", installApp);
installAction?.addEventListener("click", installApp);
updateAction?.addEventListener("click", applyAppUpdate);
window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
window.addEventListener("appinstalled", handleAppInstalled);
document.addEventListener("visibilitychange", handleVisibilityChange);

registerServiceWorker();
renderAppVersion();
renderSettings();
renderMonitor();
renderRecords();
renderInstallState();
drawCanvas();
window.setInterval(renderMonitor, 1000);
window.setInterval(checkWakeMusicAlarm, 15000);

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
    if (settings.startMusicEnabled || settings.wakeMusicEnabled) {
      await ensureMusicContext().catch(() => {});
    }

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
    showOverlay();
  } catch (error) {
    stopAudio();
    stopMusic({ closeContext: true });
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
  stopMusic({ closeContext: true });
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
    if (!isMusicPlaying()) {
      updateMinute(db, now, deltaMs);
      detectNoise(db, now);
    }
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
  startConfiguredSleepMusic();
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
  const sleeper = classifyEventSleeper(type, durationMs, maxOverDb, avgOverDb);
  const event = {
    id: createId(),
    type,
    sleeper,
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
  if (isLikelySnore(durationMs, maxOverDb, avgOverDb)) return "snore";
  if (durationMs >= 18000) return "long";
  if (maxOverDb >= Number(settings.sensitivity) + 12) return "loud";
  return "noise";
}

function classifyEventSleeper(type, durationMs, maxOverDb, avgOverDb) {
  if (!usesTwoPersonMode()) return "self";
  if (type === "manual") return "self";
  if (settings.phoneSide === "center") return "unknown";

  const nearSleeper = settings.phoneSide === "partner" ? "partner" : "self";
  const farSleeper = nearSleeper === "self" ? "partner" : "self";
  const sensitivity = Number(settings.sensitivity);

  if (type === "snore") {
    if (maxOverDb >= sensitivity + 10 || avgOverDb >= sensitivity + 4) return nearSleeper;
    if (maxOverDb <= sensitivity + 2 && durationMs >= 2500) return farSleeper;
    return "unknown";
  }

  if ((type === "loud" || type === "long") && maxOverDb >= sensitivity + 14) {
    return nearSleeper;
  }

  return "unknown";
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
  session.events.push({ id: createId(), type: "manual", sleeper: "self", startedAt: now, endedAt: now, durationMs: 0 });
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
  const sleeperSummary = getSleeperStats(session.events);
  const snorePenalty = settings.sharedBedMode ? 1.1 : 2.2;
  const score = clamp(Math.round(100 - noiseEvents.length * 3 - snoreEvents.length * snorePenalty - session.wakeWindows.length * 10 - noisyPercent * 0.45), 0, 100);

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
    sleeperSummary,
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
  const snorePenalty = settings.sharedBedMode ? 1 : 2;
  const score = session.active ? Math.max(0, 100 - noiseEvents.length * 3 - snoreEvents.length * snorePenalty - session.wakeWindows.length * 8) : records[0]?.score ?? null;

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
  renderSleeperPanel();
  if (startButton) startButton.disabled = session.active;
  if (stopButton) stopButton.disabled = !session.active;
  if (dimButton) dimButton.disabled = !session.active;
  if (markAwakeButton) markAwakeButton.disabled = !session.active;
  renderEvents();
  renderOverlay();
  renderMusicStatus();
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
  if (session.status === "monitoring") return usesTwoPersonMode() ? "두 사람 소리를 나누어 추정 기록합니다." : "한 사람 기준으로 수면 소리를 기록합니다.";
  return "시작하면 15초 동안 조용한 기준을 잡습니다.";
}

function getEventSummary(noiseEvents, snoreEvents) {
  if (noiseEvents.length === 0 && snoreEvents.length === 0) return session.active ? "조용합니다." : "아직 기록 없음";
  if (usesTwoPersonMode() && snoreEvents.length > 0) {
    const stats = getSleeperStats(session.events);
    return `${getSleeperName("self")} ${stats.self.snore}회 · ${getSleeperName("partner")} ${stats.partner.snore}회 · 구분 ${stats.unknown.snore}회`;
  }
  if (snoreEvents.length > 0) return `방해 ${noiseEvents.length}회 · 코골이 추정 ${snoreEvents.length}회`;
  return `방해 ${noiseEvents.length}회 · 깸 가능성 ${session.wakeWindows.length}회`;
}

function renderSleeperPanel() {
  if (!sleeperPanel || !sleeperGrid) return;

  const stats = getSleeperStats(session.events);
  const cards = usesTwoPersonMode()
    ? [
        ["self", getSleeperName("self"), stats.self],
        ["partner", getSleeperName("partner"), stats.partner],
        ["unknown", "구분 어려움", stats.unknown],
      ]
    : [["self", getSleeperName("self"), stats.self]];

  sleeperPanel.hidden = false;
  if (sleeperModeLabel) sleeperModeLabel.textContent = usesTwoPersonMode() ? "2명" : "1명";
  if (sleeperSummary) {
    sleeperSummary.textContent = usesTwoPersonMode() ? `${getPhoneSideLabel()} 기준 추정` : "1명 기준";
  }

  sleeperGrid.innerHTML = "";
  cards.forEach(([, label, item]) => {
    const card = document.createElement("article");
    const name = document.createElement("span");
    const snore = document.createElement("strong");
    const detail = document.createElement("small");

    card.className = "sleeper-card";
    name.textContent = label;
    snore.textContent = `코골이 ${item.snore}회`;
    detail.textContent = `방해 ${item.noise}회`;
    card.append(name, snore, detail);
    sleeperGrid.append(card);
  });
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
    title.textContent = getEventTitle(event.type, event.sleeper);
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
    const sleeperMeta = getRecordSleeperMeta(record);
    title.textContent = formatDate(record.startedAt);
    meta.textContent = `${formatDuration(record.durationMs)} · ${record.score}점 · ${sleeperMeta}`;
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

async function ensureMusicContext() {
  if (!window.AudioContext && !window.webkitAudioContext) {
    throw new Error("AudioContext is not supported.");
  }
  if (!musicContext) musicContext = new (window.AudioContext || window.webkitAudioContext)();
  if (musicContext.state === "suspended") await musicContext.resume();
  return musicContext;
}

function startConfiguredSleepMusic() {
  if (!session.active || session.startMusicStarted || !settings.startMusicEnabled) return;
  session.startMusicStarted = true;
  playMusic("sleep", "start").catch(() => {
    showNotification("숙면웹", "시작음악을 재생하려면 앱 화면에서 미리 듣기를 눌러보세요.");
  });
}

async function playMusic(kind, reason = "alarm") {
  stopMusic();
  const context = await ensureMusicContext();
  const minutes = kind === "wake" ? settings.wakeMusicDuration : settings.startMusicDuration;
  const duration = reason === "preview" ? 45 : clampMusicMinutes(minutes, 10) * 60;
  const configuredMusic = await playConfiguredMusic(kind, duration);
  if (configuredMusic) {
    notifyMusic(kind, reason);
    renderMusicStatus();
    return;
  }

  const now = context.currentTime;
  const isWake = kind === "wake";
  const master = context.createGain();
  const frequencies = isWake ? [261.63, 329.63, 392, 523.25] : [174.61, 220, 261.63, 329.63];

  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(isWake ? 0.2 : 0.16, now + 2);
  master.gain.linearRampToValueAtTime(isWake ? 0.14 : 0.11, now + Math.max(4, duration - 6));
  master.gain.linearRampToValueAtTime(0, now + duration);
  master.connect(context.destination);
  musicNodes.push(master);

  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = isWake && index >= 2 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.linearRampToValueAtTime(frequency * (isWake ? 1.018 : 1.006), now + duration);
    gain.gain.setValueAtTime((isWake ? 0.045 : 0.035) / (index + 1), now);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now);
    oscillator.stop(now + duration);
    musicNodes.push(oscillator, gain);
  });

  musicState = {
    kind,
    reason,
    source: "generated",
    startedAtMs: Date.now(),
    endsAtMs: Date.now() + duration * 1000,
  };
  musicTimer = window.setTimeout(() => stopMusic(), duration * 1000);
  if (musicStop) musicStop.disabled = false;
  notifyMusic(kind, reason);
  renderMusicStatus();
}

async function playConfiguredMusic(kind, duration) {
  const sourceType = getMusicSetting(kind, "Source");
  if (sourceType === "generated") return false;

  if (sourceType === "asset") {
    const url = kind === "wake" ? DEFAULT_WAKE_MUSIC_URL : DEFAULT_SLEEP_MUSIC_URL;
    if (!url) return false;
    return playUrlWithAudioElement(kind, url, duration).catch(() => false);
  }

  if (sourceType === "file") {
    const storedFile = await getStoredMusicFile(kind).catch(() => null);
    if (!storedFile?.blob) {
      setMusicSetting(kind, "FileStored", false);
      saveSettings(settings);
      renderSettings();
      return false;
    }
    return playBlobWithMusicContext(kind, storedFile.blob, duration).catch(() => playBlobWithAudioElement(kind, storedFile.blob, duration));
  }

  if (sourceType === "link") {
    const url = getMusicSetting(kind, "Link").trim();
    if (!url) return false;
    try {
      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) throw new Error("Audio link failed.");
      const blob = await response.blob();
      return await playBlobWithMusicContext(kind, blob, duration);
    } catch {
      return playUrlWithAudioElement(kind, url, duration);
    }
  }

  return false;
}

async function playBlobWithMusicContext(kind, blob, duration) {
  const context = await ensureMusicContext();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0));
  const now = context.currentTime;
  const source = context.createBufferSource();
  const gain = context.createGain();

  source.buffer = audioBuffer;
  source.loop = true;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(kind === "wake" ? 0.65 : 0.48, now + 1.5);
  gain.gain.linearRampToValueAtTime(0, now + duration);
  source.connect(gain);
  gain.connect(context.destination);
  source.start(now);
  source.stop(now + duration);

  musicNodes.push(source, gain);
  startMusicState(kind, "file", duration);
  return true;
}

function playBlobWithAudioElement(kind, blob, duration) {
  const objectUrl = URL.createObjectURL(blob);
  return playUrlWithAudioElement(kind, objectUrl, duration, objectUrl);
}

function playUrlWithAudioElement(kind, url, duration, objectUrl = null) {
  musicAudio = new Audio(url);
  musicObjectUrl = objectUrl;
  musicAudio.loop = true;
  musicAudio.volume = kind === "wake" ? 0.7 : 0.5;
  musicAudio.addEventListener("ended", () => stopMusic(), { once: true });
  startMusicState(kind, getMusicSetting(kind, "Source"), duration);
  return musicAudio.play().then(() => true).catch((error) => {
    stopMusic();
    throw error;
  });
}

function startMusicState(kind, source, duration) {
  musicState = {
    kind,
    reason: "configured",
    source,
    startedAtMs: Date.now(),
    endsAtMs: Date.now() + duration * 1000,
  };
  musicTimer = window.setTimeout(() => stopMusic(), duration * 1000);
  if (musicStop) musicStop.disabled = false;
}

function stopMusic(options = {}) {
  const { closeContext = false } = options;
  if (musicTimer) window.clearTimeout(musicTimer);
  musicTimer = null;
  if (musicAudio) {
    musicAudio.pause();
    musicAudio.removeAttribute("src");
    musicAudio.load();
    musicAudio = null;
  }
  if (musicObjectUrl) {
    URL.revokeObjectURL(musicObjectUrl);
    musicObjectUrl = null;
  }
  musicNodes.forEach((node) => {
    try {
      node.stop?.();
      node.disconnect?.();
    } catch {
      // Already stopped.
    }
  });
  musicNodes = [];
  musicState = null;
  if (closeContext) {
    musicContext?.close().catch(() => {});
    musicContext = null;
  }
  if (musicStop) musicStop.disabled = true;
  renderMusicStatus();
}

function isMusicPlaying() {
  return Boolean(musicState && musicState.endsAtMs > Date.now());
}

function checkWakeMusicAlarm() {
  if (!session.active || !settings.wakeMusicEnabled || !settings.wakeMusicTime) return;
  const now = new Date();
  const timeKey = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const dateKey = getDateKey(now);
  if (timeKey !== settings.wakeMusicTime || settings.lastWakeMusicDate === dateKey) return;
  settings.lastWakeMusicDate = dateKey;
  saveSettings(settings);
  playMusic("wake", "alarm").catch(() => {
    showNotification("숙면웹", "기상음악 시간이 되었어요. 앱 화면에서 미리 듣기를 눌러 재생할 수 있습니다.");
  });
}

function notifyMusic(kind, reason) {
  const name = kind === "wake" ? "기상음악" : "시작음악";
  const message = reason === "preview" ? `${name} 미리 듣기 중입니다.` : `${name}이 재생됩니다.`;
  showNotification("숙면웹", message);
}

async function handleMusicFileSelect(kind, event) {
  const file = event.target?.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("audio/")) {
    alert("오디오 파일만 선택할 수 있습니다.");
    event.target.value = "";
    return;
  }

  try {
    await saveStoredMusicFile(kind, file);
    setMusicSetting(kind, "Source", "file");
    setMusicSetting(kind, "FileName", file.name);
    setMusicSetting(kind, "FileStored", true);
    saveSettings(settings);
    renderSettings();
    showNotification("숙면웹", `${getMusicKindName(kind)} 파일을 저장했습니다.`);
  } catch {
    alert("음악 파일 저장에 실패했습니다. 파일 크기가 너무 크거나 브라우저 저장공간이 부족할 수 있습니다.");
  } finally {
    event.target.value = "";
  }
}

function openMusicDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is not supported."));
      return;
    }

    const request = indexedDB.open(MUSIC_DB_NAME, MUSIC_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MUSIC_STORE_NAME)) {
        db.createObjectStore(MUSIC_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveStoredMusicFile(kind, file) {
  const db = await openMusicDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(MUSIC_STORE_NAME, "readwrite");
    transaction.objectStore(MUSIC_STORE_NAME).put({
      id: kind,
      name: file.name,
      type: file.type,
      size: file.size,
      updatedAt: Date.now(),
      blob: file,
    });
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

async function getStoredMusicFile(kind) {
  const db = await openMusicDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(MUSIC_STORE_NAME, "readonly");
    const request = transaction.objectStore(MUSIC_STORE_NAME).get(kind);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
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
  renderMusicStatus();
}

function renderMusicStatus() {
  if (!musicStatus) return;
  if (isMusicPlaying()) {
    musicStatus.textContent = musicState?.kind === "wake" ? "기상음악 재생 중" : "시작음악 재생 중";
    return;
  }

  const summaries = [];
  if (settings.startMusicEnabled) summaries.push(`시작 ${settings.startMusicDuration}분 · ${getMusicSourceLabel("sleep")}`);
  if (settings.wakeMusicEnabled) summaries.push(`기상 ${settings.wakeMusicTime} · ${settings.wakeMusicDuration}분 · ${getMusicSourceLabel("wake")}`);
  musicStatus.textContent = summaries.length ? summaries.join(" · ") : "음악 꺼짐";
}

function updateSettings() {
  const selectedSleepMode = Array.from(sleepModeInputs).find((input) => input.checked)?.value;
  settings.sleepMode = selectedSleepMode || settings.sleepMode;
  settings.primaryName = normalizeName(primaryNameInput?.value, DEFAULT_SETTINGS.primaryName);
  settings.secondaryName = normalizeName(secondaryNameInput?.value, DEFAULT_SETTINGS.secondaryName);
  settings.phoneSide = phoneSideInput?.value || settings.phoneSide;
  settings.sensitivity = Number(sensitivityInput?.value || settings.sensitivity);
  settings.sharedBedMode = Boolean(sharedBedInput?.checked);
  settings.keepAwake = Boolean(keepAwakeInput?.checked);
  settings.startMusicEnabled = Boolean(startMusicEnabled?.checked);
  settings.startMusicDuration = clampMusicMinutes(startMusicDuration?.value, settings.startMusicDuration);
  settings.startMusicSource = normalizeMusicSource(startMusicSource?.value || settings.startMusicSource);
  settings.startMusicLink = normalizeMusicLink(startMusicLink?.value || "");
  settings.wakeMusicEnabled = Boolean(wakeMusicEnabled?.checked);
  settings.wakeMusicTime = wakeMusicTime?.value || settings.wakeMusicTime;
  settings.wakeMusicDuration = clampMusicMinutes(wakeMusicDuration?.value, settings.wakeMusicDuration);
  settings.wakeMusicSource = normalizeMusicSource(wakeMusicSource?.value || settings.wakeMusicSource);
  settings.wakeMusicLink = normalizeMusicLink(wakeMusicLink?.value || "");
  if (session.baselineDb !== null) session.thresholdDb = session.baselineDb + Number(settings.sensitivity);
  saveSettings(settings);
  renderSettings();
  renderMonitor();
}

function renderSettings() {
  sleepModeInputs.forEach((input) => {
    input.checked = input.value === settings.sleepMode;
  });
  if (sleepModeLabel) sleepModeLabel.textContent = usesTwoPersonMode() ? "2명" : "1명";
  if (twoPersonSettings) twoPersonSettings.hidden = !usesTwoPersonMode();
  if (primaryNameInput) primaryNameInput.value = getSleeperName("self");
  if (secondaryNameInput) secondaryNameInput.value = getSleeperName("partner");
  if (phoneSideInput) phoneSideInput.value = settings.phoneSide;
  if (sensitivityInput) sensitivityInput.value = String(settings.sensitivity);
  if (sensitivityLabel) sensitivityLabel.textContent = settings.sensitivity <= 9 ? "예민" : settings.sensitivity >= 18 ? "둔감" : "보통";
  if (sharedBedInput) sharedBedInput.checked = settings.sharedBedMode;
  if (keepAwakeInput) keepAwakeInput.checked = settings.keepAwake;
  if (startMusicEnabled) startMusicEnabled.checked = settings.startMusicEnabled;
  if (startMusicDuration) startMusicDuration.value = String(settings.startMusicDuration);
  if (startMusicSource) startMusicSource.value = settings.startMusicSource;
  if (startMusicLink) startMusicLink.value = settings.startMusicLink;
  if (startMusicFileName) startMusicFileName.textContent = settings.startMusicFileStored ? settings.startMusicFileName || "저장된 파일" : "선택된 파일 없음";
  if (startMusicFileRow) startMusicFileRow.hidden = settings.startMusicSource !== "file";
  if (startMusicLinkRow) startMusicLinkRow.hidden = settings.startMusicSource !== "link";
  if (wakeMusicEnabled) wakeMusicEnabled.checked = settings.wakeMusicEnabled;
  if (wakeMusicTime) wakeMusicTime.value = settings.wakeMusicTime;
  if (wakeMusicDuration) wakeMusicDuration.value = String(settings.wakeMusicDuration);
  if (wakeMusicSource) wakeMusicSource.value = settings.wakeMusicSource;
  if (wakeMusicLink) wakeMusicLink.value = settings.wakeMusicLink;
  if (wakeMusicFileName) wakeMusicFileName.textContent = settings.wakeMusicFileStored ? settings.wakeMusicFileName || "저장된 파일" : "선택된 파일 없음";
  if (wakeMusicFileRow) wakeMusicFileRow.hidden = settings.wakeMusicSource !== "file";
  if (wakeMusicLinkRow) wakeMusicLinkRow.hidden = settings.wakeMusicSource !== "link";
  renderMusicStatus();
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
  if (overlayDetail) {
    const stats = getSleeperStats(session.events);
    overlayDetail.textContent = usesTwoPersonMode()
      ? `${getSleeperName("self")} ${stats.self.snore}회 · ${getSleeperName("partner")} ${stats.partner.snore}회`
      : `이벤트 ${session.events.length}회 · 코골이 ${session.events.filter((event) => event.type === "snore").length}회`;
  }
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
    startMusicStarted: false,
  };
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadingForUpdate) return;
    reloadingForUpdate = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").then((registration) => {
      watchServiceWorkerRegistration(registration);
      registration.update().catch(() => {});
      window.setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000);
    }).catch(() => {});
  });
}

function watchServiceWorkerRegistration(registration) {
  if (registration.waiting && navigator.serviceWorker.controller) {
    showUpdateAvailable(registration.waiting);
  }

  registration.addEventListener("updatefound", () => {
    const newWorker = registration.installing;
    if (!newWorker) return;
    newWorker.addEventListener("statechange", () => {
      if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
        showUpdateAvailable(newWorker);
      }
    });
  });
}

function showUpdateAvailable(worker) {
  waitingServiceWorker = worker;
  if (updatePanel) updatePanel.hidden = false;
  if (installPanel) installPanel.hidden = true;
  if (updateMessage) updateMessage.textContent = `현재 ${formatAppVersion()} 사용 중입니다. 업데이트를 적용하면 최신 숙면웹으로 다시 열립니다.`;
}

function applyAppUpdate() {
  if (!waitingServiceWorker) {
    window.location.reload();
    return;
  }
  waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
  window.setTimeout(() => window.location.reload(), 1800);
}

function renderAppVersion() {
  if (appVersionLabel) appVersionLabel.textContent = formatAppVersion();
}

function formatAppVersion() {
  return `v${APP_VERSION} · ${APP_UPDATED_AT}`;
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
  if (waitingServiceWorker) {
    if (installPanel) installPanel.hidden = true;
    return;
  }
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

function usesTwoPersonMode() {
  return settings.sleepMode === "two";
}

function normalizeName(value, fallback) {
  const text = String(value || "").trim();
  return text.length > 0 ? text.slice(0, 8) : fallback;
}

function getSleeperName(sleeper) {
  if (sleeper === "self") return normalizeName(settings.primaryName, DEFAULT_SETTINGS.primaryName);
  if (sleeper === "partner") return normalizeName(settings.secondaryName, DEFAULT_SETTINGS.secondaryName);
  return "구분 어려움";
}

function getPhoneSideLabel() {
  return {
    self: `${getSleeperName("self")} 쪽`,
    partner: `${getSleeperName("partner")} 쪽`,
    center: "가운데",
  }[settings.phoneSide] || "폰 위치";
}

function getSleeperStats(events) {
  const stats = {
    self: { snore: 0, noise: 0 },
    partner: { snore: 0, noise: 0 },
    unknown: { snore: 0, noise: 0 },
  };

  events.forEach((event) => {
    const key = event.sleeper === "self" || event.sleeper === "partner" ? event.sleeper : "unknown";
    if (event.type === "snore") stats[key].snore += 1;
    if (["noise", "long", "loud", "manual"].includes(event.type)) stats[key].noise += 1;
  });

  return stats;
}

function getRecordSleeperMeta(record) {
  const stats = record.sleeperSummary || getSleeperStats(record.events || []);
  if (record.settings?.sleepMode === "two" || usesTwoPersonMode()) {
    const selfName = normalizeName(record.settings?.primaryName, DEFAULT_SETTINGS.primaryName);
    const partnerName = normalizeName(record.settings?.secondaryName, DEFAULT_SETTINGS.secondaryName);
    return `${selfName} 코골이 ${stats.self.snore}회 · ${partnerName} ${stats.partner.snore}회 · 구분 ${stats.unknown.snore}회`;
  }

  return `코골이 ${record.snoreCount || stats.self.snore || 0}회`;
}

function getMusicKindName(kind) {
  return kind === "wake" ? "기상음악" : "시작음악";
}

function getMusicPrefix(kind) {
  return kind === "wake" ? "wakeMusic" : "startMusic";
}

function getMusicSetting(kind, suffix) {
  return settings[`${getMusicPrefix(kind)}${suffix}`] ?? "";
}

function setMusicSetting(kind, suffix, value) {
  settings[`${getMusicPrefix(kind)}${suffix}`] = value;
}

function getMusicSourceLabel(kind) {
  const source = getMusicSetting(kind, "Source");
  if (source === "asset") return kind === "wake" ? "기본 기상음악" : "기본 잠드는음악";
  if (source === "file") return getMusicSetting(kind, "FileStored") ? "휴대폰 파일" : "파일 선택 필요";
  if (source === "link") return getMusicSetting(kind, "Link") ? "음악 링크" : "링크 필요";
  return "기본음";
}

function normalizeMusicSource(value) {
  return ["asset", "generated", "file", "link"].includes(value) ? value : "generated";
}

function normalizeMusicLink(value) {
  return String(value || "").trim();
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    const nextSettings = { ...DEFAULT_SETTINGS, ...saved };
    if (!saved.sleepMode) nextSettings.sleepMode = saved.sharedBedMode === false ? "single" : "two";
    if (saved.meditationEnabled && saved.wakeMusicEnabled === undefined) nextSettings.wakeMusicEnabled = true;
    if (saved.meditationTime && saved.wakeMusicTime === undefined) nextSettings.wakeMusicTime = saved.meditationTime;
    nextSettings.primaryName = normalizeName(nextSettings.primaryName, DEFAULT_SETTINGS.primaryName);
    nextSettings.secondaryName = normalizeName(nextSettings.secondaryName, DEFAULT_SETTINGS.secondaryName);
    if (!["self", "partner", "center"].includes(nextSettings.phoneSide)) nextSettings.phoneSide = DEFAULT_SETTINGS.phoneSide;
    nextSettings.startMusicDuration = clampMusicMinutes(nextSettings.startMusicDuration, DEFAULT_SETTINGS.startMusicDuration);
    nextSettings.wakeMusicDuration = clampMusicMinutes(nextSettings.wakeMusicDuration, DEFAULT_SETTINGS.wakeMusicDuration);
    nextSettings.startMusicSource = normalizeMusicSource(nextSettings.startMusicSource);
    nextSettings.wakeMusicSource = normalizeMusicSource(nextSettings.wakeMusicSource);
    if (!saved.startMusicSource || saved.startMusicSource === "generated") nextSettings.startMusicSource = "asset";
    if (!saved.wakeMusicSource || saved.wakeMusicSource === "generated") nextSettings.wakeMusicSource = "asset";
    nextSettings.startMusicLink = normalizeMusicLink(nextSettings.startMusicLink);
    nextSettings.wakeMusicLink = normalizeMusicLink(nextSettings.wakeMusicLink);
    nextSettings.startMusicFileName = String(nextSettings.startMusicFileName || "");
    nextSettings.wakeMusicFileName = String(nextSettings.wakeMusicFileName || "");
    nextSettings.startMusicFileStored = Boolean(nextSettings.startMusicFileStored);
    nextSettings.wakeMusicFileStored = Boolean(nextSettings.wakeMusicFileStored);
    return nextSettings;
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

function getEventTitle(type, sleeper = "unknown") {
  const title = { noise: "방해 소리", loud: "큰 소리", long: "긴 소음", snore: "코골이 추정", manual: "깼음 표시" }[type] || "이벤트";
  if (!usesTwoPersonMode()) return title;
  return `${title} · ${getSleeperName(sleeper)}`;
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

function clampMusicMinutes(value, fallback) {
  const minutes = Number.parseInt(value, 10);
  if (!Number.isFinite(minutes)) return clamp(fallback || 10, 1, 30);
  return clamp(minutes, 1, 30);
}

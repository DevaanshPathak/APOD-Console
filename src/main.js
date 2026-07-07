import './style.css';

const APOD_ENDPOINT = 'https://api.nasa.gov/planetary/apod';
const APOD_START_DATE = '1995-06-16';
const RECENT_LIMIT = 10;
const CACHE_PREFIX = 'apod-console:apod:';
const RECENT_KEY = 'apod-console:recent-dates';
const BOOT_LINES = [
  '> ESTABLISHING DEEP SPACE NETWORK LINK...',
  '> AUTHENTICATING APOD UPLINK...',
  '> DECODING IMAGE PACKET...',
  '> LINK ESTABLISHED.',
];
const apiKey = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';
const app = document.querySelector('#app');
const state = {
  activeDate: getTodayDate(),
  requestId: 0,
};
let clockTimer;

function renderLoading(date = state.activeDate) {
  resetAppState();
  stopUtcClock();

  app.innerHTML = `
    <section class="panel panel--center state-panel">
      <p class="eyebrow">APOD-CONSOLE // DEEP SPACE IMAGE LINK</p>
      <h1>Acquiring Signal</h1>
      <p class="state-copy">Checking local cache and NASA APOD uplink for ${escapeHtml(date)}...</p>
    </section>
  `;
}

function renderError(message, date = state.activeDate) {
  resetAppState();
  stopUtcClock();

  app.innerHTML = `
    <section class="panel panel--center panel--error state-panel">
      <p class="eyebrow">SIGNAL LOST</p>
      <h1>Uplink Failed</h1>
      <p class="state-copy">${escapeHtml(message)}</p>
      <button class="button" type="button" data-retry>Retry Uplink</button>
    </section>
  `;

  app.querySelector('[data-retry]').addEventListener('click', () => loadApodForDate(date));
}

function renderApod(apod, cacheState = 'LIVE FETCH', target = app) {
  document.title = `APOD Console // ${apod.title}`;

  target.innerHTML = `
    <article class="console">
      <header class="site-header">
        <div class="mission-id">
          <span class="status-dot" aria-hidden="true"></span>
          <span>APOD-CONSOLE // DEEP SPACE IMAGE LINK</span>
        </div>
        <time class="utc-clock" data-utc-clock datetime="">--:--:--Z</time>
      </header>

      <div class="console-grid">
        <section class="viewfinder-panel" aria-label="Astronomy Picture of the Day media">
          <div class="viewfinder">
            ${renderMedia(apod)}
            ${renderReticles()}
            <div class="viewfinder__overlay">
              <p class="eyebrow">${escapeHtml(getMediaType(apod))} TRANSMISSION</p>
              <h1>${escapeHtml(apod.title)}</h1>
              <time datetime="${escapeAttribute(apod.date)}">${escapeHtml(apod.date)}</time>
            </div>
          </div>
        </section>

        <aside class="sidebar" aria-label="Mission telemetry">
          ${renderMissionControls(apod)}
          ${renderSignalData(apod, cacheState)}
        </aside>
      </div>

      <section class="panel transmission-log">
        <p class="eyebrow">TRANSMISSION LOG</p>
        <p class="explanation">${escapeHtml(apod.explanation)}</p>
      </section>

      <footer class="site-footer">
        <span>NASA Astronomy Picture of the Day API</span>
        <span>Public deep space image link</span>
      </footer>
    </article>
  `;

  bindConsoleControls(target);
  startUtcClock();
}

function renderMedia(apod) {
  if (apod.media_type === 'image') {
    return `
      <img
        class="apod-media apod-media--image"
        src="${escapeAttribute(apod.url)}"
        alt="${escapeAttribute(apod.title)}"
      />
    `;
  }

  if (apod.media_type === 'video') {
    return `
      <iframe
        class="apod-media apod-media--video"
        src="${escapeAttribute(apod.url)}"
        title="${escapeAttribute(apod.title)}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
    `;
  }

  return `
    <div class="unsupported-media">
      <p>Unsupported APOD media type: ${escapeHtml(apod.media_type)}</p>
      <a href="${escapeAttribute(apod.url)}" rel="noreferrer" target="_blank">Open NASA media link</a>
    </div>
  `;
}

function renderReticles() {
  return `
    <span class="reticle reticle--top-left" aria-hidden="true"></span>
    <span class="reticle reticle--top-right" aria-hidden="true"></span>
    <span class="reticle reticle--bottom-left" aria-hidden="true"></span>
    <span class="reticle reticle--bottom-right" aria-hidden="true"></span>
  `;
}

function renderMissionControls(apod) {
  return `
    <section class="panel sidebar-panel">
      <p class="eyebrow">MISSION CONTROLS</p>
      <div class="control-stack">
        <label class="control-label" for="apod-date">Target Date</label>
        <input
          id="apod-date"
          class="date-input"
          type="date"
          min="${APOD_START_DATE}"
          max="${getTodayDate()}"
          value="${escapeAttribute(apod.date)}"
          data-date-input
        />
        <div class="button-row">
          <button class="button button--secondary" type="button" data-today>Today</button>
          <button class="button" type="button" data-random>Random Signal</button>
        </div>
      </div>
      <div class="recent-block">
        <p class="readout-label">Recent Transmissions</p>
        <div class="recent-strip" aria-label="Recent transmissions">
          ${renderRecentTransmissions(apod.date)}
        </div>
      </div>
    </section>
  `;
}

function renderSignalData(apod, cacheState) {
  return `
    <section class="panel sidebar-panel">
      <p class="eyebrow">SIGNAL DATA</p>
      <dl class="stats-readout">
        <div>
          <dt>Media Type</dt>
          <dd>${escapeHtml(getMediaType(apod))}</dd>
        </div>
        <div>
          <dt>Sol Count</dt>
          <dd>${escapeHtml(getSolCount(apod.date))}</dd>
        </div>
        <div>
          <dt>Credit</dt>
          <dd>${escapeHtml(apod.copyright || 'UNCREDITED / PUBLIC DOMAIN')}</dd>
        </div>
        <div>
          <dt>Cache State</dt>
          <dd>${escapeHtml(cacheState)}</dd>
        </div>
      </dl>
    </section>
  `;
}

function renderRecentTransmissions(activeDate) {
  const recentDates = getRecentDates();

  if (recentDates.length === 0) {
    return '<span class="recent-empty">No local signals</span>';
  }

  return recentDates.map((date) => renderRecentTransmission(date, date === activeDate)).join('');
}

function renderRecentTransmission(date, isActive) {
  const apod = readCachedApod(date);
  const thumbnail = getThumbnailUrl(apod);
  const label = apod?.title || `APOD transmission ${date}`;
  const mediaLabel = getMediaType(apod || { media_type: 'signal' });

  return `
    <button
      class="recent-thumb${isActive ? ' is-active' : ''}"
      type="button"
      data-history-date="${escapeAttribute(date)}"
      aria-label="Load APOD from ${escapeAttribute(date)}"
    >
      ${
        thumbnail
          ? `<img src="${escapeAttribute(thumbnail)}" alt="${escapeAttribute(label)}" />`
          : `<span class="recent-thumb__fallback">${escapeHtml(mediaLabel)}</span>`
      }
      <span>${escapeHtml(date)}</span>
    </button>
  `;
}

function bindConsoleControls(root = app) {
  root.querySelector('[data-date-input]')?.addEventListener('change', (event) => {
    if (event.target.value) {
      loadApodForDate(event.target.value);
    }
  });

  root.querySelector('[data-today]')?.addEventListener('click', () => {
    loadApodForDate(getTodayDate());
  });

  root.querySelector('[data-random]')?.addEventListener('click', () => {
    loadApodForDate(getRandomDate());
  });

  root.querySelectorAll('[data-history-date]').forEach((button) => {
    button.addEventListener('click', () => {
      loadApodForDate(button.dataset.historyDate);
    });
  });
}

async function loadApodForDate(date) {
  let requestedDate;

  try {
    requestedDate = normalizeDate(date);
  } catch (error) {
    renderError(error.message, state.activeDate);
    return;
  }

  const requestId = ++state.requestId;
  state.activeDate = requestedDate;

  const cachedApod = readCachedApod(requestedDate);

  if (cachedApod) {
    saveRecentDate(requestedDate);
    renderApod(cachedApod, 'CACHED');
    return;
  }

  renderLoading(requestedDate);

  try {
    const apod = await fetchApod(requestedDate);

    if (requestId !== state.requestId) {
      return;
    }

    writeCachedApod(apod.date, apod);
    saveRecentDate(apod.date);
    renderApod(apod, 'LIVE FETCH');
  } catch (error) {
    if (requestId !== state.requestId) {
      return;
    }

    renderError(error.message, requestedDate);
  }
}

async function bootAndLoadTodayApod() {
  if (prefersReducedMotion()) {
    await loadApodForDate(getTodayDate());
    return;
  }

  const today = getTodayDate();
  const requestId = ++state.requestId;
  state.activeDate = today;
  stopUtcClock();
  app.classList.add('is-booting');
  app.classList.remove('is-console-ready');
  app.innerHTML = `
    <section class="boot-overlay" aria-label="APOD Console boot sequence">
      <div class="boot-panel">
        <p class="eyebrow">APOD-CONSOLE // BOOT SEQUENCE</p>
        <pre class="boot-log" aria-live="polite" data-boot-log></pre>
        <div class="boot-progress" aria-label="Boot progress">
          <span class="boot-progress__bar" data-boot-progress></span>
        </div>
      </div>
    </section>
    <div class="console-shell" data-console-shell hidden></div>
  `;

  const progress = startBootProgress();
  const bootPromise = runBootSequence(progress);
  const dataPromise = getApod(today);

  try {
    const { apod, cacheState } = await dataPromise;
    await bootPromise;
    await progress.complete();

    if (requestId !== state.requestId) {
      return;
    }

    saveRecentDate(apod.date);
    revealConsoleAfterBoot(apod, cacheState);
  } catch (error) {
    await bootPromise;
    await progress.complete();
    renderError(error.message, today);
  }
}

async function runBootSequence(progress) {
  const bootLog = app.querySelector('[data-boot-log]');

  for (const line of BOOT_LINES) {
    await typeBootLine(bootLog, line);
    await delay(160);
  }

  progress.hold();
}

async function typeBootLine(bootLog, line) {
  for (const character of line) {
    bootLog.textContent += character;
    await delay(18);
  }

  bootLog.textContent += '\n';
}

function startBootProgress() {
  const progressBar = app.querySelector('[data-boot-progress]');
  let progress = 0;
  let isHolding = false;

  const progressTimer = window.setInterval(() => {
    if (isHolding) {
      progress = Math.min(95, progress + 0.35);
      progressBar.classList.add('is-waiting');
    } else {
      progress = Math.min(86, progress + 1.5);
    }

    progressBar.style.width = `${progress}%`;
  }, 70);

  return {
    hold() {
      isHolding = true;
    },
    complete() {
      window.clearInterval(progressTimer);
      progressBar.classList.remove('is-waiting');
      progressBar.style.width = '100%';
      return delay(260);
    },
  };
}

function revealConsoleAfterBoot(apod, cacheState) {
  const consoleShell = app.querySelector('[data-console-shell]');

  if (!consoleShell) {
    renderApod(apod, cacheState);
    return;
  }

  renderApod(apod, cacheState, consoleShell);
  consoleShell.hidden = false;

  window.requestAnimationFrame(() => {
    app.classList.add('is-console-ready');
  });

  window.setTimeout(() => {
    app.querySelector('.boot-overlay')?.remove();
    app.classList.remove('is-booting');
  }, 700);
}

async function getApod(date) {
  const cachedApod = readCachedApod(date);

  if (cachedApod) {
    return {
      apod: cachedApod,
      cacheState: 'CACHED',
    };
  }

  const apod = await fetchApod(date);
  writeCachedApod(apod.date, apod);

  return {
    apod,
    cacheState: 'LIVE FETCH',
  };
}

async function fetchApod(date) {
  const url = new URL(APOD_ENDPOINT);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('date', date);
  url.searchParams.set('thumbs', 'true');

  let response;

  try {
    response = await fetch(url);
  } catch {
    throw new Error('Network request failed. Check the connection and retry the uplink.');
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.msg ||
      payload?.error?.message ||
      `NASA APOD request failed with status ${response.status}.`;
    throw new Error(message);
  }

  if (!payload?.date || !payload?.title || !payload?.media_type) {
    throw new Error('NASA APOD returned an incomplete signal packet.');
  }

  return payload;
}

function readCachedApod(date) {
  try {
    const cached = window.localStorage.getItem(getCacheKey(date));
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function writeCachedApod(date, apod) {
  try {
    window.localStorage.setItem(getCacheKey(date), JSON.stringify(apod));
  } catch {
    // Browsers can reject localStorage when quota is full or storage is disabled.
  }
}

function getCacheKey(date) {
  return `${CACHE_PREFIX}${date}`;
}

function getRecentDates() {
  try {
    const dates = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]');

    if (!Array.isArray(dates)) {
      return [];
    }

    return dates.filter(isValidDateInRange).slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
}

function saveRecentDate(date) {
  const recentDates = getRecentDates();
  const nextDates = [date, ...recentDates.filter((recentDate) => recentDate !== date)].slice(0, RECENT_LIMIT);

  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(nextDates));
  } catch {
    // Recent history is helpful, but the console can still run without it.
  }
}

function startUtcClock() {
  stopUtcClock();
  updateUtcClock();
  clockTimer = window.setInterval(updateUtcClock, 1000);
}

function stopUtcClock() {
  if (!clockTimer) {
    return;
  }

  window.clearInterval(clockTimer);
  clockTimer = null;
}

function updateUtcClock() {
  const clock = document.querySelector('[data-utc-clock]');

  if (!clock) {
    return;
  }

  const now = new Date();
  const utcTime = now.toISOString().slice(11, 19);
  clock.textContent = `${utcTime}Z`;
  clock.dateTime = now.toISOString();
}

function getMediaType(apod) {
  return (apod.media_type || 'unknown').toUpperCase();
}

function getThumbnailUrl(apod) {
  if (!apod) {
    return '';
  }

  if (apod.media_type === 'image') {
    return apod.url || apod.hdurl || '';
  }

  return apod.thumbnail_url || '';
}

function getSolCount(dateString) {
  const start = getUtcDateValue(APOD_START_DATE);
  const current = getUtcDateValue(dateString);
  const elapsedMs = current - start;
  const elapsedDays = Math.max(0, Math.floor(elapsedMs / 86400000));

  return elapsedDays.toLocaleString('en-US');
}

function normalizeDate(dateString) {
  if (!isValidDateInRange(dateString)) {
    throw new Error(`Target date must be between ${APOD_START_DATE} and ${getTodayDate()}.`);
  }

  return dateString;
}

function isValidDateInRange(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }

  const dateValue = getUtcDateValue(dateString);

  if (Number.isNaN(dateValue)) {
    return false;
  }

  if (formatUtcDate(dateValue) !== dateString) {
    return false;
  }

  return dateValue >= getUtcDateValue(APOD_START_DATE) && dateValue <= getUtcDateValue(getTodayDate());
}

function getRandomDate() {
  const start = getUtcDateValue(APOD_START_DATE);
  const end = getUtcDateValue(getTodayDate());
  const dayCount = Math.floor((end - start) / 86400000) + 1;
  const offset = Math.floor(Math.random() * dayCount);

  return formatUtcDate(start + offset * 86400000);
}

function getUtcDateValue(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatUtcDate(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function resetAppState() {
  app.classList.remove('is-booting', 'is-console-ready');
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttribute(value = '') {
  return escapeHtml(value);
}

bootAndLoadTodayApod();

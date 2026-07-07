import './style.css';

const APOD_ENDPOINT = 'https://api.nasa.gov/planetary/apod';
const APOD_START_DATE = '1995-06-16';
const apiKey = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';
const app = document.querySelector('#app');
let clockTimer;

function renderLoading() {
  stopUtcClock();

  app.innerHTML = `
    <section class="panel panel--center state-panel">
      <p class="eyebrow">APOD-CONSOLE // DEEP SPACE IMAGE LINK</p>
      <h1>Acquiring Today's Signal</h1>
      <p>Contacting NASA APOD uplink...</p>
    </section>
  `;
}

function renderError(message) {
  stopUtcClock();

  app.innerHTML = `
    <section class="panel panel--center panel--error state-panel">
      <p class="eyebrow">SIGNAL LOST</p>
      <h1>Uplink Failed</h1>
      <p>${escapeHtml(message)}</p>
      <button class="button" type="button" data-retry>Retry Uplink</button>
    </section>
  `;

  app.querySelector('[data-retry]').addEventListener('click', loadTodayApod);
}

function renderApod(apod) {
  document.title = `APOD Console // ${apod.title}`;

  app.innerHTML = `
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
          ${renderSignalData(apod)}
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
          disabled
        />
        <div class="button-row">
          <button class="button button--secondary" type="button" disabled>Today</button>
          <button class="button" type="button" disabled>Random Signal</button>
        </div>
      </div>
      <div class="recent-block">
        <p class="readout-label">Recent Transmissions</p>
        <div class="recent-strip" aria-label="Recent transmissions">
          <span class="recent-thumb">${escapeHtml(apod.date)}</span>
        </div>
      </div>
    </section>
  `;
}

function renderSignalData(apod) {
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
          <dd>LIVE FETCH</dd>
        </div>
      </dl>
    </section>
  `;
}

async function loadTodayApod() {
  renderLoading();

  try {
    const apod = await fetchTodayApod();
    renderApod(apod);
  } catch (error) {
    renderError(error.message);
  }
}

async function fetchTodayApod() {
  const url = new URL(APOD_ENDPOINT);
  url.searchParams.set('api_key', apiKey);

  const response = await fetch(url);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.msg ||
      payload?.error?.message ||
      `NASA APOD request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return payload;
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

function getSolCount(dateString) {
  const start = getUtcDateValue(APOD_START_DATE);
  const current = getUtcDateValue(dateString);
  const elapsedMs = current - start;
  const elapsedDays = Math.max(0, Math.floor(elapsedMs / 86400000));

  return elapsedDays.toLocaleString('en-US');
}

function getUtcDateValue(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
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

loadTodayApod();

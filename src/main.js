import './style.css';

const APOD_ENDPOINT = 'https://api.nasa.gov/planetary/apod';
const apiKey = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';
const app = document.querySelector('#app');

function renderLoading() {
  app.innerHTML = `
    <section class="panel panel--center">
      <p class="eyebrow">APOD-CONSOLE // DEEP SPACE IMAGE LINK</p>
      <h1>Acquiring Today&apos;s Signal</h1>
      <p>Contacting NASA APOD uplink...</p>
    </section>
  `;
}

function renderError(message) {
  app.innerHTML = `
    <section class="panel panel--center panel--error">
      <p class="eyebrow">SIGNAL LOST</p>
      <h1>Uplink Failed</h1>
      <p>${escapeHtml(message)}</p>
      <button class="button" type="button" data-retry>Retry Uplink</button>
    </section>
  `;

  app.querySelector('[data-retry]').addEventListener('click', loadTodayApod);
}

function renderApod(apod) {
  app.innerHTML = `
    <article class="console">
      <header class="console__header">
        <p class="eyebrow">APOD-CONSOLE // DEEP SPACE IMAGE LINK</p>
        <p class="console__date">${escapeHtml(apod.date)}</p>
      </header>
      <section class="media-panel" aria-label="Astronomy Picture of the Day media">
        ${renderMedia(apod)}
      </section>
      <section class="panel">
        <p class="eyebrow">${escapeHtml(apod.media_type.toUpperCase())} TRANSMISSION</p>
        <h1>${escapeHtml(apod.title)}</h1>
        <p class="explanation">${escapeHtml(apod.explanation)}</p>
      </section>
    </article>
  `;
}

function renderMedia(apod) {
  if (apod.media_type === 'image') {
    return `
      <img
        class="apod-media"
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

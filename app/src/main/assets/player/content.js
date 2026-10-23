// Controla el reproductor de Disney+ desde la app. El <video> está dentro de componentes con
// shadow DOM, así que se busca entrando en ellos, y los eventos se escuchan en el propio video
// (los eventos de reproducción no salen de un shadow DOM).
"use strict";

const port = browser.runtime.connectNative("aadisney");
const EVENTS = ["play", "pause", "ended", "loadedmetadata", "durationchange", "seeked", "ratechange"];

/** Recorre el documento y los shadow DOM (abiertos o cerrados: API de extensiones de Firefox). */
function* deepAll(root, selector) {
  yield* root.querySelectorAll(selector);
  for (const el of root.querySelectorAll("*")) {
    const shadow = el.openOrClosedShadowRoot || el.shadowRoot;
    if (shadow) yield* deepAll(shadow, selector);
  }
}

/**
 * El video principal: primero el que se está reproduciendo, después el de contenido más largo
 * (descarta avances y fondos animados).
 */
function findVideo() {
  const score = (v) => (!v.paused ? 1e9 : 0) + (isFinite(v.duration) ? v.duration : 0);
  let best = null;
  for (const v of deepAll(document, "video")) {
    if (!best || score(v) > score(best)) best = v;
  }
  return best;
}

let current = null;
/** Disney+ reemplaza el elemento al empezar a reproducir: se vuelve a buscar cada vez. */
function refreshVideo() {
  const v = findVideo();
  if (v !== current) {
    current = v;
    if (v) for (const ev of EVENTS) v.addEventListener(ev, report);
    return true;
  }
  return false;
}
function video() {
  if (!current || !current.isConnected) refreshVideo();
  return current;
}

/**
 * La línea de tiempo real. Disney+ transmite por partes: el <video> dice que dura `Infinity` y su
 * `currentTime` no empieza en 0. La barra del propio reproductor (role="slider", "2:07 of 1:41:46")
 * sí tiene la posición y el largo de la película, en segundos.
 */
let timeline = null;
function readTimeline(v) {
  for (const el of deepAll(document, '[role="slider"]')) {
    const now = Number(el.getAttribute("aria-valuenow"));
    const max = Number(el.getAttribute("aria-valuemax"));
    // El volumen también es un slider (0-100); el de tiempo es el que se describe como "x of y".
    if (/ of | de /.test(el.getAttribute("aria-valuetext") || "") && max > 0) {
      timeline = { offset: now - (v ? v.currentTime : 0), max };
      break;
    }
  }
  return timeline;
}

/** Segundos en la película para el `currentTime` del video. */
function moviePos(v) {
  const t = readTimeline(v);
  return t ? v.currentTime + t.offset : v.currentTime;
}

function report() {
  const v = video();
  const t = v ? readTimeline(v) : null;
  port.postMessage({
    ready: !!v,
    playing: !!v && !v.paused && !v.ended,
    title: document.title.replace(/ \| Disney\+$/, ""),
    positionMs: v ? Math.round(moviePos(v) * 1000) : 0,
    // Sin barra del reproductor (en vivo, o todavía no apareció), -1: Android Auto no dibuja la barra.
    durationMs: t ? Math.round(t.max * 1000) : -1,
  });
}

/** Botón del propio reproductor cuyo texto accesible contiene alguna de las palabras. */
function playerButton(words) {
  for (const b of deepAll(document, "button")) {
    const label = (b.getAttribute("aria-label") || b.textContent || "").toLowerCase();
    if (words.some((w) => label.includes(w))) return b;
  }
  return null;
}

const commands = {
  TOGGLE: (v) => (v.paused ? v.play() : v.pause()),
  BACK10: (v) => (v.currentTime = Math.max(0, v.currentTime - 10)),
  FWD10: (v) => (v.currentTime = Math.min(v.duration || Infinity, v.currentTime + 10)),
  NEXT: () => playerButton(["próximo episodio", "siguiente episodio", "next episode"])?.click(),
  PREV: (v) => (v && v.currentTime > 3 ? (v.currentTime = 0) : history.back()),
  FULLSCREEN: () => playerButton(["pantalla completa", "full screen", "fullscreen"])?.click(),
  // La barra del auto da la posición en la película; se traduce al tiempo del video.
  SEEK: (v, msg) => (v.currentTime += msg.ms / 1000 - moviePos(v)),
};

port.onMessage.addListener((msg) => {
  const v = video();
  const run = commands[msg.cmd];
  if (!run || (!v && msg.cmd !== "PREV")) return;
  run(v, msg);
  setTimeout(report, 200);
});

// Disney+ cambia de página sin recargar y crea el video al dar play: se revisa cada segundo.
let lastUrl = "";
setInterval(() => {
  const changed = refreshVideo();
  if (changed || location.href !== lastUrl) {
    lastUrl = location.href;
    report();
  }
}, 1000);
new MutationObserver(report).observe(document.querySelector("title") || document.head, {
  childList: true, subtree: true, characterData: true,
});
report();

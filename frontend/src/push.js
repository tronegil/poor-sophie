import api from './api/client';

// Browser side of calm-passage alerts: permission, subscription, and sending
// the subscription to the backend. Errors carry a `code` the UI explains.
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

/** 'ok' | 'unsupported' | 'ios-install' (iPhone only allows push from the installed app) */
export function pushSupport() {
  const capable = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (isIos() && !isStandalone()) return 'ios-install';
  return capable ? 'ok' : 'unsupported';
}

function fail(code) { const e = new Error(code); e.code = code; return e; }

function urlBase64ToUint8Array(base64) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

/** Asks for permission (once) and registers this device for alerts. */
export async function enablePush() {
  const support = pushSupport();
  if (support !== 'ok') throw fail(support === 'ios-install' ? 'IOS_INSTALL' : 'UNSUPPORTED');

  let key;
  try { key = (await api.get('/push/public-key')).data.key; }
  catch (err) { throw fail(err.response?.status === 503 ? 'NOT_CONFIGURED' : 'NETWORK'); }

  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') throw fail('DENIED');

  // No worker in dev (it is registered in production builds only).
  const reg = await Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(() => r(null), 4000))]);
  if (!reg) throw fail('NO_WORKER');

  const sub = (await reg.pushManager.getSubscription())
    ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }));
  await api.post('/push/subscriptions', sub.toJSON());
}

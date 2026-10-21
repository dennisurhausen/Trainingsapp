/* Service Worker: nur für Pausen-Benachrichtigungen. Kein Caching, damit Updates sofort ankommen. */
const timers = new Map();
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
async function anyVisible(){ const cs = await self.clients.matchAll({type:'window', includeUncontrolled:true}); return cs.some(c => c.visibilityState === 'visible'); }
self.addEventListener('message', e => {
  const d = e.data || {};
  if(d.type === 'cancel'){ const t = timers.get(d.tag||'pause'); if(t){ clearTimeout(t.id); t.res(); timers.delete(d.tag||'pause'); } return; }
  if(d.type === 'pause'){
    const old = timers.get('pause'); if(old){ clearTimeout(old.id); old.res(); }
    e.waitUntil(new Promise(res => {
      const id = setTimeout(async () => {
        timers.delete('pause');
        if(!(await anyVisible())) await self.registration.showNotification(d.title || 'Pause vorbei', {body: d.body || 'Nächster Satz', tag:'pause', renotify:true, requireInteraction:true, vibrate:[300,120,300,120,300], icon:'icon-192.png', badge:'icon-192.png', silent:false});
        res();
      }, Math.max(0, d.delay||0));
      timers.set('pause', {id, res});
    }));
  }
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window', includeUncontrolled:true}).then(cs => { for(const c of cs){ if('focus' in c) return c.focus(); } return self.clients.openWindow('./'); }));
});

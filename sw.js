/* 求職者管理の入口ページの裏で動く部分（サービスワーカー）。2026-11-06
   アプリを閉じていても、システム用PC（tools/chokuei-push-sender）から届いた通知を出し、ホーム画面のアイコンに数字を付ける。
   通知の中身：{ title, body, badge（アイコンの数字＝まだ対応していない人数）, tag, url }。名前は入っていない。
   iPhone は、届いた通知は必ず画面に出す決まり（出さないと通知が止められる）。
   ページの読み込みには手を出さない（いつもどおりネットから読む）。 */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  var n = Math.max(0, Number(d.badge) || 0);
  var jobs = [self.registration.showNotification(d.title || '求職者管理', {
    body: d.body || 'アプリを開いて確かめてください',
    icon: 'icon-192.png',
    tag: d.tag || 'kyushoku',
    renotify: true,
    data: { url: d.url || './' },
  })];
  if (self.navigator && 'setAppBadge' in self.navigator) {
    jobs.push((n > 0 ? self.navigator.setAppBadge(n) : self.navigator.clearAppBadge()).catch(function () { /* 数字を付けられない端末 */ }));
  }
  e.waitUntil(Promise.all(jobs));
});

/* 通知を押したら、アプリ（入口ページ）を開く。もう開いていれば前に出す */
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.indexOf(self.registration.scope) === 0 && 'focus' in list[i]) return list[i].focus();
    }
    return self.clients.openWindow(url);
  }));
});

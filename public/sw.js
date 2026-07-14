self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "BowaGO", body: event.data.text() };
  }

  const title = payload.title || "BowaGO";
  const options = {
    body: payload.body || "",
    icon: "/bowago-logo.svg",
    badge: "/bowago-logo.svg",
    data: payload.data || {},
    tag: payload.data?.trackingNumber || payload.data?.shipmentId || undefined,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Clicking the notification focuses an existing tab if one's open,
// otherwise opens a new one — deep-links to the relevant shipment/ticket
// when the notification payload includes one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = data.shipmentId
    ? `/dashboard/shipments/${data.shipmentId}`
    : data.ticketId
      ? `/dashboard/support?ticket=${data.ticketId}`
      : "/dashboard/notifications";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            return client.navigate?.(targetUrl);
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});

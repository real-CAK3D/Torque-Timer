import "server-only";
import webpush from "web-push";
import { getNotifications, getPushSubs, newId, saveNotifications, savePushSubs } from "./db";
import { getKey } from "./keys";

export async function vapidKeys() {
  const [pub, priv] = await Promise.all([getKey("NEXT_PUBLIC_VAPID_PUBLIC_KEY"), getKey("VAPID_PRIVATE_KEY")]);
  return pub && priv ? { pub, priv } : null;
}
export const pushConfigured = async () => Boolean(await vapidKeys());

export async function notifyOwner(title: string, body: string, url = "/admin") {
  const list = await getNotifications();
  list.unshift({ id: newId(), createdAt: new Date().toISOString(), title, body, url, read: false });
  await saveNotifications(list);

  const keys = await vapidKeys();
  if (!keys) return;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:owner@example.com", keys.pub, keys.priv);
  const subs = await getPushSubs();
  const dead: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(s, JSON.stringify({ title, body, url }));
      } catch (e: unknown) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.endpoint);
      }
    })
  );
  if (dead.length) await savePushSubs(subs.filter((s) => !dead.includes(s.endpoint)));
}

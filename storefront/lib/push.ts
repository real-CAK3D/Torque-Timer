import "server-only";
import webpush from "web-push";
import { getNotifications, getPushSubs, newId, saveNotifications, savePushSubs } from "./db";

export const pushConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

/** Saves an in-app notification and pushes it to every phone/computer that turned notifications on. */
export async function notifyOwner(title: string, body: string, url = "/admin") {
  const list = await getNotifications();
  list.unshift({ id: newId(), createdAt: new Date().toISOString(), title, body, url, read: false });
  await saveNotifications(list);

  if (!pushConfigured()) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:owner@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
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

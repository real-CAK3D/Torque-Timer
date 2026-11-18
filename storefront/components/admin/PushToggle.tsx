"use client";
import { useEffect, useState } from "react";
import { api } from "./api";

function urlB64(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function PushToggle({ vapidKey, configured, deviceCount }: { vapidKey: string; configured: boolean; deviceCount: number }) {
  const [state, setState] = useState<"loading" | "unsupported" | "needs-install" | "off" | "on" | "denied">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const ios = /iPhone|iPad/.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setState(ios && !standalone ? "needs-install" : "unsupported");
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.ready;
      setState((await reg.pushManager.getSubscription()) ? "on" : "off");
    })();
  }, []);

  async function enable() {
    setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState("denied");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64(vapidKey) });
      await api("/api/admin/push", "POST", { subscription: sub.toJSON(), label: navigator.userAgent.slice(0, 60) });
      setState("on");
      setMsg("Notifications are on for this device.");
    } catch (e) {
      setMsg((e as Error).message);
    }
  }
  async function disable() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await api("/api/admin/push", "DELETE", { endpoint: sub.endpoint });
      await sub.unsubscribe();
    }
    setState("off");
  }
  async function test() {
    setMsg("");
    try {
      await api("/api/admin/push", "POST", { test: true });
      setMsg("Test sent. It should pop up in a few seconds.");
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  if (!configured) return <p className="muted">Phone alerts need notification keys first. Open <a href="/admin/keys">Keys</a> and press <strong>Create notification keys</strong>. New orders still show under the bell icon.</p>;

  return (
    <div className="stack">
      {state === "needs-install" ? <p>On iPhone, add the dashboard to your home screen first (steps below), then open it from there.</p> : null}
      {state === "unsupported" ? <p className="muted">This browser can&apos;t receive notifications.</p> : null}
      {state === "denied" ? <p>Notifications are blocked for this site. Allow them in your phone or browser settings, then reload.</p> : null}
      <div className="row wrap">
        {state === "off" ? <button className="b b-primary" onClick={enable}>Turn on notifications</button> : null}
        {state === "on" ? <><button className="b" onClick={test}>Send a test</button><button className="b b-ghost" onClick={disable}>Turn off on this device</button></> : null}
      </div>
      <p className="muted small">{deviceCount} device{deviceCount === 1 ? "" : "s"} getting order alerts.</p>
      {msg ? <p aria-live="polite">{msg}</p> : null}
    </div>
  );
}

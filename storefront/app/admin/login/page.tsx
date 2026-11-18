import { LoginForm } from "@/components/admin/LoginForm";
import { getSettings } from "@/lib/db";

export const metadata = { title: "Owner login" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, s] = await Promise.all([searchParams, getSettings()]);
  return (
    <div className="login">
      <div className="login-card">
        <div className="login-mark" aria-hidden>
          <svg viewBox="0 0 120 120" width="64" height="64">
            <path d="M60 6 L106 22 V60 C106 88 86 106 60 114 C34 106 14 88 14 60 V22 Z" fill="currentColor" />
            <path d="M60 30 l4.4 9 9.9 1.4 -7.2 7 1.7 9.8 -8.8 -4.6 -8.8 4.6 1.7 -9.8 -7.2 -7 9.9 -1.4 z" fill="var(--gold)" />
          </svg>
        </div>
        <h1>{s.businessName}</h1>
        <p className="muted">Owner login. Customers never see this page.</p>
        <LoginForm next={next && next.startsWith("/admin") ? next : "/admin"} />
      </div>
    </div>
  );
}

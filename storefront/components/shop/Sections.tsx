import { paragraphs } from "@/lib/format";
import type { SiteSettings } from "@/lib/types";
import { ContactForm } from "./ContactForm";
import { Social } from "./Social";

export function VeteranBadge({ s }: { s: SiteSettings }) {
  if (!s.showVeteranBadge) return null;
  return (
    <p className="vet-badge">
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" fill="currentColor" />
      </svg>
      {s.serviceLine || "Veteran owned"}
    </p>
  );
}

export function About({ s }: { s: SiteSettings }) {
  return (
    <section id="about" className="section about">
      <div className="about-inner">
        {s.aboutImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.aboutImage} alt="" className="about-img" />
        ) : null}
        <div className="prose">
          <h1>{s.aboutTitle}</h1>
          {paragraphs(s.about).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <VeteranBadge s={s} />
        </div>
      </div>
    </section>
  );
}

export function Contact({ s, always = false }: { s: SiteSettings; always?: boolean }) {
  const any = s.showContactForm || s.contactEmail || s.contactPhone || s.location || Object.values(s.social).some(Boolean);
  if (!any && !always) return null;
  return (
    <section id="contact" className="section contact">
      {/*
          EDIT-POINT: HOME-PAGE-SECTIONS
          The About and Contact pages (/about, /contact). The words come from
          site-variables.ts (about, contact) or the dashboard.
          */}
      <h1>{s.contactHeading}</h1>
      {s.contactText ? <p className="muted">{s.contactText}</p> : null}
      <ul className="contact-list">
        {s.contactEmail ? (
          <li>
            <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a>
          </li>
        ) : null}
        {s.contactPhone ? (
          <li>
            <a href={`tel:${s.contactPhone.replace(/[^0-9+]/g, "")}`}>{s.contactPhone}</a>
          </li>
        ) : null}
        {s.location ? <li>{s.location}</li> : null}
      </ul>
      <Social links={s.social} />
      {s.showContactForm ? <ContactForm /> : null}
    </section>
  );
}

import type { SiteSettings } from "@/lib/types";
import { Logo } from "./Logo";
import { Social } from "./Social";

export function Footer({ s }: { s: SiteSettings }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Logo s={s} size={40} />
          <div>
            <strong>{s.businessName}</strong>
            {s.showVeteranBadge && s.serviceLine ? <p className="muted">{s.serviceLine}</p> : null}
          </div>
        </div>
        <div className="footer-policies">
          {s.shippingPolicy ? (
            <details>
              <summary>Shipping</summary>
              <p>{s.shippingPolicy}</p>
            </details>
          ) : null}
          {s.returnPolicy ? (
            <details>
              <summary>Returns</summary>
              <p>{s.returnPolicy}</p>
            </details>
          ) : null}
        </div>
        <Social links={s.social} />
      </div>
      {/* ========================================================================
          EDIT-POINT: FOOTER
          Small print at the very bottom of every shop page.
          ======================================================================== */}
      <p className="fine">
        © {new Date().getFullYear()} {s.businessName}. Secure checkout by Stripe. Apple Pay and Google Pay accepted.
      </p>
    </footer>
  );
}

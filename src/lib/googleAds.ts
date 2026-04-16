declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GOOGLE_ADS_ID = 'AW-18093673978';
const GOOGLE_ADS_LEAD_LABEL = '-cGiCIvh2JwcEPqb3rND';

export function trackGoogleAdsLead() {
  window.gtag?.('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LEAD_LABEL}`,
  });
}

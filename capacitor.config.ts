import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "fit.gymsanity.app",
  appName: "Gymsanity",
  // Placeholder for `cap sync`; runtime loads the production site via server.url.
  webDir: "capacitor-web",
  server: {
    // Production web app — Capacitor WebView loads this URL instead of bundled assets.
    url: "https://gymsanity.fit",
    cleartext: false,
    // Allow in-WebView navigation for app + Stripe Checkout / Customer Portal.
    // Do not add cleartext / localhost URLs here for committed production config.
    allowNavigation: [
      "gymsanity.fit",
      "*.gymsanity.fit",
      "checkout.stripe.com",
      "billing.stripe.com",
      "js.stripe.com",
      "*.stripe.com",
    ],
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;

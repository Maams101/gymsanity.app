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
    // Allow navigation within the Gymsanity domain (Stripe checkout, etc.).
    allowNavigation: ["gymsanity.fit", "*.gymsanity.fit", "checkout.stripe.com"],
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

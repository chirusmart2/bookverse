import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bookverse.owner",
  appName: "BookVerse Owner",
  webDir: "../frontend/owner-portal/dist",
  server: { androidScheme: "https" },
};

export default config;

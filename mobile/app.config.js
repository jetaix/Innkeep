/*
 * For Expo's build service only. Exact reads `app.json`; EAS reads this file
 * to know which project, bundle identifier and package a build belongs to.
 * Keep the two identifiers the same as `app.id` in `app.json`.
 *
 * EAS_PROJECT_ID is the id of the project on expo.dev (Project settings),
 * EXPO_OWNER the account it lives under. Neither is a secret.
 */
const ID = "io.github.jetaix.innkeep.mobile";

module.exports = {
  name: "Innkeep",
  slug: process.env.EXPO_SLUG || "inkeepclub",
  owner: process.env.EXPO_OWNER || "j3studio",
  version: process.env.EXACT_VERSION || "0.1.0",
  ios: { bundleIdentifier: ID, infoPlist: { ITSAppUsesNonExemptEncryption: false } },
  android: { package: ID },
  extra: { eas: { projectId: process.env.EAS_PROJECT_ID || "28502d83-c21e-4aec-bd36-5cdbadf24249" } },
};

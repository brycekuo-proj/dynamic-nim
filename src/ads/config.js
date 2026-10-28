// AdMob settings for the Android app. The web build never loads ads.
//
// Real AdMob IDs for the app (created in AdMob as "Dynamic Nim", now Sweetie Nim) (publisher pub-3164945301503336);
// the App ID lives in android/app/src/main/AndroidManifest.xml.
//
// USE_TEST_ADS stays true for every development and closed-testing build: the
// SDK then serves Google's test ads instead of these units, so tapping ads on
// your own devices can never earn invalid clicks or get the account flagged.
// Set it to false only for the production release build.
export const ADS = Object.freeze({
  // Master switch. Off until the AdMob account is approved, which needs the
  // app to be live on Google Play first: with it off the SDK never starts,
  // no consent form shows and no ad space is reserved.
  ENABLED: false,
  USE_TEST_ADS: true,
  BANNER_ID: 'ca-app-pub-3164945301503336/2122455168',        // "Bottom banner"
  INTERSTITIAL_ID: 'ca-app-pub-3164945301503336/9809373494',  // "Level break interstitial"

  // Show an interstitial only after a won campaign level whose number is a
  // multiple of this, and never more often than the cooldown. Book puzzles
  // and the first levels stay ad-free.
  INTERSTITIAL_EVERY_LEVELS: 3,
  INTERSTITIAL_COOLDOWN_MS: 3 * 60 * 1000,

  // Audience. Play Console's target audience must match: if the app targets
  // children under 13, set CHILD_DIRECTED to true and the rating to 'General'.
  CHILD_DIRECTED: false,
  MAX_AD_CONTENT_RATING: 'ParentalGuidance',
});

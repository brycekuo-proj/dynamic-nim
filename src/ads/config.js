// AdMob settings for the Android app. The web build never loads ads.
//
// Until the real AdMob app and ad units exist, these are Google's official
// test IDs (https://developers.google.com/admob/android/test-ads). Test IDs
// always serve test ads and can never earn or get the account flagged.
// Replace the three IDs below (and APPLICATION_ID in
// android/app/src/main/AndroidManifest.xml) with the real ones before release,
// and set USE_TEST_ADS to false.
export const ADS = Object.freeze({
  USE_TEST_ADS: true,
  BANNER_ID: 'ca-app-pub-3940256099942544/9214589741',        // adaptive banner (test)
  INTERSTITIAL_ID: 'ca-app-pub-3940256099942544/1033173712',  // interstitial (test)

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

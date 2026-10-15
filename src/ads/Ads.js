import { ADS } from './config.js';

// Ads run only inside the native Android app (Capacitor). In a normal browser
// every method is a no-op, so the GitHub Pages version stays ad-free.
// Order on start: UMP consent (EEA/UK users) -> SDK init -> bottom banner.
export class Ads {
  constructor() {
    this.native = false; this.admob = null; this.ready = false;
    this.lastInterstitial = 0; this.interstitialLoaded = false;
    this.privacyRequired = false;
  }

  async start() {
    try {
      // The native shell injects window.Capacitor before the page loads, so a plain
      // browser never downloads the Capacitor or AdMob code at all.
      if (!window.Capacitor?.isNativePlatform?.()) return;
      this.native = true;
      const mod = await import('@capacitor-community/admob');
      this.admob = mod.AdMob; this.mod = mod;
      let consent = await this.admob.requestConsentInfo();
      if (consent.isConsentFormAvailable && consent.status === mod.AdmobConsentStatus.REQUIRED) {
        consent = await this.admob.showConsentForm();
      }
      this.privacyRequired = consent.privacyOptionsRequirementStatus === 'REQUIRED';
      document.body.classList.toggle('privacy-options', this.privacyRequired);
      if (!consent.canRequestAds) return;
      await this.admob.initialize({
        tagForChildDirectedTreatment: ADS.CHILD_DIRECTED,
        tagForUnderAgeOfConsent: ADS.CHILD_DIRECTED,
        maxAdContentRating: ADS.MAX_AD_CONTENT_RATING,
      });
      this.ready = true;
      await this.showBanner();
      void this.loadInterstitial();
    } catch (error) {
      console.warn('[ads] start failed', error);
    }
  }

  async showBanner() {
    if (!this.ready) return;
    const { BannerAdSize, BannerAdPosition, BannerAdPluginEvents } = this.mod;
    // Reserve space at the bottom so the banner never covers the board or buttons.
    await this.admob.addListener(BannerAdPluginEvents.SizeChanged, size => {
      document.documentElement.style.setProperty('--ad-bottom', `${Math.ceil(size.height)}px`);
    });
    await this.admob.showBanner({
      adId: ADS.BANNER_ID, isTesting: ADS.USE_TEST_ADS,
      adSize: BannerAdSize.ADAPTIVE_BANNER, position: BannerAdPosition.BOTTOM_CENTER, margin: 0,
    });
  }

  async loadInterstitial() {
    if (!this.ready || this.interstitialLoaded) return;
    try {
      await this.admob.prepareInterstitial({ adId: ADS.INTERSTITIAL_ID, isTesting: ADS.USE_TEST_ADS });
      this.interstitialLoaded = true;
    } catch (error) { console.warn('[ads] interstitial load failed', error); }
  }

  // Called when the player leaves a won campaign level (the "下一關" button).
  async afterLevelWon(levelId) {
    if (!this.ready || !this.interstitialLoaded) return;
    if (levelId % ADS.INTERSTITIAL_EVERY_LEVELS !== 0) return;
    if (Date.now() - this.lastInterstitial < ADS.INTERSTITIAL_COOLDOWN_MS) return;
    try {
      this.interstitialLoaded = false; this.lastInterstitial = Date.now();
      await this.admob.showInterstitial();
    } catch (error) { console.warn('[ads] interstitial show failed', error); }
    void this.loadInterstitial();
  }

  async showPrivacyOptions() {
    if (!this.native || !this.admob) return;
    try { await this.admob.showPrivacyOptionsForm(); } catch (error) { console.warn('[ads] privacy form failed', error); }
  }
}

import { defineConfig } from 'vite';

// The Android app runs in the system WebView, which can be several Chrome
// versions behind. Targeting older engines keeps CSS like `@media (max-width: …)`
// instead of the newer `(width <= …)` range syntax that old WebViews ignore.
export default defineConfig({
  build: {
    target: ['es2020', 'chrome80', 'safari14'],
    cssTarget: ['chrome80', 'safari14'],
  },
});

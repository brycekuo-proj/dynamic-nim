import base from './playwright.config.js';
export default { ...base, projects: base.projects.filter(p => p.name !== 'mobile-webkit').map(p => ({ ...p, use: { ...p.use, locale: 'zh-TW', launchOptions: { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' } } })) };

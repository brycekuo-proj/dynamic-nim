// 授權聲明（2026-10-29）：選單 →「授權聲明」或頁尾連結。
// 字型 OFL 全文直接讀 public/assets/fonts/*_OFL.txt；程式套件都是 MIT，全文寫在下面。
// 新增套件時記得補進 PACKAGES。
import { t } from '../i18n.js';

const PACKAGES = [
  ['Capacitor (@capacitor/core, @capacitor/android)', 'Copyright (c) 2017-present Drifty Co.'],
  ['@capacitor/local-notifications, @capacitor/share', 'Copyright 2020-present Ionic'],
  ['@capacitor-community/admob', 'Copyright (c) 2021 Capacitor Community'],
];

const MIT = `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

const FONT_FILES = [
  ['Fredoka', 'FREDOKA_OFL.txt'],
  ['jf open 粉圓 (Huninn)', 'HUNINN_OFL.txt'],
];

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

async function fontText(file) {
  try {
    const r = await fetch(`${import.meta.env.BASE_URL}assets/fonts/${file}`);
    if (r.ok) return await r.text();
  } catch { /* 離線讀不到就只顯示名稱 */ }
  return 'SIL Open Font License, Version 1.1 — https://openfontlicense.org';
}

export async function fillCredits(box) {
  box.replaceChildren();
  box.append(el('p', 'credits-studio', t('credits.studio')));
  box.append(el('h3', '', t('credits.music')));
  box.append(el('p', '', t('footer.music')));
  box.append(el('p', 'small', t('credits.sound')));
  box.append(el('h3', '', t('credits.fonts')));
  for (const [name, file] of FONT_FILES) {
    box.append(el('p', 'credits-name', name));
    box.append(el('pre', 'credits-text', await fontText(file)));
  }
  box.append(el('h3', '', t('credits.packages')));
  for (const [name, copy] of PACKAGES) box.append(el('p', 'credits-name', `${name} — MIT License\n${copy}`));
  box.append(el('pre', 'credits-text', MIT.replace(/([^\n])\n(?!\n)/g, '$1 ')));   // 段落內不斷行，窄螢幕比較好讀
}

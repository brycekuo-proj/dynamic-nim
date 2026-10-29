// Sharing and daily reminders. In the Android app these use Capacitor plugins;
// on the web, sharing falls back to the Web Share API and then the clipboard, and
// reminders are not offered (browsers cannot schedule them reliably).
export const isNative = () => Boolean(window.Capacitor?.isNativePlatform?.());

// Returns 'shared', 'copied' or 'failed'.
export async function shareText(text) {
  try {
    if (isNative()) {
      const { Share } = await import('@capacitor/share');
      await Share.share({ text, dialogTitle: 'Sweetie Nim' });
      return 'shared';
    }
    if (navigator.share) { await navigator.share({ text }); return 'shared'; }
  } catch (error) {
    if (error?.name === 'AbortError' || /cancel/i.test(String(error?.message))) return 'cancelled';
  }
  try { await navigator.clipboard.writeText(text); return 'copied'; } catch { return 'failed'; }
}

// Reminder ids 1001–1007: one notification per day for the coming week. Rescheduling
// on every launch and after each daily solve skips a day that is already solved and
// means nobody is nagged forever by an app they stopped opening.
const IDS = [1001, 1002, 1003, 1004, 1005, 1006, 1007];
// The plugin proxy answers every property, including `then`, so it must not be the
// value an async function resolves to — wrap it, or awaiting it throws
// "LocalNotifications.then() is not implemented".
async function plugin() { return { ln: (await import('@capacitor/local-notifications')).LocalNotifications }; }

export async function requestReminderPermission() {
  if (!isNative()) return false;
  try {
    const { ln } = await plugin();
    let { display } = await ln.checkPermissions();
    if (display !== 'granted') ({ display } = await ln.requestPermissions());
    return display === 'granted';
  } catch { return false; }
}

// time 'HH:MM'; solvedToday skips today's reminder; text(dayIndex) gives { title, body }.
export async function planReminders({ on, time, solvedToday, text }) {
  if (!isNative()) return;
  try {
    const { ln } = await plugin();
    await ln.cancel({ notifications: IDS.map(id => ({ id })) });
    if (!on || (await ln.checkPermissions()).display !== 'granted') return;
    const [hour, minute] = time.split(':').map(Number), now = new Date(), notifications = [];
    IDS.forEach((id, day) => {
      const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + day, hour, minute);
      if (at <= now || (day === 0 && solvedToday)) return;
      notifications.push({ id, ...text(day), schedule: { at }, smallIcon: 'ic_stat_donut', iconColor: '#FF5C9A' });
    });
    if (notifications.length) await ln.schedule({ notifications });
  } catch { /* reminders are best-effort */ }
}

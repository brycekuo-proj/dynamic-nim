// All on-screen text, in Traditional Chinese and English. Static HTML uses
// data-i18n (text), data-i18n-html (markup) and data-i18n-aria (aria-label);
// the UI calls t(key, vars). Level lessons and hints live with the levels in
// Chinese; their English versions are in LEVEL_TEXT_EN below.
const zh = {
  'meta.description': 'Sweetie Nim：沿橫、直或 45° 斜線，每回合拿走 1–3 顆甜甜圈。拿走最後一顆贏，或拿走最後一顆輸。',
  'btn.levels': '關卡', 'btn.math': '數學',
  'btn.sound.on': '音效 開', 'btn.sound.off': '音效 關', 'btn.anim.on': '動畫 開', 'btn.anim.off': '動畫 關',
  'btn.restart': '重新開始', 'btn.hint': '提示', 'btn.analyze': '回合紀錄',
  'board.aria': '甜甜圈盤面：可沿水平、垂直或 45 度斜線拖曳，每回合最多拿走 3 顆；鍵盤方向鍵移動，Q/E/Z/C 斜向移動，空白鍵起點，Enter 拿走，Escape 取消',
  'chapter2.small': '第二章', 'chapter2.big': '重力 ↓', 'chapter2.text': '每一步之後，甜甜圈都會往下掉。',
  'math.title': '數學 · 本機解題器', 'analysis.title': '回合紀錄', 'analysis.legend': 'N = 輪到這一方可以必勝 · P = 輪到這一方必敗',
  'rules.title': '規則', 'rules.open': '展開 ▾', 'rules.close': '收合 ▴',
  'rules.1': '兩人輪流，每回合拿走 <b>1–3 顆</b>相鄰的甜甜圈。',
  'rules.2': '必須在同一條直線上：<b>橫、直或 45° 斜</b>。不能跳過空格，也不能轉彎。',
  'rules.win.normal': '拿走<b>最後一顆</b>的人獲勝。', 'rules.win.misere': '拿走<b>最後一顆</b>的人<b>輸</b>。',
  'rules.4': '重力盤面：每一步之後，上方的甜甜圈會直直落下。',
  'progress.title': '闖關進度', 'progress.count': '{n} / 10 完成', 'progress.chapters': '第一章 01–05 靜態 · 第二章 06–10 重力',
  'footer.text': '對手是本機解題器：沒有運氣，只有策略。', 'footer.privacy': '隱私設定', 'lang.switch': 'English',
  'menu.title': '選單', 'menu.close': '關閉選單', 'menu.rule': '規則', 'menu.play': '玩法', 'menu.levels': '選擇關卡',
  'mode.normal.name': '拿最後一顆<b>贏</b>', 'mode.normal.rule': '把最後一顆搶到手',
  'mode.misere.name': '拿最後一顆<b>輸</b>', 'mode.misere.rule': '把最後一顆留給電腦',
  'rule.normal': '拿最後一顆贏', 'rule.misere': '拿最後一顆輸',
  'play.campaign': '闖關', 'play.campaign.desc': '10 關教學關卡',
  'play.daily': '每日一題', 'play.daily.desc': '每天一題，大家同一題',
  'play.endless': '無限挑戰', 'play.endless.desc': '電腦出題，玩不完',
  'play.duo': '雙人對戰', 'play.duo.desc': '兩人輪流用同一支手機',
  'diff.easy': '簡單', 'diff.normal': '普通', 'diff.hard': '困難',
  'endless.solved': '已解 {n} 題',
  'daily.start': '開始今天的題目', 'daily.again': '再玩一次今天的題目', 'daily.done': '今天的題目已完成 ✓',
  'daily.streak': '連續 {n} 天 · 最佳 {best} 天',
  'duo.small': '小盤', 'duo.medium': '中盤', 'duo.large': '大盤', 'duo.note': '每局隨機出盤面，靜態或重力。',
  'tile.done': '完成', 'tile.locked': '未解鎖', 'pip': '關卡 {n}',
  'chip.aria': '規則：{rule}。點一下換規則或玩法',
  'world.static': '靜態', 'world.gravity': '↓ 重力', 'worldname.static': '靜態', 'worldname.gravity': '重力',
  'eyebrow.ch1': '第一章 · 靜態', 'eyebrow.ch2': '第二章 · 重力', 'eyebrow.book': '謎題書 · {world}',
  'eyebrow.endless': '無限挑戰 · {diff} · {world}', 'eyebrow.daily': '每日一題 · {world}', 'eyebrow.duo': '雙人對戰 · {world}',
  'num.book': '書', 'name.book': '第 {n} 題', 'num.endless': '∞', 'name.endless': '第 {n} 題',
  'num.daily': '日', 'name.daily': '{date}', 'num.duo': 'VS', 'name.duo': '雙人對戰',
  'lesson.book': '輪到你。找出唯一的必勝步，再把這一局下完、贏過電腦。',
  'hint.book': '答案在書末。座標和書上一樣：字母是欄，數字是列。',
  'lesson.endless': '電腦出的題：輪到你，而且一定有必勝走法。',
  'lesson.daily': '今天的題目：輪到你，一定有必勝走法。',
  'lesson.duo': '兩人輪流下，下完一步就把手機交給對方。',
  'hint.generated': '有 {n} 種必勝走法。其中一種從 {cell} 開始，拿 {k} 顆。',
  'count': '剩 {n} 顆', 'storage.temp': ' · 暫存',
  'status.won': '你獲勝', 'status.lost': '電腦獲勝', 'status.aiAnim': '電腦正在拿甜甜圈', 'status.youAnim': '拿走甜甜圈',
  'status.aiThink': '電腦思考中', 'status.yourTurn': '輪到你',
  'status.pTurn': '輪到玩家 {n}', 'status.pWon': '玩家 {n} 獲勝', 'status.pAnim': '玩家 {n} 拿甜甜圈',
  'verdict.ok': '第一步 {move} 正確。接下來每一步都要守住。',
  'verdict.bad': '第一步 {move} 不是正解：電腦現在有必勝走法。可以重新開始，或下完看看。',
  'out.book.win': '你解開第 {n} 題，也贏了電腦。', 'out.book.lose': '電腦拿走了最後一顆。回到書上再想一次。',
  'out.normal.win': '你拿走了最後一顆。', 'out.normal.win5': '第一章完成。接下來，世界會開始往下掉。',
  'out.normal.win10': '十關全破。重力也難不倒你。', 'out.normal.lose': '電腦拿走了最後一顆。試著留下不同的局面。',
  'out.misere.win': '電腦被迫吃下最後一顆。', 'out.misere.win5': '第一章完成。接下來，世界會開始往下掉。',
  'out.misere.win10': '「拿最後一顆輸」十關全破！', 'out.misere.lose': '你拿到了最後一顆……這次要把它留給電腦。',
  'out.endless.win': '解開了！下一題會再難一點點。', 'out.daily.win': '今天的題目完成了！明天再來。',
  'out.gen.lose.normal': '電腦拿走了最後一顆。再想一次？', 'out.gen.lose.misere': '你拿到了最後一顆。再想一次？',
  'out.duo.normal': '玩家 {w} 拿走最後一顆，獲勝！', 'out.duo.misere': '玩家 {l} 拿到最後一顆，玩家 {w} 獲勝！',
  'next.retry': '重新挑戰 ↺', 'next.book': '前往主線關卡 →', 'next.menu': '選擇關卡 →', 'next.ch2': '進入第二章 ↓',
  'next.next': '下一關 →', 'next.endless': '下一題 →', 'next.daily': '回到選單 →', 'next.duo': '再來一局 ↺',
  'who.you': '你', 'who.ai': '電腦', 'who.p': '玩家 {n}',
};

const en = {
  'meta.description': 'Sweetie Nim: take 1–3 donuts in a straight line — across, down or at 45°. Take the last one to win, or make your opponent take it.',
  'btn.levels': 'Levels', 'btn.math': 'Math',
  'btn.sound.on': 'Sound', 'btn.sound.off': 'Muted', 'btn.anim.on': 'Motion', 'btn.anim.off': 'Still',
  'btn.restart': 'Restart', 'btn.hint': 'Hint', 'btn.analyze': 'Move log',
  'board.aria': 'Donut board: drag across, down or along a 45° diagonal to take up to 3; arrow keys move, Q/E/Z/C move diagonally, Space sets the start, Enter takes, Escape cancels',
  'chapter2.small': 'Chapter 2', 'chapter2.big': 'Gravity ↓', 'chapter2.text': 'After every move, the donuts fall down.',
  'math.title': 'Math · on-device solver', 'analysis.title': 'Move log', 'analysis.legend': 'N = the side to move can force a win · P = the side to move loses',
  'rules.title': 'Rules', 'rules.open': 'Show ▾', 'rules.close': 'Hide ▴',
  'rules.1': 'Take turns. Each turn, take <b>1–3</b> donuts that touch.',
  'rules.2': 'They must be in one straight line: <b>across, down or 45° diagonal</b>. No gaps, no turns.',
  'rules.win.normal': 'Whoever takes the <b>last donut</b> wins.', 'rules.win.misere': 'Whoever takes the <b>last donut</b> <b>loses</b>.',
  'rules.4': 'Gravity boards: after every move, donuts above an empty cup fall straight down.',
  'progress.title': 'Level progress', 'progress.count': '{n} / 10 done', 'progress.chapters': 'Chapter 1: levels 01–05 static · Chapter 2: 06–10 gravity',
  'footer.text': 'Your opponent is an on-device solver: no luck, only strategy.', 'footer.privacy': 'Privacy settings', 'lang.switch': '中文',
  'menu.title': 'Menu', 'menu.close': 'Close menu', 'menu.rule': 'Rule', 'menu.play': 'Play', 'menu.levels': 'Choose a level',
  'mode.normal.name': 'Last one <b>wins</b>', 'mode.normal.rule': 'Grab the last donut',
  'mode.misere.name': 'Last one <b>loses</b>', 'mode.misere.rule': 'Leave the last one to them',
  'rule.normal': 'Last one wins', 'rule.misere': 'Last one loses',
  'play.campaign': 'Levels', 'play.campaign.desc': '10 teaching levels',
  'play.daily': 'Daily puzzle', 'play.daily.desc': 'Same puzzle for everyone today',
  'play.endless': 'Endless', 'play.endless.desc': 'Fresh puzzles, never runs out',
  'play.duo': 'Two players', 'play.duo.desc': 'Pass one phone back and forth',
  'diff.easy': 'Easy', 'diff.normal': 'Normal', 'diff.hard': 'Hard',
  'endless.solved': '{n} solved',
  'daily.start': "Play today's puzzle", 'daily.again': "Replay today's puzzle", 'daily.done': "Today's puzzle solved ✓",
  'daily.streak': '{n}-day streak · best {best}',
  'duo.small': 'Small', 'duo.medium': 'Medium', 'duo.large': 'Large', 'duo.note': 'Every game gets a random static or gravity board.',
  'tile.done': 'Done', 'tile.locked': 'Locked', 'pip': 'Level {n}',
  'chip.aria': 'Rule: {rule}. Tap to change the rule or the way to play',
  'world.static': 'Static', 'world.gravity': '↓ Gravity', 'worldname.static': 'static', 'worldname.gravity': 'gravity',
  'eyebrow.ch1': 'Chapter 1 · Static', 'eyebrow.ch2': 'Chapter 2 · Gravity', 'eyebrow.book': 'Puzzle book · {world}',
  'eyebrow.endless': 'Endless · {diff} · {world}', 'eyebrow.daily': 'Daily puzzle · {world}', 'eyebrow.duo': 'Two players · {world}',
  'num.book': 'Bk', 'name.book': 'Puzzle {n}', 'num.endless': '∞', 'name.endless': 'Puzzle {n}',
  'num.daily': '☀', 'name.daily': '{date}', 'num.duo': 'VS', 'name.duo': 'Two players',
  'lesson.book': 'Your move. Find the one winning move, then play the game out and beat the computer.',
  'hint.book': 'Answers are at the back of the book. Coordinates match the book: letters are columns, numbers are rows.',
  'lesson.endless': "The computer's puzzle: it's your move, and a winning move always exists.",
  'lesson.daily': "Today's puzzle: it's your move, and a winning move always exists.",
  'lesson.duo': 'Take turns — make a move, then pass the phone.',
  'hint.generated': '{n} winning move(s). One starts at {cell} and takes {k}.',
  'count': '{n} left', 'storage.temp': ' · not saved',
  'status.won': 'You win', 'status.lost': 'Computer wins', 'status.aiAnim': 'Computer is taking donuts', 'status.youAnim': 'Taking donuts',
  'status.aiThink': 'Computer is thinking', 'status.yourTurn': 'Your turn',
  'status.pTurn': "Player {n}'s turn", 'status.pWon': 'Player {n} wins', 'status.pAnim': 'Player {n} is taking donuts',
  'verdict.ok': 'First move {move} is right. Now hold the win to the end.',
  'verdict.bad': 'First move {move} is not the answer: the computer now has a forced win. Restart, or play it out.',
  'out.book.win': 'You solved puzzle {n} and beat the computer.', 'out.book.lose': 'The computer took the last donut. Back to the book for another look.',
  'out.normal.win': 'You took the last donut.', 'out.normal.win5': 'Chapter 1 done. Next, the world starts to fall.',
  'out.normal.win10': 'All ten levels cleared. Even gravity can’t stop you.', 'out.normal.lose': 'The computer took the last donut. Try leaving a different position.',
  'out.misere.win': 'The computer had to take the last donut.', 'out.misere.win5': 'Chapter 1 done. Next, the world starts to fall.',
  'out.misere.win10': 'All ten "last one loses" levels cleared!', 'out.misere.lose': 'You got stuck with the last donut… leave it to the computer next time.',
  'out.endless.win': 'Solved! The next one gets a little harder.', 'out.daily.win': "Today's puzzle is done! Come back tomorrow.",
  'out.gen.lose.normal': 'The computer took the last donut. Try again?', 'out.gen.lose.misere': 'You got the last donut. Try again?',
  'out.duo.normal': 'Player {w} took the last donut and wins!', 'out.duo.misere': 'Player {l} got the last donut — Player {w} wins!',
  'next.retry': 'Try again ↺', 'next.book': 'Go to the levels →', 'next.menu': 'Choose a level →', 'next.ch2': 'On to chapter 2 ↓',
  'next.next': 'Next level →', 'next.endless': 'Next puzzle →', 'next.daily': 'Back to the menu →', 'next.duo': 'Play again ↺',
  'who.you': 'You', 'who.ai': 'Computer', 'who.p': 'Player {n}',
};

// English lessons and hints for the twenty campaign levels ("mode:id": [lesson, hint]).
export const LEVEL_TEXT_EN = {
  'normal:1': ['Tap the donut. Take the last one to win.', 'The last one is yours.'],
  'normal:2': ['Drag across the donuts in a straight line; let go to take them.', 'Take the whole line in one swipe.'],
  'normal:3': ['Three lines, three sizes. Don’t just count the total.', 'Try leaving 1 / 2 / 3. That is a balanced position.'],
  'normal:4': ['Find the extra donut and leave two matching lines.', 'Take the middle one. Then copy every move your opponent makes on the other line.'],
  'normal:5': ['Lots of choices, very few balanced ones.', 'Take one from either end of the top row. The solver confirms it leaves a P-position; taking from the middle splits the line.'],
  'normal:6': ['The world has changed. After every move, the donuts fall down.', 'Take the bottom middle one and watch both sides fall.'],
  'normal:7': ['Diagonals count too. After a move, see which donuts gravity lines up again.', 'Take the top-right and middle-right pair along the 45° diagonal, then look at the new line after they fall.'],
  'normal:8': ['Across, down, diagonal — all allowed. Finish the move and the fall in your head before you judge the next position.', 'The 45° pair from top-right to bottom-left is the only winning start; picture where they land.'],
  'normal:9': ['Is taking a full three always best? Same three donuts, different place, different result.', 'Don’t take three from the right side of the top row — that’s the trap. Compare how the left three fall.'],
  'normal:10': ['Three at most. Lines, balance, falling — leave the computer the real next position.', 'Try taking the two touching donuts in the second column. Gravity forms a line of four at the bottom, but you still can’t take it all at once.'],
  'misere:1': ['New rule: whoever takes the last donut loses. Make the computer eat it.', 'Take just one. The computer has to take the other.'],
  'misere:2': ['You may take 1–3 at a time. Four in a row — how many do you take?', 'Take three in one go and leave one for the computer.'],
  'misere:3': ['One line of one, one line of two. Normally you’d even them out — not this time.', 'Take both bottom donuts at once, leaving only the top one.'],
  'misere:4': ['This board is lost under "last one wins" — flip the rule and there is a way.', 'Take the middle three of the row of five, leaving three single donuts.'],
  'misere:5': ['Two long lines, many choices, only two safe ways in.', 'Take one donut from either end of the row of five.'],
  'misere:6': ['Gravity is back: after every move, the donuts above fall down.', 'Take the whole left column of three at once.'],
  'misere:7': ['You can take three — that doesn’t mean you should.', 'Take only the bottom-left donut.'],
  'misere:8': ['Think it through: after a move, who falls where?', 'Take just one from the left column and let the other drop into its place.'],
  'misere:9': ['A staircase of donuts. The good moves of normal play are all traps here.', 'Take just one donut from column C (C3 or C4).'],
  'misere:10': ['Last level: eleven donuts, forty-eight moves, only one wins.', 'Take the whole rightmost column of three at once.'],
};

const DICTS = { zh, en };
let current = 'zh';
export const detectLang = () => { try { return /^zh\b/i.test(navigator.language || '') ? 'zh' : 'en'; } catch { return 'zh'; } };
export function setLang(lang) { current = DICTS[lang] ? lang : 'zh'; document.documentElement.lang = current === 'zh' ? 'zh-Hant' : 'en'; }
export const getLang = () => current;
export function t(key, vars = {}) {
  const text = DICTS[current][key] ?? zh[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');
}
export function levelText(level) {
  if (current === 'en') { const en = LEVEL_TEXT_EN[`${level.mode}:${level.id}`]; if (en) return { lesson: en[0], hint: en[1] }; }
  return { lesson: level.lesson, hint: level.hint };
}
// Fills every static element marked with data-i18n / data-i18n-html / data-i18n-aria.
export function applyStatic(root = document) {
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of root.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  const meta = document.querySelector('meta[name="description"]'); if (meta) meta.content = t('meta.description');
}
export const KEYS = Object.freeze({ zh: Object.keys(zh), en: Object.keys(en) });

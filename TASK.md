# 專案：Dynamic Nim / 暫定名稱

你現在是這個專案的遊戲設計師、數學遊戲設計師與資深 Web Game Engineer。

請不要重新發明玩法，也不要先寫長篇企劃。以下內容是已經確認的核心方向。你的任務是依照這份規格，直接設計並實作「前10關可玩的 Prototype」。

# 1. 遊戲核心定位

這是一款源自 Nim 的單人數學策略益智遊戲。

但不是單純把傳統 Nim 搬到手機上。

核心概念是：

「玩家從有效直線中移除圓圈 → 盤面依照該關的物理規則重新排列 → AI 行動 → 盤面再次重新排列。」

真正的策略問題不是：

「現在拿幾顆？」

而是：

「我拿掉這些圓圈之後，盤面會變成什麼狀態？」

遊戲必須同時保留三層：

1. 直覺：玩家很容易理解如何消除圓圈。
2. 預測：玩家必須預測消除後盤面的變化。
3. 數學：盤面存在可分析的 winning / losing states。

不要把遊戲做成純物理解謎。

# 2. 數學核心

遊戲必須保持一定程度的 Nim / combinatorial game 數學性。

L1–L5 應該接近經典 Nim：
- counting
- heap size
- symmetry
- parity intuition
- Nim-sum / XOR
- P-position / N-position

玩家不需要一開始知道 XOR 這個名詞。

遊戲應該透過盤面讓玩家逐漸感受到：

「有些盤面是平衡的。」

對傳統 Nim 型盤面，可以使用 Nim-sum：

heap1 XOR heap2 XOR ... XOR heapN

Nim-sum = 0 可以作為重要的平衡狀態。

但是：

L6 之後加入動態盤面，因此不要硬把所有狀態都塞進傳統 XOR 模型。

後期使用一般 impartial combinatorial game 的遞迴定義：
- 如果存在至少一個合法 move 可以進入 losing state，目前狀態就是 winning state。
- 如果所有合法 move 都進入 winning state，目前狀態就是 losing state。

因此需要 game-tree solver。

# 3. 非常重要：遊戲必須 deterministic

禁止隨機物理。

同樣：

盤面 + 操作

必須永遠產生完全相同的下一個盤面。

可抽象為：

B(t+1) = T(B(t), Move)

其中：

B = Board State
Move = 玩家操作
T = 關卡物理轉換函數

這是整個遊戲策略公平性的核心。

# 4. 基本回合

每回合：

PLAYER MOVE
↓
REMOVE PIECES
↓
APPLY WORLD TRANSFORMATION
↓
CHECK END STATE
↓
AI MOVE
↓
APPLY WORLD TRANSFORMATION
↓
CHECK END STATE
↓
PLAYER MOVE

最後拿走最後一顆圓圈的一方獲勝。

第一版不要加入：
- 血量
- 技能
- 道具
- 金幣
- 三星
- 裝備
- 每日登入

保持純粹。

# 5. 玩家操作

主要操作不是「點幾顆 → Confirm」。

目標操作方式是：

玩家用滑鼠或手指直接沿著一條合法直線 swipe / drag。

例如：

○—○—○

玩家劃過其中連續的 1～3 顆；每回合最多移除 3 顆。

被選中的圓圈即時高亮。

放開手指後：

合法 → 執行 move
非法 → 取消選擇

必須同時支援：
- mouse
- touch

不要依賴 hover。

# 6. 合法 Move

第一版規則：

玩家一次只能移除位於同一條有效水平或垂直直線上的「連續圓圈」。

每回合最少 1 顆、最多 3 顆。

不能跨過空格選取。

至少移除一顆。

Move 執行後立即進入盤面 transformation。

合法操作的定義必須集中管理，不要散落在 UI code 裡。

# 7. 30關整體架構

完整遊戲未來規劃：

L1–L5 STATIC

核心：
理解 Nim、數量、對稱、平衡。

L6–L15 GRAVITY DOWN ↓

核心：
消除會改變下一個 Nim / game state。

L16–L25 SIDE COLLAPSE ← / →

核心：
左右壓縮造成有效直線重新形成。

L26–L30 CENTER COLLAPSE ◎

核心：
所有圓圈向中央 deterministic collapse。

目前只製作 L1–L10。

# 8. 前10關設計目標

不要隨便生成10個盤面。

每一關都必須經 solver 驗證。

需要知道：
- initial state 是 winning 還是 losing
- legal moves 數量
- winning moves
- losing moves
- optimal move
- optimal continuation
- minimum / expected solution depth

玩家關卡原則上應該從存在至少一個 winning move 的狀態開始。

如果某關刻意使用 losing state 作教學，必須清楚標記原因。

# 9. L1–L5：STATIC NIM

## L1 — REMOVE
目的：讓玩家理解 swipe removal。
盤面非常小。
玩家幾乎不可能誤解操作。
不需要大量文字。

## L2 — LINE
目的：
讓玩家理解同一條直線可以一次移除多顆。
開始形成「heap」概念。

## L3 — NIM
第一次真正出現多 heap 結構。
可以從類似：
1 2 3
的 heap configuration 開始設計。
讓玩家開始理解：
不能只看總數。

## L4 — MIRROR
核心：
symmetry。
使用對稱盤面。
讓玩家開始發現：
對方做某件事情，我可以建立對應狀態。

## L5 — BALANCE
第一章 Boss Puzzle。
必須是一個真正經 solver 驗證、有數學意義的 Nim puzzle。
讓玩家第一次遇到：
「看起來很多選擇，但真正好的 move 很少。」

完成 L5 後：
CRT glitch。
畫面出現：
GRAVITY ↓
進入 L6。

# 10. L6–L10：DYNAMIC NIM / GRAVITY

從 L6 開始：

每次 move 完成後執行：

GravityDown()

每一欄中的圓圈向下填滿空位。

必須 deterministic。

## L6 — FALL
目的：
只教一件事情：
「圓圈會掉。」
設計一個極簡盤面。
玩家操作後必須明顯看到：
原本上方的圓圈掉下。
這一關的驚喜點非常重要。

## L7 — REFORM
目的：
讓玩家發現：
掉落不是純動畫。
掉落會形成新的有效直線。

## L8 — PREDICT
第一次要求玩家：
不能只看現在的盤面。
必須想：
MOVE
↓
GRAVITY
↓
NEXT STATE

## L9 — TRAP
設計一個 visually tempting move。
看起來一次拿很多很划算。
但是：
REMOVE
↓
GRAVITY
↓
形成對 AI 有利的盤面。
必須由 solver 驗證這個陷阱真的成立。

## L10 — GRAVITY TEST
作為前10關的小 Boss。
必須同時要求：
- 理解合法直線
- 理解 Nim / balance
- 預測 GravityDown
- 預測 AI response

不能靠猜。

必須存在可以被推理出來的最佳策略。

# 11. AI

不要只做 random AI。

建立 solver-based AI。

對目前盤面：

GenerateLegalMoves(state)

對每個 move：

nextState = ApplyMove(state, move)
nextState = ApplyTransformation(nextState)

然後遞迴求：

IsWinning(nextState)

使用：
memoization / transposition table

避免重複計算相同 state。

AI 原則：

如果存在 winning move：
從 winning moves 中選擇。

如果不存在：
選擇合理合法 move。

Prototype 可以讓 AI 成為接近 perfect-play 的 opponent。

但是 L1–L2 可以依教學需求限制 AI 行為。

# 12. Solver 與遊戲邏輯必須分離

Architecture 至少拆成：

GameState
Move
RuleEngine
MoveGenerator
TransformationSystem
Solver
AIController
LevelDefinition
GameController
Renderer
InputController
UIController

不要把全部塞進一個 JavaScript file 的巨大 function。

# 13. Debug / Math Mode

Prototype 必須有 developer/debug 模式。

按鍵例如：

D

開啟 Math Debug Overlay。

顯示：

LEVEL
STATE ID
PIECE COUNT
LEGAL MOVES
WINNING / LOSING STATE
WINNING MOVES
AI EVALUATION

對 L1–L5，如果盤面可以自然轉換成 Nim heaps，再額外顯示：

HEAPS
NIM SUM

例如：

HEAPS 1 / 2 / 3
NIM SUM 0

這個模式是開發與驗證使用，不是普通玩家預設 UI。

# 14. 未來的 ANALYZE 功能

架構預留：

[ ANALYZE ]

通關後可以展示數學分析。

但第一版不需要做完整教學系統。

只要資料結構支援未來顯示：
- initial state
- player's move
- resulting state
- winning/losing transition
- Nim-sum（適用時）

# 15. 視覺風格

方向：

1970s retro sci-fi computer terminal。

核心：
- 黑色背景
- monochrome / phosphor green
- off-white highlights
- CRT scanlines
- subtle noise
- slight flicker
- monospace typography
- vector-style circles

不要做成現代 Candy Crush 類型 UI。

遊戲應該像：

「玩家找到一台1970年代的神秘策略電腦。」

CRT 效果不能影響可讀性。

# 16. Frog

未來有一隻 retro frog 作為遊戲中的神秘角色 / 最終 Boss。

前10關不用完整製作 Frog Boss。

但 architecture / visual design 不要阻止後續加入。

未來 L30：

THE SINGULARITY

Frog 使用 perfect solver。

玩家只有真正走在 winning line 上才能擊敗它。

# 17. Prototype 技術要求

第一版請做 Web Prototype。

技術優先：

HTML
CSS
JavaScript

如果確實有架構理由，可以使用輕量 TypeScript / Vite，但不要為了技術漂亮引入不必要框架。

Prototype 必須：
- desktop browser 可玩
- mobile browser 可玩
- responsive
- touch support
- mouse support
- portrait-first
- 可以之後用 Capacitor 包成 Android / iOS App

禁止依賴後端。

遊戲與 solver 必須可以完全 local 運行。

# 18. Save

Prototype 儲存：
- highest unlocked level
- current level
- basic settings

使用 localStorage 即可。

不要加入帳號系統。

# 19. 非常重要：關卡驗證工具

除了遊戲本體，請製作一個 Level Validator。

對 L1–L10 自動輸出：

Level
Initial State
Winning / Losing
Number of Legal Moves
Number of Winning Moves
Optimal First Move
Solution Depth

如果某關：
- 沒有合理 winning path
- solver 發現設計錯誤
- 太多等價最佳解導致教學目的不清楚

請修改關卡，而不是硬保留原設計。

關卡設計必須服從數學驗證。

# 20. 第一版不要做的東西

不要加入：

AdMob
IAP
Remove Ads
analytics SDK
login
cloud save
leaderboard
achievement
skins
shop

目前唯一目的：

驗證核心玩法是否成立。

商業功能等 Prototype 好玩之後再做。

# 21. Acceptance Criteria

Prototype 完成時，我應該可以：

1. 打開遊戲。
2. 從 L1 開始。
3. 使用 swipe / drag 選擇連續直線圓圈。
4. 與 AI 輪流。
5. 正確判斷勝負。
6. 完成 L1–L5 Static 關卡。
7. L6 開始看到 Gravity Down。
8. L6–L10 的 Gravity 會真正改變策略。
9. 每一關都經 solver 驗證。
10. 可以開啟 Debug Math Mode 查看 winning/losing state。
11. 手機瀏覽器可操作。
12. 重整頁面後保留解鎖進度。

# 22. 工作方式

不要一次產出一大堆未驗證程式。

請按照：

PHASE 1 建立 state / move / rule / solver。
先用 automated tests 驗證 solver。

PHASE 2 建立 L1–L5。
跑 validator。

PHASE 3 加入 GravityDown。

PHASE 4 建立 L6–L10。
跑 validator。

PHASE 5 建立 UI / swipe interaction。

PHASE 6 加入 AI。

PHASE 7 加入 CRT presentation / polish。

PHASE 8 完整 regression test。

每完成一個 Phase：

先執行測試。
發現問題就修。
測試通過再繼續。

不要把錯誤留給我人工發現。

# 23. 最重要的產品原則

這不是：

「Nim + 漂亮動畫」。

也不是：

「隨機物理益智遊戲」。

它應該是：

「一個有嚴格數學狀態、但盤面會 deterministic transformation 的 Dynamic Nim / combinatorial strategy game。」

玩家表面體驗：

「如果我劃掉這幾顆，接下來會發生什麼？」

深層策略：

「我要把 transformation 後的盤面送進 opponent losing state。」

請保護這個核心。

現在開始執行。

第一個目標不是30關，也不是商業化。

第一個目標是：

做出 L1–L10 的完整 playable prototype，並證明每一關在數學上成立。

完成後請提供：

1. 專案結構
2. 如何啟動
3. L1–L10 關卡表
4. 每關的數學驗證結果
5. automated test 結果
6. 已知限制
7. 下一階段建議

不要只提供程式碼片段；請直接建立可以執行的專案。

---

# 執行要求（工作代理）

你目前在本機 Git repo `dynamic-nim` 中工作。請自主完成上述工作，不要只寫規劃。

額外要求：
- 使用目前預設的 Astra 模型能力完成整個 prototype。
- 以 phase 為單位實作；每個 phase 都先測試再前進。
- 關卡資料與 solver/validator 結果必須可重現。
- 不可用隨機物理；AI 若在 losing state 需要 tie-break，使用 deterministic tie-break。
- README 必須記錄啟動方式、架構、L1-L10 數學驗證表、測試結果與限制。
- 建議使用可在本機直接跑的 npm scripts，例如 dev / test / validate / build。
- 完成後執行完整 test + validator + build。
- 修正所有測試/建置錯誤後才算完成。
- 在最後確認 git working tree clean，將成果 commit，並 push 到 origin main。

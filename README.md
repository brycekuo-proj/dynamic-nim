# Dynamic Nim

可玩的 L1–L10 單人數學策略 Web prototype。玩家移除連續直線圓圈，盤面依關卡規則變換，再由 deterministic solver AI 回應。最後拿走圓圈的一方獲勝；完全在瀏覽器本機運行，無後端。

## 啟動與驗證

需要 Node.js 22.12+（本次驗證使用 Node.js 26.7.0）及 npm。

```sh
npm ci
npx playwright install chromium webkit
npm run dev
```

開啟終端顯示的本機網址（預設 http://localhost:5173）。同網路手機可透過電腦的區網 IP 與該 port 開啟；開發伺服器綁定 `0.0.0.0`。

```sh
npm test          # domain / gravity / levels / AI / controller / input / save
npm run validate  # 重新產生 artifacts/level-validation.json
npm run test:e2e  # Chromium desktop、Pixel 7 Chromium、iPhone 13 WebKit
npm run build    # 產生 dist/
npm run preview  # 預覽 production build
npm run check    # 依序執行 test、validate、test:e2e、build
```

## 玩法

- 滑鼠或手指從圓圈開始，可沿水平、垂直或 45° 斜向拖曳（↘ / ↙），放開即移除。每回合可移除 1～3 顆連續圓圈；不可跨空格、任意角度轉彎或一次選超過 3 顆。非法手勢取消，不消耗回合。
- L1–L5 為 static；L6–L10 每次移除後各欄向下填滿空位。動畫與 AI 回合期間鎖定輸入。
- 可重試、選擇已解鎖關卡、開啟提示與切換 CRT 效果。L5 後有 GRAVITY 章節轉場。
- `D` 或 Math 按鈕顯示局面 ID、合法走法、勝負、最佳走法、深度及適用時的 heaps / Grundy / Nim sum。勝負是「輪到行動的一方」的評估。
- 鍵盤：聚焦棋盤後方向鍵做水平／垂直移動，Q/E/Z/C 做四個斜向移動；Space 設起點，Enter 移除，Escape 取消。
- localStorage 記錄最高解鎖關卡、目前關卡、完成紀錄及 CRT 設定；不保存回合中盤面。儲存不可用時以記憶體模式繼續。
- 通關後 Analyze 顯示本局行動及 N/P 轉換紀錄，作為後續教學分析的基礎。

## L1–L30 全域核心 Move 規則

L1–L30 全部關卡共用同一份不可覆寫的 `CORE_MOVE_RULES`。每回合只能移除 **1～3 顆連續圓圈**，合法方向固定為 **水平、垂直、45° 斜向（↘ / ↙）**；不可跨空格、不可轉彎、不可使用其他角度。`LevelDefinition` 會自動綁定這份規則，Level Validator 也會檢查每一關都使用同一份核心規則。

後續章節可以改變的只有合法 Move 完成後的 deterministic transformation：L11–L15 繼續 Gravity Down、L16–L25 使用 Side Collapse、L26–L30 使用 Center Collapse，L30 Frog Boss 也必須遵守同一份三方向移除規則。也就是說，世界物理會變，但「怎麼移除」不會因關卡而改變。

## 專案結構

```text
src/domain/       GameState、Move、RuleEngine、MoveGenerator、
                  TransformationSystem、Solver、Nim
src/levels/       LevelDefinition、static L1–L5、gravity L6–L10
src/game/         GameController、AIController、SaveStore
src/ui/           Renderer、InputController、Gesture、UIController
src/main.js       組裝 domain、game 與 UI
src/style.css     響應式 CRT 終端呈現與 reduced-motion 支援
scripts/validate.js       關卡約束、最佳續局與 AI 回應驗證
scripts/explore-levels.js 關卡探索輔助工具
tests/*.test.js           Node 自動化測試
tests/browser/           Playwright 操作與完整通關測試
artifacts/               validator JSON 與瀏覽器截圖
index.html               遊戲入口
```

Domain 不依賴 DOM。狀態以 immutable BigInt mask 表示；合法操作集中於 RuleEngine / MoveGenerator。`CORE_MOVE_RULES` 是 L1–L30 的全域 immutable invariant，`LevelDefinition` 只引用它而不能為單一關卡覆寫。TransformationSystem 只負責合法移除之後的世界變換。Solver 使用包含世界規則、尺寸與 mask 的 transposition key，遞迴計算所有合法後繼；GameController 負責回合與取消過期動畫，UI 只負責呈現與輸入。

## L1–L10 validator 結果

`#` 為圓圈、`.` 為空格、`/` 分隔由上往下的列；座標 `rNcM` 從 1 開始。Winning 表示初始局面；Winning Moves 是必勝開局數量。所有初始局面皆為 N-position，玩家可強制獲勝。

| Level | Initial | Winning | Legal | Winning Moves | Optimal First Move | Depth | NimSum |
|---|---|---|---:|---:|---|---:|---|
| L1 REMOVE | `#` | N / winning | 1 | 1 | r1c1 | 1 | 1 |
| L2 LINE | `##` | N / winning | 3 | 1 | r1c1–r1c2 | 1 | 2 |
| L3 NIM | `#.../..../##../..../####` | N / winning | 13 | 4 | r5c1 | 7 | 7 |
| L4 MIRROR | `.##./..../.#../..../.##.` | N / winning | 7 | 1 | r3c2 | 5 | 1 |
| L5 BALANCE | `###.../....../####../....../######` | N / winning | 30 | 2 | r1c1 | 13 | 1 |
| L6 FALL | `#.#/.../.#.` | N / winning | 3 | 1 | r3c2 | 3 | N/A |
| L7 REFORM | `.#.#/.##./#...` | N / winning | 10 | 1 | r1c4–r2c3 | 3 | N/A |
| L8 PREDICT | `#.##/.#.#/#...` | N / winning | 13 | 1 | r1c3–r2c2 | 5 | N/A |
| L9 TRAP | `####/#..#/#...` | N / winning | 18 | 2 | r1c1–r1c2–r1c3 | 5 | N/A |
| L10 GRAVITY TEST | `####/###./###./....` | N / winning | 42 | 2 | r1c2–r2c2 | 9 | N/A |

Depth 為雙方最佳對抗的總半回合數（plies）：能贏的一方儘速獲勝，必敗的一方盡量拖延；同分採固定走法順序。不是玩家操作數，也不是機率期望值。JSON 另列不要求最佳對抗的 minimumTerminalDepth、完整 winning / losing moves、最佳續局，以及最佳首步後每個 AI 回應的玩家反制證明。

教學約束均通過：L1 點選、L2 多顆直線移除、L3 heaps 1/2/4、L4 唯一首步留下鏡像、L5 30 個合法走法中僅 2 個必勝；L6 所有開局均有明顯掉落；L7 以 45° 斜向作唯一必勝首步並在落下後形成新線；L8 以另一個斜向預判作唯一必勝入口且深度至少 5；L9 的「右側連拿 3 顆」仍是 solver 證明的最大移除陷阱；L10 只有 2 個必勝開局、最佳對抗深度 9。L6–L10 的重力教學約束均由 validator 驗證。

## 數學依據

全域規則現在限制每回合只能移除 1～3 顆，因此 static 直線不再直接假設「長度 n 的 Grundy 值就是 n」。對一條長度 n 的直線，移除連續 r 顆（1≤r≤3）後，可能留下左右兩段長度 a、b，且 a+b=n-r。程式使用 Sprague–Grundy 遞迴：

`g(0)=0`，`g(n)=mex { g(a) XOR g(b) }`

其中集合枚舉所有合法的 r、a、b。加入 45° 斜向後，static 分析以 8-neighbor 連通性切 component；只有整個 component 本身是一條水平、垂直、↘ 或 ↙ 直線時才套用此 straight-run Grundy 證明。互不連通的直線 component 仍是獨立子遊戲，所以總 nimber 是各段 Grundy 值的 XOR。Math Mode 同時顯示實際 heap 長度與其 Grundy 值。

目前關卡用到的 static 長度恰好仍得到 L3：`g(1) XOR g(2) XOR g(4) = 1 XOR 2 XOR 4 = 7`，L5：`g(3) XOR g(4) XOR g(6) = 3 XOR 4 XOR 6 = 1`。例如長度 5 已變成 `g(5)=1`，可證明新上限確實改變了遊戲數學。轉角、分支或十字 component 不套用此直線分解；gravity 世界會在移除後重新連接 component，因此一律回傳 null，UI 顯示 N/A，包括 L6–L10。Solver 始終以完整合法走法與 deterministic transformation 計算最終真值，AI 不依賴 XOR 捷徑。

## Automated test 結果

本次 finalization 使用 `npm run check` 驗證：22/22 Node tests、10/10 關卡 validator、51/51 Playwright tests（17 個案例 × 3 個瀏覽器專案），production build 成功。

測試包含：所有 3×2 static 盤面的獨立暴力勝負 oracle、所有 3×3 gravity 盤面的獨立 oracle（兩者都獨立枚舉橫／直／兩種 45° 斜線）、重力守恆與冪等性、符合 straight-run certificate 的 3×3 盤面，以及水平／垂直長度 8 的所有子集合之遞迴 mex 與 solver 一致性。另測試 ↘ / ↙ 直線 Grundy、實際 diagonal gesture、全域最多 3 顆規則、L1–L10 可達局面的 AI、完整通關、存檔、取消手勢、動畫鎖定、重啟、鍵盤與版面。

瀏覽器測試逐一確認 L3 heaps 1/2/4 與 Nim sum 7、L5 heaps 3/4/6 與 Nim sum 1，以及 L6–L10 的 N/A。Chromium 手機手勢使用 CDP 真實 touch events；WebKit 的拖曳走 pointer/mouse 路徑，另有 touch tap 測試。

## 已知限制與下一階段

- Prototype 只含 L1–L10；side / center collapse 與 Frog Boss 尚未實作。
- GameState 目前限制總盤面面積最多 64 格。每回合最多移除 3 顆是全域遊戲規則，不是盤面長度限制；同步精確 solver 的成本仍隨狀態空間快速成長，不適合直接放大到高密度棋盤。
- 手機為瀏覽器裝置模擬測試，仍需實體 iOS / Android 長時間觸控與效能驗證。無 Capacitor 包裝、雲端保存或帳號。
- Analyze 只有回合紀錄，尚無完整推理教學；localStorage 被清除時進度會消失。
- 下一階段先將 solver 移入 Web Worker 並建立效能預算，再以 validator 設計 L11–L15；加入 transformation 前後預覽、完整分析回放與實機驗證。之後再擴充 L16–L25 Side Collapse、L26–L30 Center Collapse。所有未來關卡都必須繼續使用同一份 `CORE_MOVE_RULES`：橫／直／45°斜向、連續 1～3 顆、不可跨空格。

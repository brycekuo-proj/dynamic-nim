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

- 滑鼠或手指從圓圈開始，沿水平或垂直方向拖曳，放開即移除。可以只點一顆；不可跨空格、轉彎或斜劃。非法手勢取消，不消耗回合。
- L1–L5 為 static；L6–L10 每次移除後各欄向下填滿空位。動畫與 AI 回合期間鎖定輸入。
- 可重試、選擇已解鎖關卡、開啟提示與切換 CRT 效果。L5 後有 GRAVITY 章節轉場。
- `D` 或 Math 按鈕顯示局面 ID、合法走法、勝負、最佳走法、深度及適用時的 heaps / Nim sum。勝負是「輪到行動的一方」的評估。
- 鍵盤：聚焦棋盤後方向鍵移動，Space 設起點，方向鍵延伸，Enter 移除，Escape 取消。
- localStorage 記錄最高解鎖關卡、目前關卡、完成紀錄及 CRT 設定；不保存回合中盤面。儲存不可用時以記憶體模式繼續。
- 通關後 Analyze 顯示本局行動及 N/P 轉換紀錄，作為後續教學分析的基礎。

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

Domain 不依賴 DOM。狀態以 immutable BigInt mask 表示；合法操作集中於 RuleEngine / MoveGenerator。TransformationSystem 產生確定性重力結果與動畫對應資料。Solver 使用包含世界規則、尺寸與 mask 的 transposition key，遞迴計算所有合法後繼；GameController 負責回合與取消過期動畫，UI 只負責呈現與輸入。

## L1–L10 validator 結果

`#` 為圓圈、`.` 為空格、`/` 分隔由上往下的列；座標 `rNcM` 從 1 開始。Winning 表示初始局面；Winning Moves 是必勝開局數量。所有初始局面皆為 N-position，玩家可強制獲勝。

| Level | Initial | Winning | Legal | Winning Moves | Optimal First Move | Depth | NimSum |
|---|---|---|---:|---:|---|---:|---|
| L1 REMOVE | `#` | N / winning | 1 | 1 | r1c1 | 1 | 1 |
| L2 LINE | `##` | N / winning | 3 | 1 | r1c1–r1c2 | 1 | 2 |
| L3 NIM | `#.../..../##../..../####` | N / winning | 14 | 4 | r5c1 | 7 | 7 |
| L4 MIRROR | `.##./..../.#../..../.##.` | N / winning | 7 | 1 | r3c2 | 5 | 1 |
| L5 BALANCE | `###.../....../####../....../######` | N / winning | 37 | 2 | r1c1 | 13 | 1 |
| L6 FALL | `#.#/.../.#.` | N / winning | 3 | 1 | r3c2 | 3 | N/A |
| L7 REFORM | `.###/##../....` | N / winning | 10 | 1 | r1c3–r1c4 | 3 | N/A |
| L8 PREDICT | `#.##/###./....` | N / winning | 12 | 1 | r2c2–r2c3 | 5 | N/A |
| L9 TRAP | `####/#..#/#...` | N / winning | 17 | 2 | r1c1–r1c2–r1c3 | 5 | N/A |
| L10 GRAVITY TEST | `####/#.##/#.../#...` | N / winning | 24 | 2 | r1c3–r1c4 | 7 | N/A |

Depth 為雙方最佳對抗的總半回合數（plies）：能贏的一方儘速獲勝，必敗的一方盡量拖延；同分採固定走法順序。不是玩家操作數，也不是機率期望值。JSON 另列不要求最佳對抗的 minimumTerminalDepth、完整 winning / losing moves、最佳續局，以及最佳首步後每個 AI 回應的玩家反制證明。

教學約束均通過：L1 點選、L2 整線移除、L3 heaps 1/2/4、L4 唯一首步留下鏡像、L5 37 個合法走法中僅 2 個必勝；L6 所有開局均有明顯掉落；L7 最佳首步形成新線；L8 必須預測重力且深度至少 5；L9 最大整排移除為已證明陷阱；L10 形成新線且對抗深度至少 7。L7–L10 均有重力改變開局勝負評估的 witness。

## 數學依據

在 static 世界，若每個上下左右連通 component 都是單一水平或垂直直線，則每段長度 n 的 Grundy 值為 n，沒有額外的線段長度限制。證明採歸納：空線段 g(0)=0；刪除尾端能到達每個 k<n，因此所有 0…n−1 都可達。內部刪除留下互不連通的 a、b，滿足 a+b<n；後繼 nimber 為 a XOR b，且 a XOR b ≤ a+b<n。因此所有後繼都小於 n，mex 恰為 n。互不連通線段的總 nimber 由 Sprague–Grundy 和定理得到各長度 XOR。

內部刪除會分裂 heap，所以完整走法圖不等同傳統 Nim，但 Grundy 值及 N/P 判定相同。刪除不會讓 static component 相連，故後繼仍可分析。空 static 盤面回傳 heaps=[]、XOR=0。

L3：1 XOR 2 XOR 4 = 7。L5：3 XOR 4 XOR 6 = 1。轉角、分支或十字 component 不符合證明；gravity 世界可能重新連接 component，因此一律回傳 null，UI 顯示 N/A，包括 L6–L10。Solver 始終以完整合法走法與 transformation 計算最終真值，AI 不依賴 XOR 捷徑。

## Automated test 結果

本次 finalization 使用 `npm run check` 驗證：21/21 Node tests、10/10 關卡 validator、48/48 Playwright tests（16 個案例 × 3 個瀏覽器專案），production build 成功。

測試包含：所有 3×2 static 盤面的獨立暴力勝負 oracle、所有 3×3 gravity 盤面的獨立 oracle、重力守恆與冪等性、所有符合直線條件的 3×3 盤面，以及水平／垂直長度 8 的所有子集合之遞迴 mex 與 solver 一致性。另涵蓋兩條長度 1–5 的 isolated runs 及所有首步後繼、長度到 64 的水平／垂直證明判定、L1–L10 可達局面的 AI、完整通關、存檔、取消手勢、動畫鎖定、重啟、鍵盤與版面。有限枚舉為 regression evidence；任意長度的數學保證來自上述證明。

瀏覽器測試逐一確認 L3 heaps 1/2/4 與 Nim sum 7、L5 heaps 3/4/6 與 Nim sum 1，以及 L6–L10 的 N/A。Chromium 手機手勢使用 CDP 真實 touch events；WebKit 的拖曳走 pointer/mouse 路徑，另有 touch tap 測試。

## 已知限制與下一階段

- Prototype 只含 L1–L10；side / center collapse 與 Frog Boss 尚未實作。
- GameState 目前限制總盤面面積最多 64 格；這是 state API 限制，Nim 分析本身沒有 length≤2 限制。同步精確 solver 的成本隨狀態空間指數成長，不適合直接放大到高密度棋盤。
- 手機為瀏覽器裝置模擬測試，仍需實體 iOS / Android 長時間觸控與效能驗證。無 Capacitor 包裝、雲端保存或帳號。
- Analyze 只有回合紀錄，尚無完整推理教學；localStorage 被清除時進度會消失。
- 下一階段先將 solver 移入 Web Worker 並建立效能預算，再以 validator 設計 L11–L15；加入 transformation 前後預覽、完整分析回放與實機驗證。之後再擴充 side / center collapse，維持 determinism 與每關可驗證的教學目標。

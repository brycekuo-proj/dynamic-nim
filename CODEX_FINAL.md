# Dynamic Nim finalization

- 已驗證實作 commit SHA：`30491b364767c300ee8896e1acf2d08ff0684513`（`fix: finalize Dynamic Nim prototype and straight-run analysis`）。
- 本報告為後續的純文件 commit；最終 checkout SHA 可用 `git rev-parse HEAD` 查詢，避免文件自引用自身尚未生成的 hash。
- GitHub remote：`origin` → https://github.com/brycekuo-proj/dynamic-nim.git
- 目標分支：`main`；明確推送指令：`git push origin main`。

後續規則更新：全域改為每回合最多移除 3 顆。原先無移除上限時的 `g(n)=n` 證明因此不再適用；目前 static 直線 component 以「移除 1～3 顆後左右分裂」的 Sprague–Grundy mex 遞迴計算，轉角、分支、十字及 gravity 世界仍回傳 null / N/A；solver 維持最終真值。

驗證日期：2026-09-23。`npm run check` exit code 0：

| 檢查 | 結果 |
|---|---|
| Node unit / property / level / controller tests | 21 passed、0 failed |
| L1–L10 validator | 10 passed，全部 N / winning |
| Playwright | 48 passed、0 failed（16 案例 × desktop Chromium、mobile Chromium、mobile WebKit） |
| Production build | 成功；Vite 8.3.0，23 modules |

L3 heaps 1/2/4 → Nim sum 7；L5 heaps 3/4/6 → Nim sum 1；L6–L10 → N/A。Property tests 比較遞迴 mex、solver 勝負與受限直線 Grundy XOR，涵蓋 certified 3×3 盤面、長度 8 水平／垂直線所有子集合、長度 1–5 的兩線組合及首步後繼；另測到 state API 的 64 格上限與每回合最多 3 顆限制。

README 已包含專案結構、npm 指令、玩法、完整 validator 表、數學依據、測試結果、已知限制與下一階段。完整可重現驗證資料位於 `artifacts/level-validation.json`。

提交本報告後的交付檢查：推送 `origin main`、核對 remote main 與本機 HEAD 相同，並確認 `git status --short` 沒有輸出。

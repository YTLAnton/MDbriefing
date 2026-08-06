# 主題預覽 — 同一份內容，四種底色與標誌組合

> 這四份的**內容完全相同**（都來自 `content/demo.md`），差別只在 frontmatter 的
> `theme:` 與 `logo:` 兩行。雙擊打開比較，決定某場簡報要用哪一組。

| 檔案 | 底色 | 標誌 | `.md` 怎麼寫 |
|---|---|---|---|
| [`../demo/index.html`](../demo/index.html) | 黑底 | 無 | 兩欄都省略（預設） |
| [`dark-tomoaid.html`](dark-tomoaid.html) | 黑底 | TomoAid（原色 + 淺色底片） | `logo: tomoaid` |
| [`light-none.html`](light-none.html) | 白底 | 無 | `theme: light` |
| [`light-tomoaid.html`](light-tomoaid.html) | 白底 | TomoAid（原色，無底片） | `theme: light`＋`logo: tomoaid` |

## 看的時候注意這幾點

- **標誌沒有被改色**：四份用的都是官方原色。黑底那份多了一層淺色底片，讓標誌回到它被設計的底色上——因為中央那圈深藍在近黑底上對比只有 1.72:1，不加底片會「中間破一個洞」。白底那份底片自動歸零、不存在。
- **換底色不會脫色**：兩個主題提供同一組八個色名，各自給適合該底色的值（深色版一律提亮），小字全部達 WCAG AA（≥4.5:1）。
- **形態完全一樣**：滾動吸附、方向鍵與左鍵單擊翻頁、右側圓點目錄、可折疊、逐項浮現——四份行為一致，主題只影響外觀。

## 這些檔案的定位

**這是預覽樣本，不是交付物**。它們與 `briefings/demo/index.html` 共用同一份原稿，
所以改了 `content/demo.md` 或 `assets/` 之後，這四份要一起重新產出，否則會互相矛盾。
不想維護時直接整個資料夾刪掉即可——真正的 golden 對照組只有 `briefings/demo/`。

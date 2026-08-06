# 簡報規格書 — MDbriefing Briefing Spec

> 本檔定義一份 MDbriefing 簡報的**設計系統**、**版面區塊**、**四個互動功能**、以及 **Markdown ↔ HTML 結構對照表**。
> 它是「共用樣式 `assets/`」「空白範本 `templates/`」「示範簡報 `briefings/demo/`」「未來的 MD→HTML 轉換腳本」四者共同遵循的真理來源——各方的區塊結構與 class 名必須與本檔一一對應。
>
> **對焦範圍只有「形態」**：一頁一螢幕的全螢幕投影片、滾動吸附、四個互動、版面語彙——這部分參考本機 `_PM/resource/PM 主管 90 天目標計劃.html`（該檔為 TomoAid 內部文件，**刻意未入版控**，見 `.gitignore`）。
> **視覺不跟任何外部簡報對焦**：預設配色是本專案原有的深色系；配色、造型、字體、標誌全部可換主題（`assets/themes/`）。
> 要看「長什麼樣」看 `briefings/demo/index.html`（golden 對照組），它是本規格的實作基準。

## PDM Summary（白話、≤200 字）

**這份文件做什麼**：把「一份簡報長什麼樣、由哪些區塊組成、四個互動怎麼運作、Markdown 怎麼對應到 HTML」講清楚到工程師能照做、非技術者也看得懂。

**重點**：簡報是**一頁一螢幕的投影片**，滾動會自動吸附到下一頁。**預設是深色系、不掛標誌**；配色、造型、字體、標誌可以整組換主題（例：`theme: tomoaid-light`），依觀眾決定。版面語彙共 16 種區塊（封面、目錄、章節、眉標、導言、段落、卡片組、重點、標籤、流程、時間軸、表格、驗收框、可折疊、金句、結尾）。四個互動是**翻頁（滾動吸附／鍵盤四向鍵／滑鼠左鍵單擊）、目錄跳轉、可折疊段落、逐項浮現**。最後一張對照表規定每個 Markdown 寫法該變成哪段 HTML，寫轉換腳本就照這張表。

---

## 零、產出物形態（先定調）

### 零.1 兩種形態：`deck` 與 `doc`

MDbriefing 產出兩種東西。它們用途相反，**不互相套規格**——「視覺不一致」是刻意的區分，不是待修的缺陷。

| 形態 | 是什麼 | 用途 | 誰在操作 | 本規格適用？ |
|---|---|---|---|---|
| `deck` 投影片 | 一頁一螢幕、滾動吸附、可換主題的互動簡報 | 會議上帶著人一頁一頁走 | 簡報者（你） | ✅ §一～§七全部條文 |
| `doc` 報價文件 | 單欄 760px、可折疊卡片的捲動式長文件 | 客戶自己上下滾、比對金額、展開細節慢慢看 | 客戶（自行閱讀） | ❌ 不適用 |

**為什麼分開**：差別在**形態**不在配色（兩者的預設配色都是專案深色系）。報價要能來回比對金額，捲動式長文件比投影片好用；投影片的「一頁一螢幕」反而讓客戶難以並排比較。兩者的操作主體也不同——deck 由你控制節奏，doc 由客戶自己控制。

**現有 `doc` 形態檔案**（皆已交付客戶，維持原樣，不改視覺、不改文案）：

| 檔案 | 內容 |
|---|---|
| `briefings/AD_data_transfer_bot/index.html` | 行銷數據自動化工具 服務報價提案（Phase 1A / 1B / 1C 分期） |
| `briefings/Self-Media_Course_CardGame/index.html` | 自媒體課程卡牌遊戲 服務報價提案 |

`doc` 形態目前每份各自寫死 CSS，**沒有共用樣式**；等真的出現第三份報價需求時再抽共用——為兩個不會再改的檔案抽共用是做白工。新的報價若想走 deck 視覺，做成 deck 即可，舊檔自然淘汰。

### 零.2 `deck` 形態的產出規定

以下 §一～§七的所有條文，只規範 `deck` 形態。

| 項目 | 規定 |
|---|---|
| 檔案形態 | **單一 `.html` 自包含檔**，路徑 `briefings/<主題>/index.html` |
| 開啟方式 | 直接雙擊、以 `file://` 開啟即可完整運作 |
| 外部資源 | **零**——不得出現任何 `http(s)://` 的 `href` / `src` / `url()`；字型只用系統內建字族 |
| 樣式與腳本來源 | `assets/deck.css`、`assets/deck.js`、`assets/themes/<主題>.html` 為**真理來源**；產出時**整段內嵌**進 `<style>` / `<script>` / `<body>`，不以相對路徑外連 |
| 頁面模型 | 每頁 = 一個 `<section class="slide">`，`min-height:100vh` |

> 為什麼內嵌而不外連：`assets/` 讓多份簡報共用同一套設計系統、改一處全體受益；但交付給需求方時是把單一 `.html` 傳出去，外連會在對方電腦上失效。兩者兼顧的作法就是「共用來源 + 產出時內嵌」。

---

## 一、設計系統（design tokens）

**形態固定、視覺可換**。實作見 `assets/deck.css` §① 與 `assets/themes/`。

### 1.1 對焦範圍：只有形態，不含視覺

**形態**（一頁一螢幕、滾動吸附、四個互動、版面語彙）是固定的，由 `assets/deck.css` 定義。
**視覺**（配色、造型、字體、標誌）**全部可換**，由主題包（`assets/themes/*.html`）覆寫 token。
`deck.css` 的所有規則只引用 token、不寫死顏色——所以換主題不需要改任何一行版面規則。

### 1.2 預設主題的 token（專案深色系）

來源是本專案既有的兩份深色報價文件（`briefings/AD_data_transfer_bot/`、
`briefings/Self-Media_Course_CardGame/`）的色票與造型，**不是**從任何外部簡報抄來的。

| Token | 預設值 | 用途 |
|---|---|---|
| `--bg` | `#0d0f14` | 頁面底色 |
| `--surface` | `#161920` | 卡片、表格、折疊區塊底色 |
| `--surface-2` | `#1e2230` | 表頭、標籤、流程節點、行內程式碼底色 |
| `--border` | `#2a2f3f` | 邊框、分隔線 |
| `--border-light` | `#323849` | 目錄未選中的圓點 |
| `--text-primary` | `#e4e8f2` | 標題與主要文字 |
| `--text-secondary` | `#7a849e` | 導言、說明、表格內文 |
| `--text-muted` | `#4a5268` | 眉標、小標籤、頁碼 |
| `--gold` | `#d4a843` | 重點色（**預設色**） |
| `--blue` | `#5b8dee` | 重點色 |
| `--green` | `#6fcf97` | 重點色 |
| `--accent-default` | `var(--gold)` | 每頁沒指定「色」時用的重點色 |
| `--accent-dim` | `#a07c2e` | 重點色暗一階：驗收框虛線、展開後的邊框 |
| `--accent` | `var(--accent-default)` | **當前頁**的重點色（由頁面 inline style 指定） |
| `--accent-ink` | `var(--accent)` | 重點色「當文字用」的版本（見下方說明） |

- **`--accent` 與 `--accent-ink` 的差別**：`--accent` 用於色塊（眉標圓點、卡片上緣、清單符號、時間軸圓點、目錄高亮）；`--accent-ink` 用於文字（`kicker`、驗收框標籤、封面大數字、折疊指示符）。深色主題上亮色字對比本來就夠，兩者相同；**淺色主題必須把 `--accent-ink` 覆寫成深一階**，否則小字對比不足。
- 重點色的指派方式見 §三「章節屬性 `色`」。可用色名由主題決定；寫了主題沒定義的色名會自動退回 `--accent-default`，不會破版。

### 1.3 字體與尺度

| 項目 | 預設值 | Token |
|---|---|---|
| 字族 | `'Microsoft JhengHei','微軟正黑體','PingFang TC',system-ui,sans-serif` | `--font-stack` |
| 根字級 | `16px` | `--root-size` |
| 行高 | `1.7` | — |
| `h1` | `clamp(30px,5vw,58px)` / `700` | — |
| `h2` | `clamp(22px,3.4vw,38px)` / `700` | — |
| 導言 `.lede` | `clamp(14px,1.7vw,17px)` / `--text-secondary` / `max-width:40em` | — |

### 1.4 造型

| 項目 | 預設值 | Token |
|---|---|---|
| 圓角 | `10px`（大區塊 `14px`） | `--radius` / `--radius-lg` |
| 陰影 | `0 4px 20px rgba(0,0,0,.35)` | `--shadow` |
| 卡片上緣重點色粗細 | `2px` | `--card-accent-width` |
| 頁面留白 | `clamp(48px,8vh,88px) clamp(20px,6vw,76px)` | — |
| 響應式斷點 | `760px`——以下所有 `.grid` 降為單欄 | — |

---

## 二、四個互動功能規格

> 每項皆含三件：**使用者看到什麼 / 怎麼操作 / 預期行為**。實作見 `assets/deck.js`。

### 互動 1 — 翻頁（pagination）

- **使用者看到什麼**：一次一頁佔滿整個畫面（`cover` → 各 `section` → `closing`）；每頁右下角有頁碼（例：`04 / 08`）。**沒有上一頁 / 下一頁按鈕**。
- **怎麼操作**：三種方式並行——
  1. **滾動**：滑鼠滾輪或觸控板捲動，畫面自動吸附（snap）到最接近的頁首。
  2. **鍵盤**：`→` / `↓` 下一頁；`←` / `↑` 上一頁；`Home` 回封面；`End` 到最後一頁。
  3. **滑鼠左鍵單擊**：在頁面空白處單擊左鍵 → 下一頁。
- **預期行為**：
  - 平滑捲動到目標頁頂端；在第一頁再按上一頁、最後一頁再按下一頁時停在原地（不繞回）。
  - 連續快按時以「目標頁」為基準遞增，不會因捲動動畫未完成而算錯頁。
  - **點擊不翻頁的例外**（必須排除，否則會誤觸）：非左鍵、雙擊以上、按住 `⌘/Ctrl/Alt/Shift`、點在 `a` / `button` / `summary` / `details` / 表單元件 / `.toc` / 標了 `.no-advance` 的區域內、或使用者正在選取文字時。
  - 鍵盤：焦點在輸入元件內時不攔截；`prefers-reduced-motion: reduce` 時改為瞬間跳轉（不平滑捲動）。

### 互動 2 — 章節導覽（目錄跳轉，toc jump）

- **使用者看到什麼**：畫面右側垂直固定一排小圓點，一頁一點；目前所在頁的圓點放大並轉為該頁重點色。滑鼠移到目錄上時，每點右側才展開該頁標題文字（帶底色片）——標題**不常駐**，否則會壓到頁面右側的表格與卡片。
- **怎麼操作**：點任一圓點。
- **預期行為**：跳到該頁頂端；高亮隨捲動自動更新到目前可見面積最大的頁（`aria-current="true"`）。目錄**由各頁標題自動生成**，作者不手寫。≤760px 時只顯示圓點、不顯示標題文字。

### 互動 3 — 可折疊段落（collapsible）

- **使用者看到什麼**：頁內某些細節以「可點開的標題列」呈現（卡片底色），預設收合，標題左側有 ▸ 指示。
- **怎麼操作**：點該標題列。
- **預期行為**：展開顯示內容、指示旋轉為 ▾；再點一次收合；同頁多個可折疊段落彼此獨立。以原生 `<details>` 實作（不需 JS，鍵盤與螢幕閱讀器天然可用）。**點擊可折疊段落不會觸發翻頁**（見互動 1 例外）。

### 互動 4 — 逐項浮現（sequential reveal）

- **使用者看到什麼**：卡片組 / 流程 / 時間軸這類多項並列的區塊，在該頁進入畫面時由左至右（或由上至下）**依序**淡入上浮，而非一次全出現。
- **怎麼操作**：不需操作，捲到該頁自動觸發。
- **預期行為**：容器帶 `.seq`，子項帶 `.step`；`IntersectionObserver`（`threshold: .45`）在容器進入視窗時加上 `.inview`，子項依 `transition-delay` 階梯依序浮現；**只觸發一次**（浮現後 `unobserve`）。`prefers-reduced-motion: reduce` 或瀏覽器不支援 `IntersectionObserver` 時，直接全部顯示。

| 區塊 | 每項延遲階梯 |
|---|---|
| 卡片組 | `0s / .6s / 1.2s / 1.8s …` |
| 流程 | `0s / .5s / 1s / 1.5s …`（含箭頭，箭頭與其後的節點各算一階）<br>節點多於 6 個時**等比縮短**每階延遲，使整段浮現不超過約 3.5 秒 |
| 時間軸 | `0s / .8s / 1.6s …` |

---

## 三、頁與章節屬性

一頁 = 一個 `## 標題`。標題下方緊接**屬性行**（全形冒號 `：`，可省略）：

| 屬性 | 值 | 作用 | 省略時 |
|---|---|---|---|
| `眉標` | 任意短文字 | 標題上方的小標籤（`.eyebrow`），左側帶一個重點色圓點 | 不顯示眉標 |
| `色` | 由主題決定的色名 | 該頁的重點色：眉標圓點、卡片上緣、重點清單圓點、時間軸圓點、目錄高亮都用它 | 該主題的 `--accent-default` |

**可用色名依主題而定**（見 `assets/themes/README.md`）：

| 主題 | 預設色 | 可用色名 |
|---|---|---|
| `dark`（預設） | `gold` | `gold` `blue` `green` `yellow` `purple` `teal` `coral` `navy` |
| `light` | `teal` | 同上八個 |

兩個主題都提供**同一組八個色名**，各自給適合該底色的值（深色主題一律提亮）——
所以同一份 `.md` 切換 `theme:` 不會脫色，小字也維持 WCAG AA（≥4.5:1）對比。

```markdown
## 這一季要證明一件事
眉標：背景與定位
色：blue
```

轉換時該頁 `<section>` 上帶
`style="--accent:var(--blue,var(--accent-default));--accent-ink:var(--blue-ink,var(--blue,var(--accent-ink-default)))"`，
頁內各區塊靠 `var(--accent)` / `var(--accent-ink)` 繼承，不需逐個寫死顏色。

> 這串 `var()` 的層層 fallback 是刻意的**換主題保險**：若換了主題而新主題沒有 `blue` 這個色名，會自動退回該主題的預設重點色，不會變成透明或破版；淺色主題若沒為某色名定義 `-ink`，也會退回色名本身。

---

## 四、版面區塊定義（16 種）

> 「區塊代號」是各方對照的共同鍵（key）。範本、示範 HTML、對照表都用這組代號。

| 區塊代號 | 中文名 | 一句話用途 | 必填？ |
|---|---|---|---|
| `cover` | 封面 | 第一頁：大標誌（有主題時）、大標題、副標、日期署名 | 必填 |
| `toc` | 章節導覽 | 右側固定圓點目錄，點擊跳頁；由各頁標題**自動生成** | 自動 |
| `section` | 章節（頁） | 簡報主體，一個 `##` = 一頁 | 必填（≥1） |
| `eyebrow` | 眉標 | 頁標題上方的小標籤＋重點色圓點 | 選填 |
| `lede` | 導言 | 頁標題下的一句次要色引言 | 選填 |
| `paragraph` | 段落 | 頁內一般內文 | 視內容 |
| `cards` | 卡片組 | 2–5 張並列卡片，每張有重點色上緣、粗體標題、次要色說明 | 選填 |
| `highlights` | 重點摘要 | 條列重點，項目符號為重點色圓點 | 選填 |
| `pills` | 標籤列 | 一排膠囊狀關鍵詞（指標、交付物名稱等） | 選填 |
| `flow` | 流程 | 橫向「節點 → 節點 → 節點」步驟圖，逐項浮現 | 選填 |
| `timeline` | 時間軸 | 分段里程碑，每段一個標題＋數條細項，逐項浮現 | 選填 |
| `table` | 表格 | 交付物 / 期限 / 條件這類對照表 | 選填 |
| `verdict` | 驗收框 | 重點色虛線框，放驗收條件或交付承諾 | 選填 |
| `collapsible` | 可折疊段落 | 預設收合、點擊展開的細節 | 選填 |
| `quote` | 金句 | 居中粗體收尾句 | 選填 |
| `closing` | 結尾 | 最後一頁：`## 結尾`，可含金句與小標誌 | 必填 |

### 各區塊內容約定

- **`cover` 封面**：內容全部來自 frontmatter 的 `title` / `subtitle` / `author` / `date`，不在內文另寫。`title` 中可用 `{{數字}}` 標記一個會從 1 數上去的大數字（見 §六 count-up）。
- **`toc`**：不手寫，由所有 `## 標題`（含 `cover` 與 `closing`）自動列成右側圓點目錄。
- **`cards` 卡片組**：`### 卡片` 後接 `- **標題** 說明文字`。欄數由張數決定：2 張→`cols-2`、3 張→`cols-3`、4 張→`cols-4`、5 張以上→`cols-3`。每張卡片上緣顏色**依序輪替**五個重點色（從該頁的 `色` 起算）；要指定單張顏色時在項目最前加 `{色名}`，例：`- {purple} **PM 團隊** 3 位成員…`。
- **`highlights` 重點摘要**：`### 重點` 後接 `- 項目`。標題可換（如 `### 現況`、`### 改善方向`），`<h3>` 文字隨之替換；兩組並列時放進 `.grid.cols-2`（左問題、右對策的常見版型）。
- **`pills` 標籤列**：`### 標籤` 後接 `- 項目`。
- **`flow` 流程**：`### 流程` 後接 `- 節點文字`，節點之間自動插入箭頭。
- **`timeline` 時間軸**：`### 時間軸` 後接 `- **段落標題**` 與其下縮排的 `- 細項`。
- **`table` 表格**：`### 表格` 後接標準 Markdown 表格。純數字 / 日期欄位加 `.num`（不換行、等寬數字）。
- **`verdict` 驗收框**：`### 驗收` 後接一段文字；HTML 中前綴一個粗體 `<b>驗收</b>`。標題可換（如 `### 試用期交付`），前綴字隨之替換。
- **`collapsible`**：以 `::: 可折疊 標題文字` 起、`:::` 結束（純文字標記，非 HTML）。
- **`quote` 金句**：`### 金句` 後接一段文字，居中粗體。
- **`closing` 結尾**：最後一頁，標題不限於「結尾」；有品牌時在最後放小標誌。

---

## 五、主題槽與標誌槽（可換視覺）

**底色與標誌是兩個獨立的選擇**，任意組合。frontmatter 三個欄位：

```yaml
theme: dark        # 底色：dark（預設，近黑）／light（米白）／自訂主題檔名
logo: none         # 標誌：none（預設，不掛）／tomoaid／自訂標誌檔名
底片: 自動          # 可選：自動（預設，由主題決定）／無（強制不加底片）
```

| 槽 | 檔案位置 | 管什麼 | 預設 |
|---|---|---|---|
| `theme` | `assets/themes/<名>.html` | 底色、表面色、文字三階、重點色、圓角、陰影、字族、根字級 | `dark` |
| `logo` | `assets/logos/<名>.html` | 標誌 SVG（官方原色）與 `--brand-name` | `none` |

常見組合：

| 想要的效果 | 寫法 |
|---|---|
| 黑底、不掛標誌（大部分場合） | 兩欄都省略 |
| 黑底 + TomoAid | `logo: tomoaid` |
| 白底 + TomoAid | `theme: light`＋`logo: tomoaid` |
| 白底、不掛標誌（給客戶的提案） | `theme: light` |
| 客戶色系 + 客戶標誌 | 各放一個檔案到 `themes/` 與 `logos/`，兩欄填檔名 |

### 5.1 標誌絕對不改色，底片來解決深底可見度

**不得為了配合背景而修改任何標誌的顏色。** 深色底放彩色標誌的對比問題，用
**淺色底片（keyline plate）** 解決——`.logo-plate` 定義在 `deck.css`，外觀由當前
主題的三個 token 決定，所以同一份標誌包在黑底會自動長出底片、在白底自動消失：

| Token | `dark` | `light` |
|---|---|---|
| `--logo-plate-bg` | `#FAF8F5` | `transparent` |
| `--logo-plate-pad` | `3px` | `0px` |
| `--logo-plate-radius` | `7px` | `0px` |

`底片：無` 時，轉換器在產出 HTML 的 `<style>` 末尾補上這三個值的歸零覆寫。
有官方反白／單色版標誌時，換掉標誌包的 defs 並設 `底片：無`，那是最佳解。

實測依據（TomoAid 標誌 vs `#0d0f14`）：四個小人 4.6～10.8:1 都夠，
但中央甜甜圈暗端 `#123E5F` 只有 **1.72:1**，不加底片會「中間破一個洞」。

### 5.2 兩個槽的貼入位置

| 段 | 來源 | 貼到哪裡 | 次數 |
|---|---|---|---|
| 主題 `<style>` | `themes/<名>.html` | `<style>` 內、`deck.css` 之後 | 1（`theme: dark` 可略，值同預設） |
| 標誌 `<style>`（`--brand-name`） | `logos/<名>.html` | `<style>` 內、主題之後 | 1 |
| 【B】標誌 `defs`（含 `id="brand-mark"`） | `logos/<名>.html` | `<body>` 開頭 | 1 |
| 【C-1】每頁左上標誌（`.logo`） | `logos/<名>.html` | 每個 `section.slide` 第一行 | 每頁 1 |
| 【C-2】封面大標誌（`.logo-plate.lg`） | `logos/<名>.html` | `cover` 的 `<h1>` 之前 | 1 |
| 【C-3】結尾小標誌 | 不使用（Anton 決定結尾頁不掛標誌；`.logo-plate.sm` 的 CSS 規則仍保留，供日後需要時使用） | — | 0 |

標誌一律以 `<use href="#brand-mark">` 取用，尺寸靠 `width` / `height` 調整。
`logo: none` 時標誌相關的全部略過。詳見 `assets/themes/README.md` 與 `assets/logos/README.md`。

---

## 六、Markdown ↔ HTML 結構對照表

> 涵蓋上述 16 種區塊的**所有**項目，無區塊只出現在單邊（供轉換腳本照表實作）。
> 「Markdown 寫法」欄為作者在 `.md` 中實際寫的；「HTML 結構」欄為轉換後產出。

| 區塊代號 | Frontmatter / Markdown 寫法 | HTML 結構（轉換後） |
|---|---|---|
| `cover` | frontmatter：`title:` / `subtitle:` / `author:` / `date:` | `<section class="slide cover" id="sec-1">` 內含【C-2】大標誌（有標誌時）、`<h1>`(title)、`<p class="subtitle">`、`<p class="meta">`(author · date)、`<div class="pageno">01 / NN</div>` |
| — 主題與標誌 | frontmatter：`theme:` / `logo:` / `底片:` | 依 §五.2 把主題 `<style>`、標誌 `<style>`、【B】defs、【C-1~3】貼入對應位置 |
| — count-up | `title:` 中的 `{{90}}` | `<span data-countup="90">1</span>`（`deck.js` 以 3 秒 easeOut 數到 90） |
| `toc` | （不手寫，由各頁標題自動生成） | `<nav class="toc">` 內每頁一個 `<a href="#sec-N"><span class="tick"></span><span class="label">標題</span></a>` |
| `section` | `## 章節標題` | `<section class="slide" id="sec-N" style="--accent:var(--blue,var(--accent-default));--accent-ink:var(--blue-ink,var(--blue,var(--accent-ink-default)))">` 內含【C-1】`.logo`（有標誌時）、`<h2>`、`<div class="pageno">NN / NN</div>` |
| `eyebrow` | 屬性行 `眉標：背景與定位` | `<div class="eyebrow"><span class="dot"></span>背景與定位</div>`（置於 `<h2>` 之前） |
| — 章節色 | 屬性行 `色：blue` | `section` 的 inline `--accent` / `--accent-ink`（帶 fallback，見 §三） |
| `lede` | `> 導言文字`（區塊引言） | `<p class="lede">導言文字</p>` |
| `paragraph` | 標題下的純文字段落 | `<p>` |
| `cards` | `### 卡片`<br>`- {purple} **標題** 說明` | `<div class="grid cols-N seq">` 內每張 `<div class="card step" style="--accent:var(--purple,var(--accent-default));--accent-ink:var(--purple-ink,var(--purple,var(--accent-ink-default)));transition-delay:.6s"><b>標題</b><span class="muted">說明</span></div>` |
| `highlights` | `### 重點` 後接 `- 項目` | `<div class="highlights"><h3>重點</h3><ul><li>…</li></ul></div>` |
| `pills` | `### 標籤` 後接 `- 項目` | `<div class="pills"><span class="pill">項目</span>…</div>` |
| `flow` | `### 流程` 後接 `- 節點` | `<div class="flow seq">` 內 `<div class="node step">節點</div>` 與 `<div class="arrow step">→</div>` 交錯，各帶 `transition-delay` |
| `timeline` | `### 時間軸`<br>`- **M1 8/3–9/2**`<br>`  - 細項` | `<div class="timeline seq">` 內每段 `<div class="tl-item step"><div class="tl-label">M1 8/3–9/2</div><ul><li>細項</li></ul></div>` |
| `table` | `### 表格` 後接 Markdown 表格 | `<div class="table-wrap"><table><tbody><tr><th>…</th></tr><tr><td>…</td></tr></tbody></table></div>` |
| `verdict` | `### 驗收` 後接一段文字 | `<div class="verdict"><b>驗收</b>文字</div>` |
| `collapsible` | `::: 可折疊 標題`<br>內容文字<br>`:::` | `<details class="collapsible"><summary>標題</summary><div class="body">內容</div></details>` |
| `quote` | `### 金句` 後接一段文字 | `<p class="quote" style="text-align:center">文字</p>` |
| `closing` | `## 結尾` 後接內容 | `<section class="slide closing" id="sec-N">` 內含 `<h2>`、內文、【C-3】小標誌、頁碼 |

### 對照補充說明

- **頁編號 `N`** 由出現順序自動遞增（`sec-1` = 封面、`sec-2`…）；`toc` 的錨點與 `section` 的 `id` 一致。
- **頁碼字串**格式為兩位補零的 `NN / NN`（例：`04 / 08`），分母 = 總頁數（含封面與結尾）。
- **`toc` 雖不手寫**，仍列為一個區塊，以確保「自動生成」這件事被腳本實作、也被示範 HTML 呈現。
- **`.seq` 只加在容器上**，`.step` 只加在需要依序浮現的直接子項上；`transition-delay` 依 §二互動 4 的階梯表寫成 inline style。
- **手繪 SVG 逃生門**：文氏圖這類無法從條列推導的圖解，允許以 `::: svg` … `:::` 原樣穿透（內容直接輸出為 HTML）。此為刻意的例外，使用時 SVG 內的顏色請用 `var(--accent)` / `var(--text-secondary)` 等 token 而非寫死色值（否則換主題會脫色），並加 `aria-hidden="true"`。
- 本表為**人工對照**（目前由 AI 依表手工轉換）；自動轉換腳本為未來 sprint 的任務，屆時照本表實作即可。

---

## 七、對照基準與差異記錄

本規格以本機 `_PM/resource/PM 主管 90 天目標計劃.html` 為視覺與互動基準。

> ⚠️ **該基準檔未入版控**——它是 TomoAid 內部文件（含團隊成員、試用期條件與各項目商業定位），已列入 `.gitignore`，clone 這個 repo 不會拿到它。因此：
> - 基準的**規範內容**（色票、字級、造型、版面語彙、四個互動）已全部條文化在 §一～§六，不需回看原檔即可實作。
> - 需要看「長什麼樣」時，看 `briefings/demo/index.html`（golden 對照組），它是本規格的實作基準。
> - 下表保留與基準的差異紀錄，作為設計決策的來源說明。

與基準的**刻意差異**如下（皆為專案原本承諾、基準未實作的能力）：

| 項目 | 基準（resource） | 本規格 | 理由 |
|---|---|---|---|
| 目錄 | 無 | 右側固定圓點目錄（互動 2） | 專案原規格承諾「章節導覽」 |
| 可折疊 | 無 | 原生 `<details>`（互動 3） | 專案原規格承諾「可折疊段落」 |
| 鍵盤 / 點擊翻頁 | 無（只有滾動吸附） | `← ↑ → ↓`、`Home` / `End`、左鍵單擊 | 現場口頭簡報時不想只靠滾輪 |
| 上一頁 / 下一頁按鈕 | 無 | **不做**（改以鍵盤與點擊取代） | 基準的乾淨版面優先 |
| 標誌 | TomoAid 寫死在檔案裡 | 抽成獨立的**標誌槽** `assets/logos/`，與底色無關 | 依觀眾決定掛誰的標誌；也要能不掛 |
| 流程 / 時間軸 | 手繪 inline SVG（座標寫死） | CSS 版（可從條列推導、響應式） | 要能由 Markdown 生成；手繪 SVG 保留為逃生門 |
| 配色 / 字級 / 造型 / 名稱 | 米白＋五色、Noto Sans TC 19px、TomoAid | **刻意不照抄**。預設是本專案原有的深色系；配色抽成**主題槽** `assets/themes/`，可切 `dark` / `light` / 自訂 | 只對焦形態，不對焦視覺與品牌識別；底色與標誌要能分別選擇 |

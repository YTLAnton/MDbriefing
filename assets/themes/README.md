# 配色主題（theme slot）— 決定底色是黑還是白

> 簡報的**形態**（一頁一螢幕、滾動吸附、翻頁、目錄、可折疊、逐項浮現）固定不變；
> **底色、造型、字體、重點色**由這裡決定。標誌是**另一個獨立的槽**（見 `../logos/`），
> 所以「黑底 + 標誌」「白底 + 標誌」「黑底無標誌」可以任意組合。

## 現有主題

| `theme:` | 底色 | 重點色（可用色名） | 字族 | 圓角 |
|---|---|---|---|---|
| `dark`（省略時的預設） | `#0d0f14` 近黑 | `gold`（預設）／`blue`／`green` | 微軟正黑體 | 10px |
| `light` | `#FAF8F5` 米白 | `teal`（預設）／`yellow`／`purple`／`coral`／`navy` | Noto Sans TC | 18px |

```yaml
theme: light      # 省略或 dark = 預設黑底
logo: tomoaid     # 標誌是另一個槽，見 ../logos/
```

`dark` 的值與 `deck.css` §① 的預設完全相同，所以用 `dark` 時**不需要內嵌 `dark.html`**；
該檔存在的目的是把「黑底主題長什麼樣」寫在一處供對照，以及當新主題的複製起點。

## 主題與標誌的搭配：底片會自動處理

深色底放彩色標誌會有對比問題（見 `../logos/README.md` 的實測數字）。
處理方式是給原色標誌加一層**淺色底片**（`.logo-plate`，定義在 `deck.css`），
底片的外觀由主題的三個 token 決定：

| Token | `dark` | `light` |
|---|---|---|
| `--logo-plate-bg` | `#FAF8F5` | `transparent` |
| `--logo-plate-pad` | `3px` | `0px` |
| `--logo-plate-radius` | `7px` | `0px` |

所以同一份標誌 markup：黑底時自動長出底片、白底時底片自動消失，**不需要為兩種底色各準備一份標誌**。

**手動關掉底片**（例如你有官方反白版標誌）：在 `.md` frontmatter 寫 `底片：無`，
轉換時會在產出 HTML 的 `<style>` 末尾補上這三個值的歸零覆寫。

## 要新增一個主題（例如某個客戶的色系）怎麼做

複製 `light.html` 或 `dark.html` 改名，維持 `<style>` 內單一 `:root{}` 的結構。

**必須覆寫**（否則會沿用預設黑底）：

```css
--bg  --surface  --surface-2  --border  --border-light
--text-primary  --text-secondary  --text-muted
--accent-default  --accent-ink-default  --accent-dim
--accent:var(--accent-default);  --accent-ink:var(--accent-ink-default);
--logo-plate-bg  --logo-plate-pad  --logo-plate-radius
```

**可選覆寫**：`--radius` `--radius-lg` `--shadow` `--card-accent-width` `--font-stack` `--root-size`

**重點色名自訂**：想要什麼色名就定義什麼（如 `--brand-red:#C8102E`），作者在 `.md`
寫 `色：brand-red` 就會用它。**淺色主題**每個色名都要再附一個 `-ink` 深一階版本供文字使用，
否則小字對比不足。寫了主題沒定義的色名會自動退回 `--accent-default`，不會破版。

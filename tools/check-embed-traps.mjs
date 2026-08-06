#!/usr/bin/env node
/**
 * check-embed-traps.mjs — 內嵌陷阱檢查
 *
 * 背景：assets/deck.css 與 assets/deck.js 的內容在產出時會被整段內嵌進 HTML 的
 * <style> / <script> 區塊（見 README.md「為什麼 assets/ 是共用的，產出卻是單檔？」、
 * docs/briefing-spec.md §零.2「產出時整段內嵌」）。若這兩個檔案的註解或內容裡出現
 * 字面上的「結束 style 標籤」（</style）或「結束 script 標籤」（</script），內嵌後
 * 會提前關閉該區塊——deck.css 命中會讓樣式被當文字印在頁面上，deck.js 命中會讓
 * 互動整組失效。deck.css／deck.js 檔頭已各自寫了這條提醒，本檢查把它變成機械保險。
 *
 * 判定不分大小寫（瀏覽器解析結束標籤本來就不分大小寫），也不要求恰好是
 * "</style>"／"</script>"——只要出現 "</style" 或 "</script" 這段字首就算命中，
 * 因為瀏覽器解析結束標籤看到 "</style" 就會觸發，不需要湊滿右角括號。
 *
 * 用法：
 *   node tools/check-embed-traps.mjs                       # 檢查 assets/deck.css 與 assets/deck.js
 *   node tools/check-embed-traps.mjs --files <逗號分隔路徑>  # 檢查指定檔案（測試正控制組用）
 *
 * 回傳值：
 *   0 = 兩個檔案都沒有命中
 *   1 = 有命中，應擋下 commit/push
 *   2 = 檢查沒跑成（檔案不存在或讀不到）
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT_FILES = [
  path.join(PROJECT_ROOT, "assets", "deck.css"),
  path.join(PROJECT_ROOT, "assets", "deck.js"),
];

const TRAPS = [
  { name: "結束 style 標籤（</style）", re: /<\/style/i },
  { name: "結束 script 標籤（</script）", re: /<\/script/i },
];

function fail(message) {
  process.stderr.write(`🛠️ check-embed-traps：檢查沒跑成 → 視為不通過。\n   ${message}\n`);
  process.exit(2);
}

function main() {
  const argv = process.argv.slice(2);
  const getFlag = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : null;
  };
  const filesArg = getFlag("--files");
  const files = filesArg ? filesArg.split(",").map((p) => path.resolve(p.trim())) : DEFAULT_FILES;

  const hits = [];
  const unreadable = [];

  for (const file of files) {
    if (!existsSync(file)) {
      unreadable.push({ file, message: "檔案不存在" });
      continue;
    }
    let content;
    try {
      content = readFileSync(file, "utf8");
    } catch (e) {
      unreadable.push({ file, message: e?.message ?? String(e) });
      continue;
    }
    content.split(/\r?\n/).forEach((line, idx) => {
      for (const t of TRAPS) {
        if (t.re.test(line)) hits.push({ file, line: idx + 1, trap: t.name, text: line.trim().slice(0, 160) });
      }
    });
  }

  console.log(`📂 已檢查 ${files.length - unreadable.length} / ${files.length} 個檔案：${files.join("、")}`);

  if (unreadable.length > 0) {
    process.stderr.write(`\n🛠️ check-embed-traps：有 ${unreadable.length} 個檔案讀不到，這次沒檢查完整 → 視為不通過。\n`);
    for (const u of unreadable) process.stderr.write(`     [檔案未檢查] ${u.file} —— ${u.message}\n`);
  }

  if (hits.length === 0) {
    if (unreadable.length === 0) {
      console.log("\n✅ 未發現字面上的結束 style／script 標籤字串，內嵌陷阱檢查通過。");
      process.exit(0);
    }
    process.exit(2);
  }

  process.stderr.write(`\n❌ check-embed-traps：發現 ${hits.length} 處內嵌陷阱\n`);
  for (const h of hits.slice(0, 30)) {
    process.stderr.write(`   ${h.file}:${h.line}  [${h.trap}]  ${h.text}\n`);
  }
  if (hits.length > 30) process.stderr.write(`   …（另有 ${hits.length - 30} 處未列出）\n`);
  process.stderr.write(
    `\n   怎麼辦：這段文字（含註解）內嵌進 HTML 後會提前關閉 <style>／<script> 區塊，` +
      `請改寫成不含連續 "</style"／"</script" 字首的寫法（例如中間插入空格或改用其他措辭描述）。\n`
  );
  process.exit(1);
}

try {
  main();
} catch (e) {
  fail(`檢查器發生未預期例外：${e?.stack ?? e}`);
}

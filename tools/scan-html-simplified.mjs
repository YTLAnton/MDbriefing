#!/usr/bin/env node
/**
 * scan-html-simplified.mjs — 掃描本專案 briefings 目錄下所有子層 .html 是否混入簡體字形／中國大陸用語
 *
 * 背景：Harness 中央 repo 的 hooks/scan-simplified.mjs 只掃 `.md`（設計如此，見該檔檔頭
 * 【五】的說明），本專案的交付物卻是 `.html`（briefings/<主題>/index.html，單檔自包含，
 * 對照 docs/briefing-spec.md §零.2）。Harness 的掃描腳本不涵蓋這個副檔名，所以本專案
 * 另外寫這一支——只做「多掃一種副檔名」這件事，判定邏輯（哪些字形、哪些整詞算致命）
 * 完全沿用 Harness `ops/09_language_and_output.md` 的規則表，不在本檔重抄一份對照表，
 * 只在執行時現場解析該規則檔（讀取，不修改）。
 *
 * 用法：
 *   node tools/scan-html-simplified.mjs                # 掃描 <本專案根>/briefings
 *   node tools/scan-html-simplified.mjs --root <目錄>   # 掃描指定目錄（測試正控制組用）
 *   node tools/scan-html-simplified.mjs --rules <檔案>  # 指定規則檔（測試用；預設為 Harness 的 ops/09）
 *
 * 回傳值：
 *   0 = 掃完且沒有致命命中
 *   1 = 有致命命中，應擋下 commit/push
 *   2 = 掃描沒跑成或沒跑完整（規則檔讀不到／解析不出表格／目錄或檔案讀不到）
 *
 * 判定邏輯（致命字形、致命整詞、同形異義字豁免、已背書繁體字保險絲）與
 * Harness `hooks/scan-simplified.mjs` 一致，理由與該檔【一】～【四】的說明相同，
 * 這裡不重複貼一次註解——需要理解判準細節時去看那份檔頭。
 *
 * 預設規則檔路徑寫死指向本機 Harness repo 的絕對路徑，這是本機單機設定，不具可攜性；
 * 若 Harness repo 移動或在別台機器上跑，改用 --rules 指到新位置即可，不需要改本腳本。
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT_RULES = "/Users/anton/Anti/Harness/ops/09_language_and_output.md";
const DEFAULT_ROOT = path.join(PROJECT_ROOT, "briefings");

/** 行內豁免標記：任何一行含此字樣即整行跳過（供本專案日後保存反例／樣本用） */
const INLINE_EXEMPT_MARKER = "語言掃描豁免";

/** 中日韓統一表意文字 */
const CJK_RE = /[一-鿿]/u;

function fail(message) {
  process.stderr.write(`🛠️ scan-html-simplified：掃描沒跑成 → 視為不通過。\n   ${message}\n`);
  process.exit(2);
}

function cleanCell(cell) {
  return cell.replace(/（[^）]*）/g, "").replace(/\([^)]*\)/g, "").replace(/\*\*/g, "").trim();
}

function splitTerms(cell) {
  return cleanCell(cell)
    .split(/[/／]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && CJK_RE.test(s));
}

function sliceSection(lines, startRe, endRe) {
  const start = lines.findIndex((l) => startRe.test(l));
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (endRe.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start + 1, end);
}

function parseTable(sectionLines) {
  const rows = [];
  for (const raw of sectionLines) {
    const line = raw.trim();
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 2) continue;
    if (/^:?-{2,}:?$/.test(cells[0])) continue;
    const left = splitTerms(cells[0]);
    const right = splitTerms(cells[1]);
    if (left.length === 0) continue;
    if (left.length === 1 && (left[0] === "錯" || left[0].startsWith("錯"))) continue;
    rows.push({ left, right });
  }
  return rows;
}

function loadRules(rulesPath) {
  if (!existsSync(rulesPath)) fail(`規則檔不存在：${rulesPath}`);
  let text;
  try {
    text = readFileSync(rulesPath, "utf8");
  } catch (e) {
    fail(`規則檔讀不到：${rulesPath}（${e?.message ?? e}）`);
  }
  const lines = text.split(/\r?\n/);

  const secA = sliceSection(lines, /^###\s*\(a\)/, /^#{2,3}\s/);
  const secB = sliceSection(lines, /^###\s*\(b\)/, /^#{2,3}\s/);
  const secFour = sliceSection(lines, /^##\s*四、/, /^##\s*五、/);

  if (!secA) fail(`規則檔裡找不到第三節 (a) 表的標題（預期 "### (a) …"）：${rulesPath}`);
  if (!secB) fail(`規則檔裡找不到第三節 (b) 表的標題（預期 "### (b) …"）：${rulesPath}`);
  if (!secFour) fail(`規則檔裡找不到第四節（預期 "## 四、…" 與 "## 五、…"）：${rulesPath}`);

  const tableA = parseTable(secA);
  const tableB = parseTable(secB);

  const ambiguousChars = new Set();
  for (const l of secFour) {
    const m = l.match(/^###\s*(\p{Script=Han})\s*——/u);
    if (m) ambiguousChars.add(m[1]);
  }

  if (tableA.length < 15) fail(`第三節 (a) 表只解析出 ${tableA.length} 列，明顯不對——規則檔格式可能改了。`);
  if (tableB.length < 20) fail(`第三節 (b) 表只解析出 ${tableB.length} 列，明顯不對——規則檔格式可能改了。`);
  if (ambiguousChars.size < 5) fail(`第四節只解析出 ${ambiguousChars.size} 個同形異義字，明顯不對——規則檔格式可能改了。`);

  const attestedTraditional = new Set();
  for (const row of [...tableA, ...tableB]) {
    for (const term of row.right) for (const ch of term) attestedTraditional.add(ch);
  }

  const fatalChars = new Set();
  for (const row of tableA) {
    for (const term of row.left) {
      for (const ch of term) {
        if (!CJK_RE.test(ch)) continue;
        if (ambiguousChars.has(ch)) continue;
        if (attestedTraditional.has(ch)) continue;
        fatalChars.add(ch);
      }
    }
  }

  const rightTerms = new Set();
  for (const row of [...tableA, ...tableB]) for (const t of row.right) rightTerms.add(t);

  const fatalTerms = new Set();
  for (const row of [...tableA, ...tableB]) {
    for (const term of row.left) {
      if (term.length < 2) continue;
      if (rightTerms.has(term)) continue;
      fatalTerms.add(term);
    }
  }

  return { fatalChars, fatalTerms, counts: { a: tableA.length, b: tableB.length } };
}

/** 遞迴列出根目錄下所有 .html 檔，回傳 { files, unreadableDirs } */
function listHtml(root) {
  const out = [];
  const unreadableDirs = [];
  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      unreadableDirs.push({ dir: path.relative(root, dir).split(path.sep).join("/") || ".", message: e?.message ?? String(e) });
      return;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full);
      } else if (ent.isFile() && ent.name.toLowerCase().endsWith(".html")) {
        out.push(path.relative(root, full).split(path.sep).join("/"));
      }
    }
  }
  walk(root);
  return { files: out.sort(), unreadableDirs };
}

function main() {
  const argv = process.argv.slice(2);
  const getFlag = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : null;
  };
  const root = path.resolve(getFlag("--root") ?? DEFAULT_ROOT);
  const rulesPath = path.resolve(getFlag("--rules") ?? DEFAULT_RULES);

  if (!existsSync(root) || !statSync(root).isDirectory()) fail(`掃描根目錄不存在或不是目錄：${root}`);

  const { fatalChars, fatalTerms, counts } = loadRules(rulesPath);
  const fatalTermsByLength = [...fatalTerms].sort((a, b) => b.length - a.length);

  const { files, unreadableDirs } = listHtml(root);
  const fatalHits = [];
  const unreadableFiles = [];

  for (const rel of files) {
    let content;
    try {
      content = readFileSync(path.join(root, rel), "utf8");
    } catch (e) {
      unreadableFiles.push({ file: rel, message: e?.message ?? String(e) });
      continue;
    }
    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (line.includes(INLINE_EXEMPT_MARKER)) return;
      const covered = new Array(line.length).fill(false);
      for (const term of fatalTermsByLength) {
        let from = 0;
        for (;;) {
          const at = line.indexOf(term, from);
          if (at < 0) break;
          let overlaps = false;
          for (let k = at; k < at + term.length; k++) if (covered[k]) { overlaps = true; break; }
          if (!overlaps) {
            for (let k = at; k < at + term.length; k++) covered[k] = true;
            fatalHits.push({ file: rel, line: idx + 1, col: at + 1, kind: "整詞", text: term });
          }
          from = at + term.length;
        }
      }
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (fatalChars.has(ch)) fatalHits.push({ file: rel, line: idx + 1, col: i + 1, kind: "字形", text: ch });
      }
    });
  }

  console.log(
    `📖 規則來源：${rulesPath}（(a) 表 ${counts.a} 列、(b) 表 ${counts.b} 列，現場解析、未硬編）`
  );
  console.log(`📂 已掃描 ${files.length - unreadableFiles.length} / ${files.length} 個 .html 檔（根目錄：${root}）`);

  const gapCount = unreadableDirs.length + unreadableFiles.length;
  if (gapCount > 0) {
    process.stderr.write(`\n🛠️ scan-html-simplified：有 ${gapCount} 個目錄／檔案讀不到，這次沒掃完整 → 視為不通過。\n`);
    for (const d of unreadableDirs) process.stderr.write(`     [目錄整棵未掃] ${d.dir}/ —— ${d.message}\n`);
    for (const f of unreadableFiles) process.stderr.write(`     [檔案未掃] ${f.file} —— ${f.message}\n`);
  }

  if (fatalHits.length === 0) {
    if (gapCount === 0) {
      console.log("\n✅ 未發現簡體字形或中國大陸用語，briefings/*.html 語言檢查通過。");
      process.exit(0);
    }
    process.exit(2);
  }

  process.stderr.write(`\n❌ scan-html-simplified：發現 ${fatalHits.length} 處不合規（依 ops/09_language_and_output.md）\n`);
  const byFile = new Map();
  for (const h of fatalHits) {
    if (!byFile.has(h.file)) byFile.set(h.file, []);
    byFile.get(h.file).push(h);
  }
  for (const [file, hits] of byFile) {
    process.stderr.write(`   ${file}（${hits.length} 處）\n`);
    for (const h of hits.slice(0, 20)) process.stderr.write(`     ${file}:${h.line}:${h.col}  [${h.kind}]「${h.text}」\n`);
    if (hits.length > 20) process.stderr.write(`     …（另有 ${hits.length - 20} 處未列出）\n`);
  }
  process.stderr.write(`\n   怎麼辦：對照 ops/09_language_and_output.md 第三節改成台灣繁體寫法。\n`);
  process.exit(1);
}

try {
  main();
} catch (e) {
  fail(`掃描器發生未預期例外：${e?.stack ?? e}`);
}

#!/usr/bin/env node
/**
 * check-no-external-resources.mjs — 交付物零外部資源檢查
 *
 * 依據：docs/briefing-spec.md §零.2「外部資源：零——不得出現任何 http(s):// 的
 * href / src / url()」。deck 形態的產出必須單檔自包含、file:// 雙擊即可完整運作。
 *
 * 只掃 briefings 目錄下所有子層 .html（產出物），不掃 assets/（共用來源，理論上也不該有外部連結，
 * 但那是另一件事——本檢查對齊規格書條文，條文只講「交付物」）。
 *
 * 用法：
 *   node tools/check-no-external-resources.mjs               # 掃描 <本專案根>/briefings
 *   node tools/check-no-external-resources.mjs --root <目錄>  # 掃描指定目錄（測試正控制組用）
 *
 * 回傳值：
 *   0 = 掃完且沒有外部資源命中
 *   1 = 有命中，應擋下 commit/push
 *   2 = 掃描沒跑成（目錄不存在、檔案讀不到）
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT_ROOT = path.join(PROJECT_ROOT, "briefings");

/** 三種禁止樣式，逐行比對（大小寫不拘、單雙引號皆比對，比規格書字面條文稍寬以求不漏） */
const PATTERNS = [
  { name: 'href="http', re: /\bhref\s*=\s*["']https?:\/\// },
  { name: 'src="http', re: /\bsrc\s*=\s*["']https?:\/\// },
  { name: "url(http", re: /\burl\(\s*["']?https?:\/\// },
];

function fail(message) {
  process.stderr.write(`🛠️ check-no-external-resources：掃描沒跑成 → 視為不通過。\n   ${message}\n`);
  process.exit(2);
}

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

  if (!existsSync(root) || !statSync(root).isDirectory()) fail(`掃描根目錄不存在或不是目錄：${root}`);

  const { files, unreadableDirs } = listHtml(root);
  const hits = [];
  const unreadableFiles = [];

  for (const rel of files) {
    let content;
    try {
      content = readFileSync(path.join(root, rel), "utf8");
    } catch (e) {
      unreadableFiles.push({ file: rel, message: e?.message ?? String(e) });
      continue;
    }
    content.split(/\r?\n/).forEach((line, idx) => {
      for (const p of PATTERNS) {
        if (p.re.test(line)) hits.push({ file: rel, line: idx + 1, pattern: p.name, text: line.trim().slice(0, 160) });
      }
    });
  }

  console.log(`📂 已掃描 ${files.length - unreadableFiles.length} / ${files.length} 個 .html 檔（根目錄：${root}）`);

  const gapCount = unreadableDirs.length + unreadableFiles.length;
  if (gapCount > 0) {
    process.stderr.write(`\n🛠️ check-no-external-resources：有 ${gapCount} 個目錄／檔案讀不到，這次沒掃完整 → 視為不通過。\n`);
    for (const d of unreadableDirs) process.stderr.write(`     [目錄整棵未掃] ${d.dir}/ —— ${d.message}\n`);
    for (const f of unreadableFiles) process.stderr.write(`     [檔案未掃] ${f.file} —— ${f.message}\n`);
  }

  if (hits.length === 0) {
    if (gapCount === 0) {
      console.log("\n✅ 未發現外部資源引用，交付物零外部資源檢查通過。");
      process.exit(0);
    }
    process.exit(2);
  }

  process.stderr.write(`\n❌ check-no-external-resources：發現 ${hits.length} 處外部資源引用（違反 docs/briefing-spec.md §零.2）\n`);
  for (const h of hits.slice(0, 30)) {
    process.stderr.write(`   ${h.file}:${h.line}  [${h.pattern}]  ${h.text}\n`);
  }
  if (hits.length > 30) process.stderr.write(`   …（另有 ${hits.length - 30} 處未列出）\n`);
  process.stderr.write(`\n   怎麼辦：把外部連結改成內嵌內容，或移除該引用——交付物須單檔自包含、file:// 可直接開。\n`);
  process.exit(1);
}

try {
  main();
} catch (e) {
  fail(`掃描器發生未預期例外：${e?.stack ?? e}`);
}

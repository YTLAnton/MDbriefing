/* ============================================================
   MDbriefing — deck.js
   簡報共用互動（真理來源）

   基準：_PM/resource/PM 主管 90 天目標計劃_files/saved_resource.html
   用法：產出 briefings/主題/index.html 時，把本檔內容整段內嵌進 HTML body
        結尾前的 script 區塊（單檔自包含、零外部資源）。
   注意：本檔的註解與內容都不可出現字面上的「結束 script 標籤」字串，
        否則內嵌後會提前關閉腳本區塊，互動會整組失效。
   規格：docs/briefing-spec.md

   本檔負責四件事：
     ① 逐項浮現   .seq 進入視窗 → 加 .inview，讓 .step 依 transition-delay 依序浮現
     ② 目錄跳轉   .toc 的連結點擊跳頁 + 目前所在頁高亮（aria-current）
     ③ 數字增長   [data-countup] 從起始值數到目標值
     ④ 翻頁       ← ↑ 上一頁／→ ↓ 下一頁／滑鼠左鍵單擊 下一頁
                  （滾動吸附翻頁由 CSS scroll-snap 負責；可折疊由原生 details 元素負責）
   ============================================================ */
(function () {
  'use strict';

  // 漸進增強開關：只有 JS 真的跑起來，deck.css 才會啟用「先隱藏、逐項浮現」。
  // 沒這一行，JS 停用或出錯時 .step 會永久隱形。務必放在最前面。
  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var scrollBehavior = reduceMotion ? 'auto' : 'smooth';
  var slides = Array.prototype.slice.call(document.querySelectorAll('section.slide'));

  /* ── ① 逐項浮現 ─────────────────────────────────────── */
  var seqNodes = Array.prototype.slice.call(document.querySelectorAll('.seq'));
  if (seqNodes.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      seqNodes.forEach(function (el) { el.classList.add('inview'); });
    } else {
      var seqObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('inview');
            seqObserver.unobserve(e.target);
          }
        });
      }, { threshold: 0.45 });
      seqNodes.forEach(function (el) { seqObserver.observe(el); });

      // 保險：載入時已在畫面內的 .seq，若 observer 尚未回呼就直接浮現。
      // （避免列印、螢幕截圖、或 observer 延遲回呼時該區塊停在透明狀態。）
      window.addEventListener('load', function () {
        seqNodes.forEach(function (el) {
          if (el.classList.contains('inview')) return;
          var r = el.getBoundingClientRect();
          if (r.bottom > 0 && r.top < (window.innerHeight || 0)) {
            el.classList.add('inview');
            seqObserver.unobserve(el);
          }
        });
      });
    }
  }

  /* ── ④-a 翻頁核心：目前是第幾頁 / 跳到第幾頁 ──────────── */
  // 程式性捲動進行中時，以「目標頁」為準，避免連按時 index 抓到捲動中間值
  var pendingIndex = null;
  var pendingTimer = null;

  function currentIndex() {
    if (pendingIndex !== null) return pendingIndex;
    var best = 0, bestDist = Infinity;
    for (var i = 0; i < slides.length; i++) {
      var dist = Math.abs(slides[i].getBoundingClientRect().top);
      if (dist < bestDist) { bestDist = dist; best = i; }
    }
    return best;
  }

  function goTo(index) {
    if (!slides.length) return;
    var i = Math.max(0, Math.min(slides.length - 1, index));
    pendingIndex = i;
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(function () { pendingIndex = null; }, 700);
    slides[i].scrollIntoView({ behavior: scrollBehavior, block: 'start' });
  }

  function next() { goTo(currentIndex() + 1); }
  function prev() { goTo(currentIndex() - 1); }

  /* ── ④-b 鍵盤：← ↑ 上一頁／→ ↓ 下一頁 ────────────────── */
  document.addEventListener('keydown', function (ev) {
    if (ev.defaultPrevented) return;
    if (ev.metaKey || ev.ctrlKey || ev.altKey || ev.shiftKey) return;

    // 焦點在輸入元件或已展開的 summary 上時不攔（讓原生行為優先）
    var el = document.activeElement;
    if (el && el.closest && el.closest('input,textarea,select,[contenteditable="true"]')) return;

    switch (ev.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        ev.preventDefault(); next(); break;
      case 'ArrowLeft':
      case 'ArrowUp':
        ev.preventDefault(); prev(); break;
      case 'Home':
        ev.preventDefault(); goTo(0); break;
      case 'End':
        ev.preventDefault(); goTo(slides.length - 1); break;
    }
  });

  /* ── ④-c 滑鼠左鍵單擊 → 下一頁 ──────────────────────── */
  // 不攔的情況：非左鍵、有修飾鍵、點在可互動元素上（連結／按鈕／可折疊標題／目錄／
  // 表單）、點在標了 .no-advance 的區域內、或使用者正在選取文字。
  var INTERACTIVE = 'a,button,summary,details,input,textarea,select,label,[role="button"],.toc,.no-advance';

  document.addEventListener('click', function (ev) {
    if (ev.button !== 0) return;
    if (ev.detail !== 1) return;                       // 只認單擊，雙擊/三擊不翻頁
    if (ev.metaKey || ev.ctrlKey || ev.altKey || ev.shiftKey) return;
    if (ev.defaultPrevented) return;

    var t = ev.target;
    if (t && t.closest && t.closest(INTERACTIVE)) return;

    var sel = window.getSelection && window.getSelection();
    if (sel && !sel.isCollapsed && String(sel).length) return;   // 正在選字

    next();
  });

  /* ── ② 目錄：點擊跳轉 + 目前章節高亮 ─────────────────── */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
  if (tocLinks.length) {
    tocLinks.forEach(function (a) {
      a.addEventListener('click', function (ev) {
        var target = document.getElementById(a.getAttribute('href').slice(1));
        if (!target) return;
        ev.preventDefault();
        goTo(slides.indexOf(target));
      });
    });

    /* 滑過目錄展開全部標籤：.toc 本身是 pointer-events:none（讓空白處點擊
       穿透到頁面、觸發翻頁），這代表 .toc 容器不可靠地收得到 :hover——
       改成監聽每一個 .toc a（它們是 pointer-events:auto，一定收得到滑鼠
       事件）的 mouseenter/mouseleave，對 .toc 加/移除 .hover class，CSS
       用 .toc.hover a .label 觸發顯示。leave 時延遲一小段再移除 class，
       是為了在相鄰兩列之間的 2px gap 上快速移動滑鼠時不閃爍（gap 沒有
       任何 pointer-events:auto 的元素，滑鼠移過去的瞬間會先觸發上一列的
       mouseleave，若沒有延遲就會立刻收起標籤，等下一列的 mouseenter
       才又展開，觀感上像「一直在閃」）。 */
    var tocEl = document.querySelector('.toc');
    if (tocEl) {
      var tocHoverTimer = null;
      var showTocLabels = function () {
        if (tocHoverTimer) { clearTimeout(tocHoverTimer); tocHoverTimer = null; }
        tocEl.classList.add('hover');
      };
      var hideTocLabelsSoon = function () {
        if (tocHoverTimer) clearTimeout(tocHoverTimer);
        tocHoverTimer = setTimeout(function () { tocEl.classList.remove('hover'); }, 150);
      };
      tocLinks.forEach(function (a) {
        a.addEventListener('mouseenter', showTocLabels);
        a.addEventListener('mouseleave', hideTocLabelsSoon);
      });
    }

    var setCurrent = function (id) {
      tocLinks.forEach(function (a) {
        if (a.getAttribute('href') === '#' + id) {
          a.setAttribute('aria-current', 'true');
          // .toc 有 max-height + overflow-y:auto（見 deck.css）：頁數多時目錄本身
          // 可捲動，翻頁時把目前這一點捲進可視範圍，避免高亮的點被捲到目錄外看不到。
          if (a.scrollIntoView) a.scrollIntoView({ block: 'nearest' });
        }
        else a.removeAttribute('aria-current');
      });
    };

    var idSlides = slides.filter(function (s) { return s.id; });
    if (idSlides.length) {
      if ('IntersectionObserver' in window) {
        var visible = {};
        var tocObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { visible[e.target.id] = e.intersectionRatio; });
          var best = null, bestRatio = 0;
          idSlides.forEach(function (s) {
            var r = visible[s.id] || 0;
            if (r > bestRatio) { bestRatio = r; best = s.id; }
          });
          if (best) setCurrent(best);
        }, { threshold: [0.15, 0.4, 0.6, 0.85] });
        idSlides.forEach(function (s) { tocObserver.observe(s); });
      } else {
        setCurrent(idSlides[0].id);
      }
    }
  }

  /* ── ③ 數字增長（封面大數字等） ─────────────────────── */
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-countup]'));
  counters.forEach(function (el) {
    var target = parseInt(el.getAttribute('data-countup'), 10);
    if (isNaN(target)) return;
    if (reduceMotion) { el.textContent = String(target); return; }

    var from = parseInt(el.getAttribute('data-countup-from') || '1', 10);
    var duration = parseInt(el.getAttribute('data-countup-duration') || '3000', 10);
    var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
    var t0;

    el.textContent = String(from);
    var tick = function (now) {
      if (t0 === undefined) t0 = now;
      var p = Math.min((now - t0) / duration, 1);
      el.textContent = String(Math.round(from + (target - from) * easeOut(p)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
})();

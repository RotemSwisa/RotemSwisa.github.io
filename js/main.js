/* =========================================================================
   Rotem Mery Swisa - site behaviour

   Smooth (eased) scrolling, language switching with full RTL, scroll
   reveals, section spy, project filtering, animated counters, mobile menu.

   Reveals are measured from getBoundingClientRect rather than an
   IntersectionObserver on purpose: the smooth-scroll layer moves content with
   a transform, and rects follow a transform reliably where observer callbacks
   do not always fire.
   ========================================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse  = window.matchMedia('(pointer: coarse)').matches;

  /* ---------------------------------------------------------- language */
  var LANG_KEY = 'rms-lang';
  var htmlEl = document.documentElement;

  function readLang() {
    try {
      var saved = localStorage.getItem(LANG_KEY);
      if (saved === 'en' || saved === 'he') return saved;
    } catch (e) { /* private mode - fall through */ }
    return (navigator.language || '').toLowerCase().indexOf('he') === 0 ? 'he' : 'en';
  }

  function applyLang(lang) {
    htmlEl.lang = lang;
    htmlEl.dir = lang === 'he' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-en][data-he]').forEach(function (el) {
      var val = el.getAttribute('data-' + lang);
      if (val !== null) el.textContent = val;
    });

    // Separate pattern for labels: writing textContent on these would wipe out
    // the icon sitting inside the button.
    document.querySelectorAll('[data-alabel-en][data-alabel-he]').forEach(function (el) {
      var lbl = el.getAttribute('data-alabel-' + lang);
      if (lbl !== null) el.setAttribute('aria-label', lbl);
    });

    document.querySelectorAll('.lang__opt').forEach(function (o) {
      o.classList.toggle('is-on', o.dataset.lang === lang);
    });

    document.title = lang === 'he'
      ? 'רותם מרי סויסה - מהנדסת תוכנה'
      : 'Rotem Mery Swisa - Software Engineer';

    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
    drawRing(lang);
    if (slides && slides.length) renderInfo();
    measure();
  }

  /* ---------------------------------------------------------- circular type
     <textPath> lays out Latin fine and renders Hebrew as nothing at all - every
     character comes back at position (0,0). Placing each glyph with its own
     rotation sidesteps the bidi handling entirely and works for both. */
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function drawRing(lang) {
    var ring = document.querySelector('.ring');
    var g = document.getElementById('ringGlyphs');
    if (!ring || !g) return;

    var str = ring.getAttribute('data-ring-' + lang) || '';
    var chars = Array.prototype.slice.call(str);
    if (!chars.length) return;

    g.textContent = '';

    var cx = 100, cy = 100, R = 76;
    var step = 360 / chars.length;
    // Hebrew reads right to left, so it has to run anticlockwise.
    var dir = lang === 'he' ? -1 : 1;

    chars.forEach(function (ch, i) {
      if (ch === ' ') return;
      var t = document.createElementNS(SVG_NS, 'text');
      t.setAttribute('x', cx);
      t.setAttribute('y', cy - R);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('dominant-baseline', 'middle');
      t.setAttribute('transform', 'rotate(' + (dir * i * step) + ' ' + cx + ' ' + cy + ')');
      t.textContent = ch;
      g.appendChild(t);
    });
  }

  var currentLang = readLang();

  var langBtn = document.getElementById('langBtn');
  if (langBtn) {
    langBtn.addEventListener('click', function () {
      currentLang = currentLang === 'en' ? 'he' : 'en';
      applyLang(currentLang);
    });
  }

  /* ---------------------------------------------------------- smooth scroll */
  var smooth = !reduced && !coarse;
  var wrap = null;
  var current = 0, target = 0;
  var EASE = 0.09;

  if (smooth) {
    wrap = document.createElement('div');
    wrap.className = 'smooth-wrap';
    wrap.style.cssText = 'position:fixed;top:0;left:0;width:100%;will-change:transform;';

    var main = document.getElementById('main');
    var foot = document.querySelector('.foot');
    main.parentNode.insertBefore(wrap, main);
    wrap.appendChild(main);
    if (foot) wrap.appendChild(foot);

    current = target = window.scrollY;

    // The native smooth scroll would fight the easing below, so hand the
    // whole job to one of them - this one.
    htmlEl.style.scrollBehavior = 'auto';
  }

  /* ---------------------------------------------------------- anchor jumps
     Inside a fixed wrapper every element reports the same document offset, so
     native anchor scrolling stops working. Positions are read from the live
     rect and added to where the page currently sits instead. */
  function scrollToY(y) {
    y = Math.max(0, Math.round(y));
    window.scrollTo({ top: y, behavior: (smooth || reduced) ? 'auto' : 'smooth' });
  }

  function navHeight() {
    var v = parseFloat(getComputedStyle(htmlEl).getPropertyValue('--nav-h'));
    return isNaN(v) ? 72 : v;
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href || href === '#') return;

    a.addEventListener('click', function (e) {
      var el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      var from = smooth ? current : window.scrollY;
      var pad = href === '#top' ? 0 : navHeight();
      scrollToY(from + el.getBoundingClientRect().top - pad);
    });
  });

  function measure() {
    if (!smooth || !wrap) return;
    document.body.style.height = Math.round(wrap.getBoundingClientRect().height) + 'px';
  }

  if (smooth && 'ResizeObserver' in window) {
    new ResizeObserver(measure).observe(wrap);
  }
  window.addEventListener('resize', measure);

  /* ---------------------------------------------------------- nav + to top */
  var nav = document.getElementById('nav');
  var toTop = document.getElementById('toTop');

  function chrome(y) {
    if (nav) nav.classList.toggle('is-stuck', y > 40);
    if (toTop) toTop.classList.toggle('is-on', y > 700);
  }

  if (toTop) toTop.addEventListener('click', function () { scrollToY(0); });

  /* ---------------------------------------------------------- mobile menu */
  var burger = document.getElementById('burger');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('.nav__links a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }

  /* ---------------------------------------------------------- counters */
  function countUp(el) {
    el.dataset.done = '1';
    var goal = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var dur = 1300, t0 = null;

    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      el.textContent = (goal * (1 - Math.pow(1 - p, 3))).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = goal.toFixed(dec);
    }
    requestAnimationFrame(step);
  }

  /* ---------------------------------------------------------- reveals + spy */
  var revealables = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__links a'));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);
  var activeId = null;

  if (reduced) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
    document.querySelectorAll('[data-count]').forEach(function (el) {
      el.textContent = el.getAttribute('data-count');
    });
    revealables = [];
  }

  function check() {
    var vh = window.innerHeight;

    for (var i = revealables.length - 1; i >= 0; i--) {
      var el = revealables[i];
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) {
        el.classList.add('is-in');
        var n = el.querySelector('[data-count]');
        if (n && !n.dataset.done) countUp(n);
        revealables.splice(i, 1);
      }
    }

    var mid = vh * 0.42, found = null;
    for (var j = 0; j < sections.length; j++) {
      var sr = sections[j].getBoundingClientRect();
      if (sr.top <= mid && sr.bottom > mid) { found = sections[j].id; break; }
    }
    if (found && found !== activeId) {
      activeId = found;
      links.forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('href') === '#' + found);
      });
    }
  }

  /* ---------------------------------------------------------- frame loop */
  // requestAnimationFrame is paused while a tab is in the background, so the
  // eased position goes stale. Snap it on the way back rather than letting the
  // page slide a long way once the loop restarts.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    if (smooth) { current = target = window.scrollY; }
    // A counter caught mid-animation freezes on a meaningless number until the
    // loop restarts. Land it on the real figure instead.
    document.querySelectorAll('[data-count]').forEach(function (el) {
      if (!el.dataset.done) return;
      var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      el.textContent = parseFloat(el.getAttribute('data-count')).toFixed(dec);
    });
  });

  if (smooth) {
    (function frame() {
      target = window.scrollY;
      current += (target - current) * EASE;
      if (Math.abs(target - current) < 0.08) current = target;
      wrap.style.transform = 'translate3d(0,' + (-current).toFixed(2) + 'px,0)';
      chrome(current);
      check();
      requestAnimationFrame(frame);
    })();
  } else {
    var queued = false;
    function tick() {
      queued = false;
      chrome(window.scrollY);
      check();
    }
    function schedule() { if (!queued) { queued = true; requestAnimationFrame(tick); } }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    tick();
  }

  /* ---------------------------------------------------------- filters */
  var chips = document.querySelectorAll('.chip');
  var cards = document.querySelectorAll('#grid .card');
  var empty = document.getElementById('gridEmpty');

  // The lead card spans the full row; if what follows is an odd number, the
  // last one would sit against one edge. Centre it instead.
  function balanceGrid() {
    var rest = [];
    cards.forEach(function (c) {
      c.classList.remove('is-solo');
      if (!c.classList.contains('is-hidden') && !c.classList.contains('card--lead')) rest.push(c);
    });
    if (rest.length % 2 === 1) rest[rest.length - 1].classList.add('is-solo');
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.dataset.f, shown = 0;
      chips.forEach(function (c) { c.classList.toggle('is-on', c === chip); });

      cards.forEach(function (card) {
        var match = f === 'all' || (card.dataset.tags || '').split(/\s+/).indexOf(f) !== -1;
        card.classList.toggle('is-hidden', !match);
        if (match) shown++;
      });

      if (empty) empty.hidden = shown !== 0;
      balanceGrid();
      measure();
    });
  });

  balanceGrid();

  /* ---------------------------------------------------------- project dial
     Everything shown here is read out of the project cards, so the wheel has
     no copy of its own to keep in sync and a new card joins it for free. */
  var dial   = document.getElementById('dial');
  var wheel  = document.getElementById('dialWheel');
  var info   = document.getElementById('dialInfo');
  var slides = [];
  var active = 0;
  var rot = 0;
  var autoTimer = null;

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function renderInfo() {
    if (!info || !slides.length) return;
    var s = slides[active];
    var title = s.card.querySelector('.card__t');
    var sub   = s.card.querySelector('.card__s');
    var tags  = s.card.querySelectorAll('.tags li');

    info.textContent = '';

    var no = document.createElement('p');
    no.className = 'dial__no';
    no.textContent = pad(active + 1) + ' / ' + pad(slides.length);
    info.appendChild(no);

    var h = document.createElement('h3');
    h.className = 'dial__t';
    h.textContent = title ? title.textContent : '';
    info.appendChild(h);

    if (sub) {
      var p = document.createElement('p');
      p.className = 'dial__s';
      p.textContent = sub.textContent;
      info.appendChild(p);
    }

    if (tags.length) {
      var ul = document.createElement('ul');
      ul.className = 'tags dial__tags';
      Array.prototype.forEach.call(tags, function (t) {
        var li = document.createElement('li');
        li.textContent = t.textContent;
        ul.appendChild(li);
      });
      info.appendChild(ul);
    }

    var cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'dial__cta';
    var span = document.createElement('span');
    span.textContent = currentLang === 'he' ? 'לפרויקט המלא' : 'View the project';
    cta.appendChild(span);
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'ic');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#i-arrow');
    svg.appendChild(use);
    cta.appendChild(svg);
    cta.addEventListener('click', goToCard);
    info.appendChild(cta);
  }

  // The wheel shrinks on small screens, so the orbit has to be measured rather
  // than fixed once at build time.
  function placeItems() {
    if (!slides.length) return;
    var step = 360 / slides.length;
    var w = wheel.clientWidth || 258;
    var R = w / 2 - (slides[0].btn.offsetWidth || 58) / 2;
    slides.forEach(function (s, i) {
      var a = i * step - 90;
      s.btn.style.transform =
        'rotate(' + a + 'deg) translate(' + R + 'px) rotate(' + (-a) + 'deg)';
    });
  }

  function setActive(i) {
    var n = slides.length;
    if (!n) return;
    var step = 360 / n;
    var next = ((i % n) + n) % n;

    // Always turn the short way round, so 6 back to 1 is one notch not five.
    var d = next - active;
    if (d >  n / 2) d -= n;
    if (d < -n / 2) d += n;

    active = next;
    rot -= d * step;
    wheel.style.transform = 'rotate(' + rot + 'deg)';

    slides.forEach(function (s, k) {
      var on = k === active;
      s.btn.classList.toggle('is-on', on);
      s.btn.setAttribute('aria-current', on ? 'true' : 'false');
      s.img.style.transform = 'rotate(' + (-rot) + 'deg) scale(' + (on ? 1.42 : 1) + ')';
    });

    renderInfo();
  }

  function goToCard() {
    var card = slides[active].card;
    // If a filter is hiding this card, clear the filter first.
    if (card.classList.contains('is-hidden')) {
      var all = document.querySelector('.chip[data-f="all"]');
      if (all) all.click();
    }
    var from = smooth ? current : window.scrollY;
    scrollToY(from + card.getBoundingClientRect().top - navHeight() - 16);
    card.classList.add('is-flash');
    setTimeout(function () { card.classList.remove('is-flash'); }, 1900);
  }

  function startAuto() {
    if (reduced) return;
    stopAuto();
    autoTimer = setInterval(function () { setActive(active + 1); }, 5200);
  }
  function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }

  (function buildDial() {
    if (!dial || !wheel) return;
    var list = Array.prototype.slice.call(document.querySelectorAll('#grid .card'));
    list = list.filter(function (c) { return c.dataset.emblem && c.id; });
    if (list.length < 2) return;

    dial.hidden = false;                       // unhide before measuring

    list.forEach(function (card, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dial__item';

      // the wheel carries each project's own logo; the cards keep the drawn
      // line icons, which read better at the size they sit at
      var img = document.createElement('img');
      img.src = 'assets/gallery/' + card.dataset.emblem + '.jpg';
      img.alt = '';
      img.width = 78; img.height = 78;
      img.loading = 'lazy';
      btn.appendChild(img);

      btn.addEventListener('click', function () {
        if (i === active) goToCard(); else setActive(i);
        startAuto();
      });

      wheel.appendChild(btn);
      slides.push({ card: card, btn: btn, img: img });
    });

    var prev = dial.querySelector('.dial__arrow--prev');
    var next = dial.querySelector('.dial__arrow--next');
    if (prev) prev.addEventListener('click', function () { setActive(active - 1); startAuto(); });
    if (next) next.addEventListener('click', function () { setActive(active + 1); startAuto(); });

    dial.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { setActive(active + 1); startAuto(); }
      if (e.key === 'ArrowLeft')  { setActive(active - 1); startAuto(); }
    });

    dial.addEventListener('mouseenter', stopAuto);
    dial.addEventListener('mouseleave', startAuto);
    dial.addEventListener('focusin', stopAuto);
    dial.addEventListener('focusout', startAuto);

    placeItems();
    window.addEventListener('resize', placeItems);
    setActive(0);
    startAuto();
  })();


  /* ---------------------------------------------------------- ticker loop */
  var row = document.getElementById('tickerRow');
  if (row && !reduced) row.innerHTML += row.innerHTML;

  /* ---------------------------------------------------------- go */
  applyLang(currentLang);
  measure();
  window.addEventListener('load', measure);

})();

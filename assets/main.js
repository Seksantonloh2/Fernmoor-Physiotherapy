/* Fernmoor Physiotherapy — interactions (vanilla JS, no dependencies) */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* ---------- Blur-in text: split into words ---------- */
  document.querySelectorAll("[data-blur]").forEach(function (el) {
    var i = 0;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var span = document.createElement("span");
        span.className = "w";
        span.style.setProperty("--i", i++);
        span.textContent = part;
        frag.appendChild(span);
      });
      node.parentNode.replaceChild(frag, node);
    });
    if (el.dataset.delay) el.style.setProperty("--base", el.dataset.delay + "ms");
  });

  /* ---------- Page enter / leave (between pages only) ---------- */
  function ready() {
    requestAnimationFrame(function () { document.body.classList.add("is-ready"); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();

  window.addEventListener("pageshow", function (e) {
    if (e.persisted) { document.body.classList.remove("is-leaving"); document.body.classList.add("is-ready"); }
  });

  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== "_self") return;
    if (a.hasAttribute("download")) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    // Same page (incl. #section links): let native smooth scroll handle it, no fade.
    if (url.pathname === location.pathname && url.search === location.search) return;
    e.preventDefault();
    document.body.classList.add("is-leaving");
    setTimeout(function () { location.href = url.href; }, reduced ? 150 : 420);
  });

  /* ---------- Header state + mobile menu ---------- */
  var header = document.querySelector(".header");
  function onScrollHeader() { header && header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  var menuBtn = document.querySelector(".menu-btn");
  var mnav = document.querySelector(".mnav");
  if (menuBtn && mnav) {
    menuBtn.addEventListener("click", function () {
      var open = menuBtn.getAttribute("aria-expanded") === "true";
      menuBtn.setAttribute("aria-expanded", String(!open));
      mnav.classList.toggle("is-open", !open);
    });
  }

  /* ---------- Scroll reveals (staggered for grids) ---------- */
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, idx) {
      child.setAttribute("data-reveal", "");
      child.style.setProperty("--d", idx * 80 + "ms");
    });
  });

  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Count-up numbers ---------- */
  function fmt(n, dec) {
    return Number(n).toLocaleString("en-AU", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  var counters = document.querySelectorAll("[data-count]");
  function runCount(el) {
    var target = parseFloat(el.dataset.count);
    var dec = parseInt(el.dataset.decimals || "0", 10);
    if (reduced) { el.textContent = fmt(target, dec); return; }
    var dur = 1500, start = null;
    function step(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased, dec);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) {
      el.textContent = fmt(0, parseInt(el.dataset.decimals || "0", 10));
      cio.observe(el);
    });
  }

  /* ---------- Gentle parallax on hero images ---------- */
  var parallax = document.querySelectorAll("[data-parallax]");
  if (parallax.length && !reduced) {
    var ticking = false;
    function updateParallax() {
      parallax.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var offset = (r.top + r.height / 2 - window.innerHeight / 2) * -0.08;
        el.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
      });
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(updateParallax); ticking = true; }
    }, { passive: true });
    updateParallax();
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq__q").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.closest(".faq__item");
      var open = item.classList.toggle("is-open");
      q.setAttribute("aria-expanded", String(open));
    });
  });

  /* ---------- Brisbane time helpers (clinic runs on AEST, no DST) ---------- */
  function brisNow() {
    var parts = new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Brisbane", year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", hourCycle: "h23"
    }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (p) { o[p.type] = parseInt(p.value, 10); });
    return { date: new Date(o.year, o.month - 1, o.day), minutes: o.hour * 60 + o.minute };
  }
  function hoursFor(dow) {
    if (dow === 0) return null;                 // Sunday closed
    if (dow === 6) return [8 * 60, 12 * 60];    // Sat 8am–12pm
    return [7 * 60, 19 * 60];                   // Mon–Fri 7am–7pm
  }

  /* Open / closed status */
  document.querySelectorAll("[data-open-status]").forEach(function (el) {
    var now = brisNow();
    var h = hoursFor(now.date.getDay());
    var open = h && now.minutes >= h[0] && now.minutes < h[1];
    el.className = "status " + (open ? "status--open" : "status--closed");
    el.innerHTML = '<span class="dot ' + (open ? "dot--ok" : "dot--err") + '"></span>' +
      (open ? "Open now" : "Closed now") + '<span class="sr-only"> (Brisbane time)</span>';
  });

  /* Footer year */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Booking widget (Cliniko mock-up) ---------- */
  var booker = document.getElementById("booker");
  if (booker) initBooker(booker);

  function initBooker(root) {
    var SERVICES = {
      "new-injury": "New injury, seen this week",
      "back-neck": "Back & neck pain",
      "sports": "Sports injuries",
      "post-surgery": "Post-surgery rehab",
      "running": "Running injuries",
      "headaches": "Headaches & jaw pain",
      "balance": "Balance & mobility"
    };
    var params = new URLSearchParams(location.search);
    var svc = params.get("service");
    if (svc && SERVICES[svc]) {
      var chip = root.querySelector(".for-chip");
      chip.textContent = "For: " + SERVICES[svc];
      chip.hidden = false;
      var pre = root.querySelector('input[name="session"][value="' + (svc === "running" ? "gait" : "initial") + '"]');
      if (pre) pre.checked = true;
    }

    var monthEl = root.querySelector(".cal__month");
    var daysEl = root.querySelector(".cal__days");
    var prevBtn = root.querySelector("[data-cal-prev]");
    var nextBtn = root.querySelector("[data-cal-next]");
    var slotsEl = root.querySelector(".slots");
    var slotsDay = root.querySelector(".slots__day");
    var summary = root.querySelector(".booker__summary");
    var confirmBtn = root.querySelector("[data-confirm]");
    var doneText = root.querySelector("[data-done-text]");

    var now = brisNow();
    var today = now.date;
    var maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 56);
    var view = new Date(today.getFullYear(), today.getMonth(), 1);
    var selDate = null, selTime = null;

    function sameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
    function physio() { return root.querySelector('input[name="physio"]:checked').value; }
    function session() { return root.querySelector('input[name="session"]:checked'); }
    function label12(m) {
      var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? "pm" : "am";
      h = h % 12 || 12;
      return h + (mm ? ":" + String(mm).padStart(2, "0") : "") + ap;
    }
    function hash(str) { var h = 0; for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }

    function slotsFor(d) {
      var h = hoursFor(d.getDay());
      if (!h) return [];
      var out = [];
      var key = d.toDateString() + physio();
      for (var m = h[0]; m + 45 <= h[1]; m += 45) {
        var past = sameDay(d, today) && m <= now.minutes + 60;
        var taken = hash(key + m) % 3 === 0;
        out.push({ m: m, free: !past && !taken });
      }
      return out;
    }
    function bookable(d) {
      if (d < today || d > maxDate) return false;
      return slotsFor(d).some(function (s) { return s.free; });
    }

    function renderCal() {
      monthEl.textContent = view.toLocaleDateString("en-AU", { month: "long", year: "numeric" });
      prevBtn.disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
      nextBtn.disabled = new Date(view.getFullYear(), view.getMonth() + 1, 1) > maxDate;
      daysEl.innerHTML = "";
      var first = (view.getDay() + 6) % 7; // Monday-first
      for (var i = 0; i < first; i++) daysEl.appendChild(document.createElement("span"));
      var dim = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      for (var d = 1; d <= dim; d++) {
        var date = new Date(view.getFullYear(), view.getMonth(), d);
        var b = document.createElement("button");
        b.type = "button";
        b.className = "day";
        b.textContent = d;
        var ok = bookable(date);
        b.disabled = !ok;
        if (ok) b.classList.add("is-avail");
        if (sameDay(date, today)) b.classList.add("is-today");
        if (sameDay(date, selDate)) b.classList.add("is-selected");
        b.setAttribute("aria-label", date.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" }) + (ok ? ", available" : ", unavailable"));
        (function (dt) { b.addEventListener("click", function () { selDate = dt; selTime = null; renderCal(); renderSlots(); renderSummary(); }); })(date);
        daysEl.appendChild(b);
      }
    }

    function renderSlots() {
      slotsEl.innerHTML = "";
      if (!selDate) { slotsDay.textContent = "Choose a day"; return; }
      slotsDay.textContent = selDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });
      var list = slotsFor(selDate);
      if (!list.some(function (s) { return s.free; })) {
        slotsEl.innerHTML = '<p class="slots-empty">No times left this day. Try another day or call us.</p>';
        return;
      }
      list.forEach(function (s) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "slot" + (selTime === s.m ? " is-selected" : "");
        b.textContent = label12(s.m);
        b.disabled = !s.free;
        b.setAttribute("aria-pressed", String(selTime === s.m));
        if (!s.free) b.setAttribute("aria-label", label12(s.m) + ", booked");
        b.addEventListener("click", function () { selTime = s.m; renderSlots(); renderSummary(); });
        slotsEl.appendChild(b);
      });
    }

    function renderSummary() {
      var s = session();
      var who = physio();
      var base = "<strong>" + s.dataset.name + "</strong> · " + s.dataset.len + " min · $" + s.dataset.price;
      if (selDate && selTime !== null) {
        summary.innerHTML = base + "<br>" + selDate.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }) +
          ", " + label12(selTime) + " with " + (who === "Any" ? "the first available physio" : who);
        confirmBtn.disabled = false;
      } else {
        summary.innerHTML = base + "<br>Pick a day and time to continue.";
        confirmBtn.disabled = true;
      }
    }

    // Default: first bookable day
    (function pickFirst() {
      var d = new Date(today);
      while (d <= maxDate && !bookable(d)) d.setDate(d.getDate() + 1);
      if (d <= maxDate) { selDate = d; view = new Date(d.getFullYear(), d.getMonth(), 1); }
    })();

    prevBtn.addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCal(); });
    nextBtn.addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCal(); });
    root.querySelectorAll('input[name="session"]').forEach(function (r) { r.addEventListener("change", renderSummary); });
    root.querySelectorAll('input[name="physio"]').forEach(function (r) {
      r.addEventListener("change", function () { selTime = null; renderCal(); renderSlots(); renderSummary(); });
    });
    confirmBtn.addEventListener("click", function () {
      if (confirmBtn.disabled) return;
      doneText.textContent = summary.textContent.replace("Pick a day and time to continue.", "");
      doneText.innerHTML = summary.innerHTML;
      root.classList.add("is-done");
      root.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    });
    root.querySelector("[data-reset]").addEventListener("click", function () {
      selTime = null; root.classList.remove("is-done"); renderCal(); renderSlots(); renderSummary();
    });

    renderCal(); renderSlots(); renderSummary();
  }

  /* ---------- Enquiry form (front-end only; Formspree at launch) ---------- */
  var form = document.getElementById("enquiry");
  if (form) {
    var rules = {
      name: function (v) { return v.trim().length >= 2; },
      phone: function (v) { return v.replace(/\D/g, "").length >= 8; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
      preferred: function (v) { return v !== ""; },
      privacy: function (v, el) { return el.checked; }
    };
    function check(el) {
      var ok = rules[el.name](el.value, el);
      var field = el.closest(".field");
      field.classList.toggle("is-invalid", !ok);
      el.setAttribute("aria-invalid", String(!ok));
      return ok;
    }
    Object.keys(rules).forEach(function (name) {
      var el = form.elements[name];
      el.addEventListener("blur", function () { if (el.closest(".field").classList.contains("is-invalid") || el.value) check(el); });
      el.addEventListener("change", function () { if (el.closest(".field").classList.contains("is-invalid")) check(el); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(rules).forEach(function (name) {
        var el = form.elements[name];
        if (!check(el) && !firstBad) firstBad = el;
      });
      if (firstBad) { firstBad.focus(); return; }
      var button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error("send failed");
          form.hidden = true;
          var done = document.querySelector(".form-success");
          done.classList.add("is-visible");
          done.setAttribute("tabindex", "-1");
          done.focus();
        })
        .catch(function () {
          button.disabled = false;
          form.querySelector(".form__hint").textContent = "Sorry, that didn't send. Please call (07) 5550 1234.";
        });
    });
  }
})();

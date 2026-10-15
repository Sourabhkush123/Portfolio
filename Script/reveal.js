// Scroll reveal: elements appear one by one as they enter the viewport, plus word-by-word intro text and a section dot navigator
(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce || !("IntersectionObserver" in window)) {
    $$(".skills").forEach((el) => el.classList.add("in-view"));
    return;
  }

  const REVEAL_MS = 1100;
  const PLAN = [
    [".themeDiv", "down"],
    [".stat", "zoom"],
    [".marquee", "fade"],
    [".tl-item", "left"],
    [".skillset-topic", "down"],
    [".skills", "zoom"],
    [".achievements", "zoom"],
    [".coding .code", "up"],
    [".project .title", "down"],
    ["#featured .box", "up"],
    ["#projects .box", "up"],
    ["#services .ai-sub, #github-feed .ai-sub, #ai-orbit .ai-sub, #stack-orbit .ai-sub, #neural .ai-sub, #semantic .ai-sub, #rag-lab .ai-sub, #ai-lab > .ai-sub", "fade"],
    [".service-card", "zoom"],
    [".repo-card", "up"],
    [".orbit-wrap", "up"],
    [".ai-panel", "up"],
    ["#faq details", "left"],
    ["#contact > p", "fade"],
    ["#cntct .text-brand, #cntct h1", "down"],
    ["#cntct .cf-card", "up"],
    [".social a", "zoom"],
    [".share-row", "up"],
  ];

  let started = false;
  const queue = [];
  let timer = null;

  // Navbar waits for the preloader, then slides in and its links appear one by one
  const header = $("header");
  const footer = $("footer");
  if (footer) footer.classList.add("ft-pending");
  if (header) {
    header.classList.add("nav-pending");
    $$(".navbar-brand, .nav-item", header).forEach((item, i) => item.style.setProperty("--n", i));
  }

  function byPosition(a, b) {
    return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  }

  function reveal(el) {
    el.classList.add("rv-in");
    if (el.matches(".skills")) el.classList.add("in-view");
    // Drop the helper classes afterwards so the element's own hover transitions work again
    setTimeout(() => {
      el.classList.remove("rv", "rv-in");
      el.removeAttribute("data-rv");
    }, REVEAL_MS + 200);
  }

  function pump() {
    const el = queue.shift();
    if (!el) {
      timer = null;
      return;
    }
    reveal(el);
    // Release faster when many elements are waiting so a quick scroll does not feel stuck
    timer = setTimeout(pump, Math.max(80, 220 - queue.length * 12));
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (entry.target.classList.contains("rw-host")) {
          entry.target.classList.add("rw-in");
          return;
        }
        queue.push(entry.target);
      });
      queue.sort(byPosition);
      if (!timer && queue.length) pump();
    },
    { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
  );

  function register(el, effect) {
    if (el.classList.contains("rv") || el.classList.contains("rv-in")) return;
    el.classList.add("rv");
    el.setAttribute("data-rv", effect);
    if (started) observer.observe(el);
  }

  PLAN.forEach(([selector, effect]) => $$(selector).forEach((el) => register(el, effect)));

  // Repository cards are created after the GitHub request resolves
  const repoGrid = $("#repo-grid");
  if (repoGrid) {
    new MutationObserver(() => $$(".repo-card", repoGrid).forEach((el) => register(el, "up"))).observe(repoGrid, { childList: true });
  }

  // Intro paragraph fades in word by word
  const intro = $("#about > p");
  if (intro) {
    let count = 0;
    const walker = document.createTreeWalker(intro, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
          return;
        }
        const word = document.createElement("span");
        word.className = "rw";
        word.style.setProperty("--w", count++);
        word.textContent = part;
        frag.appendChild(word);
      });
      node.parentNode.replaceChild(frag, node);
    });
    intro.classList.add("rw-host");
  }

  function start() {
    if (started) return;
    started = true;
    if (footer) {
      footer.classList.remove("ft-pending");
      footer.classList.add("ft-in");
    }
    if (header) {
      header.classList.remove("nav-pending");
      header.classList.add("nav-in");
    }
    $$(".rv").forEach((el) => observer.observe(el));
    if (intro) observer.observe(intro);
  }

  if ($("#preloader")) {
    window.addEventListener("preloader-done", start, { once: true });
    setTimeout(start, 9000);
  } else {
    start();
  }

  /* Section dot navigator with scroll spy */
  const SECTIONS = [
    ["about", "About"],
    ["experience", "Experience"],
    ["education", "Education"],
    ["featured", "Featured Projects"],
    ["skillset", "Skillset"],
    ["services", "Services"],
    ["github-feed", "GitHub"],
    ["ai-orbit", "AI Stack"],
    ["neural", "Neural Network"],
    ["semantic", "Skill Map"],
    ["rag-lab", "RAG Demo"],
    ["ai-lab", "Job Fit"],
    ["faq", "FAQ"],
    ["projects", "Projects"],
    ["cntct", "Contact"],
  ];

  const nav = document.createElement("nav");
  nav.className = "dot-nav";
  nav.setAttribute("aria-label", "Page sections");
  const links = new Map();
  SECTIONS.forEach(([id, label]) => {
    const target = document.getElementById(id);
    if (!target) return;
    const link = document.createElement("a");
    link.href = "#" + id;
    link.setAttribute("data-label", label);
    link.setAttribute("aria-label", label);
    nav.appendChild(link);
    links.set(target, link);
  });
  document.body.appendChild(nav);

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const link = links.get(entry.target);
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach((other) => other.classList.remove("is-active"));
          link.classList.add("is-active");
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  links.forEach((_, section) => spy.observe(section));

  const toggleNav = () => nav.classList.toggle("is-visible", window.scrollY > 400);
  window.addEventListener("scroll", toggleNav, { passive: true });
  toggleNav();

  /* Highlight the navbar link of the section being read */
  const navLinks = $$(".nav-link[href^='#']", header || document)
    .map((link) => ({ link, target: document.querySelector(link.getAttribute("href")) }))
    .filter((item) => item.target);
  let spyTick = false;
  const markCurrent = () => {
    spyTick = false;
    const line = window.innerHeight * 0.35;
    let current = null;
    let best = -Infinity;
    navLinks.forEach((item) => {
      const top = item.target.getBoundingClientRect().top;
      if (top <= line && top > best) {
        best = top;
        current = item.link;
      }
    });
    navLinks.forEach((item) => item.link.classList.toggle("is-current", item.link === current));
  };
  window.addEventListener("scroll", () => {
    if (!spyTick) {
      spyTick = true;
      requestAnimationFrame(markCurrent);
    }
  }, { passive: true });
  markCurrent();
})();

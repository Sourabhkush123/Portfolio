// More GSAP features: neural network, semantic skill map, particle constellation, magnetic buttons
(function () {
  "use strict";

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = typeof gsap !== "undefined";
  const animate = hasGsap && !reduce;
  const hasScrollTrigger = hasGsap && typeof ScrollTrigger !== "undefined";
  if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  const NS = "http://www.w3.org/2000/svg";
  const make = (tag, attrs, parent) => {
    const node = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach((key) => node.setAttribute(key, attrs[key]));
    if (parent) parent.appendChild(node);
    return node;
  };
  const rand = (min, max) => min + Math.random() * (max - min);
  const watch = (el, callback) => {
    if (!("IntersectionObserver" in window)) return callback(true);
    new IntersectionObserver((entries) => callback(entries[0].isIntersecting)).observe(el);
  };

  /* Neural network */
  const nn = $("#nn-svg");
  if (nn) {
    const layers = [4, 6, 6, 3];
    const xs = [90, 290, 490, 670];
    const captions = ["Input", "Hidden 1", "Hidden 2", "Output"];
    const messages = [
      "Input layer receives the features.",
      "Hidden layer 1 combines them with weights.",
      "Hidden layer 2 refines the signal.",
      "Output layer produces class scores.",
    ];
    const status = $("#nn-status");
    const gEdges = make("g", {}, nn);
    const gPulse = make("g", {}, nn);
    const gSignals = make("g", {}, nn);
    const gNodes = make("g", {}, nn);

    const pos = layers.map((count, l) =>
      Array.from({ length: count }, (_, i) => ({ x: xs[l], y: 30 + (260 / count) * (i + 0.5) }))
    );
    const edges = [];
    for (let l = 0; l < 3; l++) {
      edges[l] = [];
      pos[l].forEach((a) =>
        pos[l + 1].forEach((b) => {
          const len = Math.hypot(b.x - a.x, b.y - a.y);
          const coords = { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
          const base = make("line", Object.assign({ class: "nn-edge" }, coords), gEdges);
          const pulse = make("line", Object.assign({ class: "nn-pulse", "stroke-dasharray": len }, coords), gPulse);
          pulse.style.strokeDashoffset = len;
          edges[l].push({ base, pulse, len });
        })
      );
    }
    const nodes = pos.map((layer, l) => layer.map((p) => make("circle", { cx: p.x, cy: p.y, r: l === 3 ? 16 : 13, class: "nn-node" }, gNodes)));
    captions.forEach((text, l) => (make("text", { x: xs[l], y: 326, class: "nn-caption" }, nn).textContent = text));
    const percents = pos[3].map((p) => {
      const label = make("text", { x: p.x + 30, y: p.y + 5, class: "nn-percent" }, nn);
      label.textContent = "--";
      return label;
    });

    let tl = null;
    const resetNet = () => {
      if (tl) tl.kill();
      nodes.flat().forEach((n) => n.classList.remove("is-lit", "is-top"));
      edges.flat().forEach((e) => {
        e.pulse.style.opacity = 0;
        e.pulse.style.strokeDashoffset = e.len;
      });
      percents.forEach((p) => (p.textContent = "--"));
    };

    const scores = () => {
      const raw = percents.map(() => Math.exp(rand(0, 3)));
      const sum = raw.reduce((a, b) => a + b, 0);
      const values = raw.map((v) => Math.round((v / sum) * 100));
      values[values.length - 1] += 100 - values.reduce((a, b) => a + b, 0);
      return values;
    };

    function fire() {
      resetNet();
      const values = scores();
      const top = values.indexOf(Math.max(...values));
      const finish = () => {
        nodes[3][top].classList.add("is-top");
        status.textContent = "Output scores are random here. A trained network would learn its weights from data.";
      };

      if (!animate) {
        nodes.flat().forEach((n) => n.classList.add("is-lit"));
        percents.forEach((p, i) => (p.textContent = values[i] + "%"));
        finish();
        return;
      }

      tl = gsap.timeline();
      layers.forEach((_, l) => {
        tl.add(() => {
          nodes[l].forEach((n) => n.classList.add("is-lit"));
          status.textContent = messages[l];
        });
        tl.fromTo(nodes[l], { scale: 1 }, { scale: 1.3, duration: 0.22, yoyo: true, repeat: 1, stagger: 0.05 }, "<");
        if (l < 3) {
          tl.to(edges[l].map((e) => e.pulse), { opacity: 1, strokeDashoffset: 0, duration: 0.5, stagger: { amount: 0.45 }, ease: "power2.out" });
        }
      });
      const counter = { t: 0 };
      tl.to(counter, {
        t: 1,
        duration: 0.9,
        ease: "power2.out",
        onUpdate: () => percents.forEach((p, i) => (p.textContent = Math.round(values[i] * counter.t) + "%")),
      });
      tl.add(finish);
      tl.to(edges.flat().map((e) => e.pulse), { opacity: 0, duration: 0.8 }, "+=0.4");
    }

    $("#nn-fire").addEventListener("click", fire);
    $("#nn-shuffle").addEventListener("click", () => {
      const targets = edges.flat().map((e) => e.base);
      status.textContent = "Weights randomized. Thicker lines carry stronger signals.";
      const change = (el) => ({ strokeOpacity: rand(0.08, 0.6), strokeWidth: rand(0.5, 3.2) });
      if (animate) targets.forEach((el) => gsap.to(el, Object.assign(change(el), { duration: 0.7, ease: "power2.out" })));
      else targets.forEach((el) => Object.assign(el.style, { strokeOpacity: rand(0.08, 0.6), strokeWidth: rand(0.5, 3.2) }));
    });

    if (animate) {
      let visible = false;
      watch(nn, (on) => (visible = on));
      setInterval(() => {
        if (!visible || document.hidden) return;
        const l = Math.floor(rand(0, 3));
        const a = pos[l][Math.floor(rand(0, pos[l].length))];
        const b = pos[l + 1][Math.floor(rand(0, pos[l + 1].length))];
        const dot = make("circle", { r: 3.5, cx: a.x, cy: a.y, class: "nn-signal" }, gSignals);
        gsap.to(dot, { attr: { cx: b.x, cy: b.y }, duration: 1.1, ease: "none", onComplete: () => dot.remove() });
      }, 350);
      if (hasScrollTrigger) ScrollTrigger.create({ trigger: nn, start: "top 70%", once: true, onEnter: fire });
    }
  }

  /* Semantic skill map */
  const mapSvg = $("#map-svg");
  if (mapSvg) {
    const CLUSTERS = {
      ai: { name: "Generative AI", color: "#ff00d4", x: 190, y: 125, r: 125 },
      backend: { name: "Backend", color: "#00ddff", x: 620, y: 125, r: 125 },
      frontend: { name: "Frontend", color: "#ffd166", x: 160, y: 315, r: 115 },
      testing: { name: "Test Automation", color: "#7cff6b", x: 600, y: 335, r: 115 },
      edu: { name: "Education & Core", color: "#ff8a5c", x: 400, y: 240, r: 80 },
    };
    const POINTS = [
      ["Generative AI", "ai", 110, 95, ["generative ai", "genai", "llm", "ai"]],
      ["RAG", "ai", 190, 75, ["rag", "retrieval"]],
      ["Vector DB", "ai", 265, 115, ["vector", "embedding", "embeddings"]],
      ["MCP", "ai", 120, 160, ["mcp"]],
      ["FastAPI", "ai", 215, 170, ["fastapi"]],
      ["Streamlit", "ai", 100, 215, ["streamlit"]],
      ["Python", "ai", 320, 165, ["python"]],
      ["Java", "backend", 570, 85, ["java"]],
      ["Spring Boot", "backend", 665, 70, ["spring", "spring boot", "boot"]],
      ["Servlets / JSP", "backend", 525, 135, ["servlet", "servlets", "jsp"]],
      ["JDBC", "backend", 590, 170, ["jdbc"]],
      ["MySQL", "backend", 690, 150, ["mysql", "sql", "database"]],
      ["REST APIs", "backend", 730, 100, ["rest", "api", "apis"]],
      ["Microservices", "backend", 640, 205, ["microservices", "microservice"]],
      ["Spring Data JPA", "backend", 730, 195, ["jpa", "spring data"]],
      ["React", "frontend", 150, 290, ["react", "reactjs"]],
      ["JavaScript", "frontend", 85, 345, ["javascript", "js"]],
      ["TypeScript", "frontend", 215, 350, ["typescript", "ts"]],
      ["HTML / CSS", "frontend", 55, 280, ["html", "css"]],
      ["Bootstrap", "frontend", 255, 285, ["bootstrap"]],
      ["WebdriverIO", "testing", 560, 300, ["webdriverio", "webdriver"]],
      ["Selenium", "testing", 650, 345, ["selenium"]],
      ["Postman", "testing", 700, 290, ["postman"]],
      ["TestNG", "testing", 545, 375, ["testng", "junit"]],
      ["Cucumber", "testing", 630, 395, ["cucumber"]],
      ["Axios", "testing", 500, 340, ["axios"]],
      ["B.Tech AI/ML", "edu", 400, 205, ["btech", "b.tech", "degree", "education", "machine learning", "ml"]],
      ["IBM Java", "edu", 350, 260, ["ibm", "certified", "certification"]],
      ["ServiceNow", "edu", 455, 262, ["servicenow"]],
      ["DSA", "edu", 400, 300, ["dsa", "algorithms", "data structures"]],
    ].map(([label, cluster, x, y, keys]) => ({ label, cluster, x, y, keys }));

    const status = $("#map-status");
    const input = $("#map-input");
    const gHalo = make("g", {}, mapSvg);
    const gLinks = make("g", {}, mapSvg);
    const gDots = make("g", {}, mapSvg);
    const star = make("g", { class: "map-star" }, mapSvg);
    star.style.opacity = 0;
    make("circle", { r: 9 }, star);
    make("circle", { r: 16, class: "map-star-ring" }, star);

    const halos = Object.keys(CLUSTERS).map((key) => {
      const c = CLUSTERS[key];
      const halo = make("circle", { cx: c.x, cy: c.y, r: c.r, fill: c.color, class: "map-halo" }, gHalo);
      const title = make("text", { x: c.x, y: Math.max(16, c.y - c.r + 6), class: "map-cluster-title" }, gHalo);
      title.textContent = c.name;
      return halo;
    });

    const legend = $("#map-legend");
    Object.keys(CLUSTERS).forEach((key) => {
      const item = document.createElement("span");
      const swatch = document.createElement("i");
      swatch.style.background = CLUSTERS[key].color;
      item.append(swatch, CLUSTERS[key].name);
      legend.appendChild(item);
    });

    POINTS.forEach((p) => {
      p.group = make("g", { class: "map-dot", tabindex: 0, role: "button", "aria-label": p.label }, gDots);
      make("circle", { cx: p.x, cy: p.y, r: 7, fill: CLUSTERS[p.cluster].color }, p.group);
      make("text", { x: p.x, y: p.y + 20 }, p.group).textContent = p.label;
      const choose = () => focusOn([p], p.label);
      p.group.addEventListener("click", choose);
      p.group.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          choose();
        }
      });
    });

    let mapTl = null;
    const clearMap = () => {
      if (mapTl) mapTl.kill();
      while (gLinks.firstChild) gLinks.removeChild(gLinks.firstChild);
      POINTS.forEach((p) => {
        p.group.style.opacity = 1;
        $("circle", p.group).setAttribute("r", 7);
      });
      star.style.opacity = 0;
    };

    function focusOn(hits, query) {
      clearMap();
      input.value = query;
      const near = POINTS.filter((p) => !hits.includes(p))
        .sort((a, b) => Math.hypot(a.x - hits[0].x, a.y - hits[0].y) - Math.hypot(b.x - hits[0].x, b.y - hits[0].y))
        .slice(0, 3);
      const group = hits.concat(near);
      const target = {
        x: hits.reduce((sum, p) => sum + p.x, 0) / hits.length,
        y: hits.reduce((sum, p) => sum + p.y, 0) / hits.length,
      };
      const text = 'Nearest to "' + query + '": ' + group.map((p) => p.label).join(", ") + ".";

      const lines = group
        .filter((p) => p.x !== target.x || p.y !== target.y)
        .map((p) => {
          const len = Math.hypot(p.x - target.x, p.y - target.y);
          const line = make("line", { x1: target.x, y1: target.y, x2: p.x, y2: p.y, class: "map-link", "stroke-dasharray": len }, gLinks);
          line.style.strokeDashoffset = animate ? len : 0;
          return line;
        });

      if (!animate) {
        POINTS.forEach((p) => (p.group.style.opacity = group.includes(p) ? 1 : 0.25));
        star.setAttribute("transform", "translate(" + target.x + " " + target.y + ")");
        star.style.opacity = 1;
        status.textContent = text;
        return;
      }

      mapTl = gsap.timeline();
      mapTl.to(POINTS.map((p) => p.group), { opacity: (i, el) => (group.some((p) => p.group === el) ? 1 : 0.25), duration: 0.4 });
      mapTl.fromTo(star, { x: 400, y: 210, opacity: 0, scale: 0.3, svgOrigin: "0 0" }, { opacity: 1, scale: 1, duration: 0.3 }, 0);
      mapTl.to(star, { x: target.x, y: target.y, duration: 1, ease: "power3.inOut" }, 0.2);
      mapTl.fromTo(star.lastChild, { attr: { r: 10 }, opacity: 1 }, { attr: { r: 34 }, opacity: 0, duration: 0.8, repeat: 1, ease: "power2.out" }, 1.2);
      mapTl.to(lines, { strokeDashoffset: 0, duration: 0.6, stagger: 0.12, ease: "power2.out" }, 1.1);
      group.forEach((p, i) => {
        mapTl.to($("circle", p.group), { attr: { r: hits.includes(p) ? 13 : 10 }, duration: 0.35, ease: "back.out(2.5)" }, 1.1 + i * 0.12);
      });
      mapTl.add(() => (status.textContent = text), 1.2);
    }

    function search(raw) {
      const q = raw.trim().toLowerCase();
      if (!q) {
        if (animate) gsap.fromTo(input, { x: -10 }, { x: 0, duration: 0.6, ease: "elastic.out(1, 0.3)" });
        input.focus();
        return;
      }
      const hits = POINTS.filter((p) => p.keys.some((k) => q === k || (q.length >= 3 && (q.includes(k) || k.includes(q)))));
      if (!hits.length) {
        clearMap();
        status.textContent = 'No skill matches "' + raw.trim() + '". Try spring, rag, selenium, react or mysql.';
        return;
      }
      focusOn(hits, raw.trim());
    }

    $("#map-form").addEventListener("submit", (event) => {
      event.preventDefault();
      search(input.value);
    });
    $$(".rag-chip", $("#semantic")).forEach((chip) =>
      chip.addEventListener("click", () => {
        input.value = chip.textContent;
        search(chip.textContent);
      })
    );

    if (animate) {
      halos.forEach((halo, i) => gsap.to(halo, { scale: 1.07, svgOrigin: halo.getAttribute("cx") + " " + halo.getAttribute("cy"), duration: 2.4 + i * 0.3, ease: "sine.inOut", yoyo: true, repeat: -1 }));
      if (hasScrollTrigger) {
        POINTS.forEach((p, i) =>
          gsap.from(p.group, { scale: 0, opacity: 0, svgOrigin: p.x + " " + p.y, duration: 0.6, delay: i * 0.03, ease: "back.out(2)", scrollTrigger: { trigger: mapSvg, start: "top 80%", once: true } })
        );
      }
    }
  }

  /* Particle constellation behind the page */
  const canvas = $("#constellation");
  if (canvas && animate) {
    const ctx = canvas.getContext("2d");
    const mouse = { x: -999, y: -999 };
    let w = 0;
    let h = 0;
    let particles = [];
    let accent = "0,119,161";

    const readAccent = () => {
      const hex = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
      const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
      if (m) accent = [1, 2, 3].map((i) => parseInt(m[i], 16)).join(",");
    };

    const setup = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(28, Math.min(70, Math.round((w * h) / 24000)));
      particles = Array.from({ length: count }, () => ({ x: rand(0, w), y: rand(0, h), vx: rand(-0.25, 0.25), vy: rand(-0.25, 0.25) }));
    };
    setup();
    window.addEventListener("resize", setup);
    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    window.addEventListener("mouseout", () => (mouse.x = mouse.y = -999));

    let frame = 0;
    gsap.ticker.add(() => {
      if (document.hidden) return;
      if (frame++ % 120 === 0) readAccent();
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (dm < 170) {
          p.x += (mouse.x - p.x) * 0.004;
          p.y += (mouse.y - p.y) * 0.004;
        }
      });
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.beginPath();
        ctx.arc(a.x, a.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.strokeStyle = "rgba(" + accent + "," + ((1 - d / 130) * 0.55).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (dm < 170) {
          ctx.strokeStyle = "rgba(255,255,255," + ((1 - dm / 170) * 0.6).toFixed(3) + ")";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    });
  } else if (canvas) {
    canvas.remove();
  }

  /* Magnetic buttons */
  if (animate && fine) {
    $$(".cta-btn, .project-filter").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.28, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.3, ease: "power2.out" });
      });
      btn.addEventListener("mouseleave", () => gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.35)" }));
    });
  }
})();

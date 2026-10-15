// GSAP-powered AI features: orbiting Generative AI stack and animated RAG pipeline demo
(function () {
  "use strict";

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof gsap !== "undefined";
  const animate = hasGsap && !reduce;
  const hasScrollTrigger = hasGsap && typeof ScrollTrigger !== "undefined";
  if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* Orbits: every .orbit-wrap gets spokes, satellites and click-to-inspect items */
  const SVG_NS = "http://www.w3.org/2000/svg";

  function initOrbit(wrap) {
    const orbit = $(".orbit", wrap);
    const items = $$(".orbit-item", orbit);
    const detail = $(".orbit-detail", wrap);
    const core = $(".orbit-core", orbit);
    const ring = $(".orbit-ring", orbit);
    const direction = orbit.dataset.reverse ? -1 : 1;
    const state = { angle: 0 };

    const lines = document.createElementNS(SVG_NS, "svg");
    lines.setAttribute("class", "orbit-lines");
    lines.setAttribute("aria-hidden", "true");
    const spokes = items.map(() => {
      const line = document.createElementNS(SVG_NS, "line");
      lines.appendChild(line);
      return line;
    });
    orbit.insertBefore(lines, core);

    const satellites = [0, 1, 2].map((n) => {
      const dot = document.createElement("span");
      dot.className = "orbit-satellite";
      dot.setAttribute("aria-hidden", "true");
      orbit.appendChild(dot);
      return { dot, offset: n * 120, speed: 1.6 + n * 0.5 };
    });

    const place = () => {
      const size = orbit.clientWidth;
      const radius = size * 0.38;
      const half = size / 2;
      items.forEach((item, i) => {
        const a = ((state.angle * direction + (i * 360) / items.length - 90) * Math.PI) / 180;
        const x = Math.cos(a) * radius;
        const y = Math.sin(a) * radius;
        if (hasGsap) gsap.set(item, { x, y });
        else item.style.transform = "translate(" + x + "px," + y + "px)";
        spokes[i].setAttribute("x1", half);
        spokes[i].setAttribute("y1", half);
        spokes[i].setAttribute("x2", half + x);
        spokes[i].setAttribute("y2", half + y);
      });
      satellites.forEach((sat) => {
        const a = ((-state.angle * direction * sat.speed + sat.offset) * Math.PI) / 180;
        const x = Math.cos(a) * radius;
        const y = Math.sin(a) * radius;
        if (hasGsap) gsap.set(sat.dot, { x, y });
        else sat.dot.style.transform = "translate(" + x + "px," + y + "px)";
      });
    };
    place();
    window.addEventListener("resize", place);

    items.forEach((item, index) => {
      item.addEventListener("click", () => {
        items.forEach((other, i) => {
          other.classList.toggle("is-active", other === item);
          other.setAttribute("aria-pressed", String(other === item));
          spokes[i].classList.toggle("is-active", other === item);
        });
        $("h4", detail).textContent = item.dataset.title;
        $("p", detail).textContent = item.dataset.desc;
        if (animate) {
          gsap.fromTo(detail, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" });
          gsap.fromTo(core, { scale: 1 }, { scale: 1.18, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out" });
          gsap.fromTo(item, { scale: 1 }, { scale: 1.3, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out" });
          gsap.fromTo(spokes[index], { strokeDashoffset: 120 }, { strokeDashoffset: 0, duration: 0.6, ease: "power2.out" });
        }
      });
    });

    if (animate) {
      const spin = gsap.to(state, { angle: 360, duration: Number(orbit.dataset.duration) || 36, ease: "none", repeat: -1, onUpdate: place });
      gsap.to(ring, { rotation: -360 * direction, duration: 60, ease: "none", repeat: -1 });
      gsap.to(core, { boxShadow: "0 0 50px var(--accent), 0 0 90px rgba(255,255,255,0.4)", duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
      const slow = (scale) => () => gsap.to(spin, { timeScale: scale, duration: 0.6 });
      orbit.addEventListener("mouseenter", slow(0.12));
      orbit.addEventListener("mouseleave", slow(1));
      orbit.addEventListener("focusin", slow(0));
      orbit.addEventListener("focusout", slow(1));

      if (hasScrollTrigger) {
        const trigger = { trigger: orbit, start: "top 80%", once: true };
        gsap.from(items, { scale: 0, opacity: 0, duration: 0.8, stagger: 0.12, ease: "back.out(2)", scrollTrigger: trigger });
        gsap.from(core, { scale: 0, duration: 0.9, ease: "elastic.out(1, 0.5)", scrollTrigger: trigger });
        gsap.from(spokes, { opacity: 0, duration: 1, stagger: 0.1, scrollTrigger: trigger });
      }
    }
  }
  $$(".orbit-wrap").forEach(initOrbit);

  /* RAG pipeline demo */
  const ragForm = $("#rag-form");
  if (ragForm) {
    const input = $("#rag-input");
    const status = $("#rag-status");
    const docsBox = $("#rag-docs");
    const answerBox = $("#rag-answer");
    const nodes = $$(".rag-node");
    const dots = $$(".rag-dot");
    const flow = $(".rag-flow");
    const STAGES = [
      "Question received.",
      "Converting the question into an embedding vector...",
      "Searching the vector database for the closest chunks...",
      "Assembling the top chunks into a context window...",
      "The model writes an answer grounded in that context...",
    ];
    let timeline = null;

    function retrieve(query) {
      const kb = window.PORTFOLIO_KB || [];
      const text = query.toLowerCase().replace(/[^a-z0-9+#.\-\s/]/g, " ");
      const tokens = new Set();
      text.split(/\s+/).forEach((word) => {
        if (!word) return;
        tokens.add(word);
        tokens.add(word.replace(/s$/, ""));
      });
      return kb
        .map((entry) => {
          let score = 0;
          entry.keys.forEach((key) => {
            if (/[\s.+#/-]/.test(key)) {
              if (text.includes(key)) score += 3;
            } else if (tokens.has(key)) {
              score += 1;
            }
          });
          return { entry, score };
        })
        .filter((hit) => hit.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
    }

    function renderDocs(hits) {
      docsBox.innerHTML = "";
      const top = hits.length ? hits[0].score : 1;
      hits.forEach((hit) => {
        const card = document.createElement("div");
        card.className = "rag-doc";
        const title = document.createElement("strong");
        title.textContent = hit.entry.keys.slice(0, 2).join(" / ");
        const snippet = document.createElement("span");
        snippet.textContent = hit.entry.answer.split(/\s+/).slice(0, 9).join(" ") + "...";
        const bar = document.createElement("span");
        bar.className = "rag-bar";
        const fill = document.createElement("i");
        fill.dataset.width = Math.round((hit.score / top) * 100) + "%";
        bar.appendChild(fill);
        card.append(title, snippet, bar);
        docsBox.appendChild(card);
      });
      return $$(".rag-doc", docsBox);
    }

    function reset() {
      if (timeline) timeline.kill();
      nodes.forEach((node) => node.classList.remove("is-active", "is-done"));
      if (hasGsap) gsap.set(dots, { opacity: 0 });
      docsBox.innerHTML = "";
      answerBox.hidden = true;
      answerBox.textContent = "";
    }

    function run(query) {
      reset();
      const hits = retrieve(query);
      const answer = hits.length ? hits[0].entry.answer : window.PORTFOLIO_FALLBACK || "No relevant chunks found.";

      if (!animate) {
        nodes.forEach((node) => node.classList.add("is-done"));
        renderDocs(hits).forEach((card) => ($("i", card).style.width = $("i", card).dataset.width));
        answerBox.hidden = false;
        answerBox.textContent = answer;
        status.textContent = hits.length ? "Done. Answer generated from " + hits.length + " retrieved chunk(s)." : "No relevant chunks found.";
        return;
      }

      const vertical = getComputedStyle(flow).flexDirection === "column";
      const prop = vertical ? "top" : "left";
      const links = $$(".rag-link");
      timeline = gsap.timeline({ defaults: { ease: "power2.inOut" } });

      nodes.forEach((node, i) => {
        timeline.add(() => {
          if (i > 0) nodes[i - 1].classList.replace("is-active", "is-done");
          node.classList.add("is-active");
          status.textContent = STAGES[i];
        });
        timeline.fromTo(node, { scale: 1 }, { scale: 1.15, duration: 0.22, yoyo: true, repeat: 1 });
        if (i === 2) {
          timeline.add(() => {
            const cards = renderDocs(hits);
            if (!cards.length) {
              status.textContent = "No relevant chunks found. The model will fall back to a generic reply.";
              return;
            }
            gsap.from(cards, { y: 24, opacity: 0, duration: 0.5, stagger: 0.15, ease: "back.out(1.6)" });
            gsap.to($$(".rag-bar i", docsBox), { width: (index, el) => el.dataset.width, duration: 0.9, delay: 0.3, stagger: 0.15, ease: "power3.out" });
          });
          timeline.to({}, { duration: 0.9 });
        }
        if (links[i]) {
          timeline.fromTo(dots[i], { [prop]: "0%", opacity: 1, scale: 0.6 }, { [prop]: "100%", opacity: 1, scale: 1.2, duration: 0.7 }, ">-0.05");
          timeline.to(dots[i], { opacity: 0, duration: 0.15 });
        }
      });

      timeline.add(() => {
        nodes[nodes.length - 1].classList.replace("is-active", "is-done");
        status.textContent = hits.length ? "Done. Answer generated from " + hits.length + " retrieved chunk(s)." : "Done.";
        answerBox.hidden = false;
      });
      const typed = { n: 0 };
      timeline.to(typed, {
        n: answer.length,
        duration: Math.min(3.5, Math.max(1, answer.length * 0.012)),
        ease: "none",
        onUpdate: () => (answerBox.textContent = answer.slice(0, Math.round(typed.n))),
      });
    }

    ragForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = input.value.trim();
      if (!query) {
        if (animate) gsap.fromTo(input, { x: -10 }, { x: 0, duration: 0.6, ease: "elastic.out(1, 0.3)" });
        input.focus();
        return;
      }
      run(query);
    });

    $$(".rag-chip", $("#rag-lab")).forEach((chip) =>
      chip.addEventListener("click", () => {
        input.value = chip.textContent;
        ragForm.requestSubmit();
      })
    );

    if (animate && hasScrollTrigger) {
      gsap.from(nodes, { y: 30, opacity: 0, duration: 0.6, stagger: 0.12, ease: "back.out(1.7)", clearProps: "all", scrollTrigger: { trigger: flow, start: "top 85%", once: true } });
    }
  }
})();

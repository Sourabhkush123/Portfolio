// Turns each skillset box into a small orbit: the box stays, its skills circle a centre label
(function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof gsap !== "undefined";
  const CORE_LABELS = {
    "Front-end Development": "Front-end",
    "Back-end Development": "Back-end",
    "Programming Languages": "Languages",
    "Frameworks": "Frameworks",
    "Technical Subjects": "Subjects",
    "Tools & Technologies": "Tools",
    "Integrated Development Environment": "IDEs",
    "Other Skills": "Other",
  };
  const SVG_NS = "http://www.w3.org/2000/svg";

  function initBox(box) {
    const skills = Array.from(box.querySelectorAll(":scope > .skill"));
    if (!skills.length) return;
    const topic = box.parentElement.querySelector(".skillset-topic");
    const name = topic ? topic.textContent.trim() : "";

    box.classList.add("is-orbit");

    const core = document.createElement("div");
    core.className = "skill-core";
    core.setAttribute("aria-hidden", "true");
    core.textContent = CORE_LABELS[name] || name;

    const ring = document.createElement("div");
    ring.className = "skill-ring";
    ring.setAttribute("aria-hidden", "true");

    const lines = document.createElementNS(SVG_NS, "svg");
    lines.setAttribute("class", "skill-lines");
    lines.setAttribute("aria-hidden", "true");
    const spokes = skills.map(() => {
      const line = document.createElementNS(SVG_NS, "line");
      lines.appendChild(line);
      return line;
    });

    box.prepend(lines);
    box.prepend(ring);
    box.appendChild(core);

    const state = { angle: 0 };

    const place = () => {
      const w = box.clientWidth;
      const h = box.clientHeight;
      const node = skills[0].offsetWidth || 78;
      const radius = Math.max(40, Math.min(w, h) / 2 - node / 2 - 8);
      ring.style.width = ring.style.height = radius * 2 + "px";
      skills.forEach((skill, i) => {
        const a = ((state.angle + (i * 360) / skills.length - 90) * Math.PI) / 180;
        const x = Math.cos(a) * radius;
        const y = Math.sin(a) * radius;
        if (hasGsap) gsap.set(skill, { x, y });
        else skill.style.transform = "translate(" + x + "px," + y + "px)";
        spokes[i].setAttribute("x1", w / 2);
        spokes[i].setAttribute("y1", h / 2);
        spokes[i].setAttribute("x2", w / 2 + x);
        spokes[i].setAttribute("y2", h / 2 + y);
      });
    };
    place();
    window.addEventListener("resize", place);

    if (hasGsap && !reduce) {
      const spin = gsap.to(state, { angle: 360, duration: 40, ease: "none", repeat: -1, onUpdate: place });
      const slow = (scale) => () => gsap.to(spin, { timeScale: scale, duration: 0.5 });
      box.addEventListener("mouseenter", slow(0.1));
      box.addEventListener("mouseleave", slow(1));
    }
  }

  document.querySelectorAll("#skillset .skills").forEach(initBox);
})();

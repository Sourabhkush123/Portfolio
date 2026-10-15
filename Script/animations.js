// Animations: GSAP + ScrollTrigger, Typed.js and VanillaTilt (scroll reveal lives in reveal.js)
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  // Scroll progress bar
  const progress = document.getElementById("scroll-progress");
  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty("--p", max > 0 ? window.scrollY / max : 0);
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();

  // Index skill pills for staggered pop/bob/shine
  $$(".skills").forEach((group) => {
    group.querySelectorAll(".skill").forEach((skill, i) => skill.style.setProperty("--i", i));
  });

  // Typed.js role line
  if (typeof Typed !== "undefined" && !reduceMotion) {
    new Typed("#typed", {
      strings: [
        "Full-Stack Java Developer",
        "Spring Boot and Microservices Engineer",
        "Generative AI Enthusiast",
        "Experience at HCLTech and Siemens",
      ],
      typeSpeed: 55,
      backSpeed: 30,
      backDelay: 1600,
      loop: true,
    });
  } else {
    document.getElementById("typed").textContent = "Full-Stack Java Developer | Experience at HCLTech and Siemens";
  }

  // Cursor spotlight on skill cards and stats (desktop only)
  if (finePointer && !reduceMotion) {
    $$(".skills, .stat").forEach((card) => {
      card.classList.add("spotlight");
      card.addEventListener("mousemove", (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", event.clientX - rect.left + "px");
        card.style.setProperty("--my", event.clientY - rect.top + "px");
      });
    });
  }

  // VanillaTilt subtle 3D tilt on stats and timeline cards (desktop only)
  if (typeof VanillaTilt !== "undefined" && finePointer && !reduceMotion) {
    VanillaTilt.init($$(".stat, .tl-card"), { max: 4, speed: 500, scale: 1.01 });
  }

  // Stat counters: show final values immediately if GSAP is unavailable
  function formatStat(el, value) {
    const decimals = parseInt(el.dataset.decimals, 10) || 0;
    el.textContent = value.toFixed(decimals) + (el.dataset.suffix || "");
  }

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined" || reduceMotion) {
    $$("[data-count]").forEach((el) => formatStat(el, parseFloat(el.dataset.count)));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Hero entrance
  const hasPreloader = !!document.getElementById("preloader");
  const intro = gsap.timeline({ defaults: { ease: "power3.out" }, paused: hasPreloader });
  if (hasPreloader) {
    window.addEventListener("preloader-done", () => intro.play(), { once: true });
    setTimeout(() => intro.play(), 9000);
  }
  intro
    .from(".img-container1 .col-md-3", { x: -90, opacity: 0, duration: 1 })
    .from(".profile-image", { rotation: -360, duration: 1.6, ease: "power2.out", clearProps: "rotation" }, "<")
    .from(".glowing-text", { x: 90, opacity: 0, duration: 1 }, "<0.1")
    .from("#about .cta-btn", { y: 30, opacity: 0, duration: 0.6, stagger: 0.12, clearProps: "all" }, "-=0.2");

  // Counting numbers
  $$("[data-count]").forEach((el) => {
    const counter = { value: 0 };
    gsap.to(counter, {
      value: parseFloat(el.dataset.count),
      duration: 2,
      ease: "power2.out",
      onUpdate: () => formatStat(el, counter.value),
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  });

  // Timeline line draws while scrolling
  $$(".timeline").forEach((timeline) => {
    gsap.fromTo(
      timeline,
      { "--tl": 0 },
      {
        "--tl": 1,
        ease: "none",
        scrollTrigger: { trigger: timeline, start: "top 75%", end: "bottom 70%", scrub: true },
      }
    );
  });

  // Magnetic call-to-action buttons (desktop only)
  if (finePointer) {
    $$(".cta-btn").forEach((btn) => {
      btn.addEventListener("mousemove", (event) => {
        const rect = btn.getBoundingClientRect();
        gsap.to(btn, {
          x: (event.clientX - rect.left - rect.width / 2) * 0.25,
          y: (event.clientY - rect.top - rect.height / 2) * 0.35,
          duration: 0.3,
        });
      });
      btn.addEventListener("mouseleave", () => gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" }));
    });
  }
})();

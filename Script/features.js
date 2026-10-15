// Feature layer: GSAP preloader, cursor, marquee, split headings, AI chat, job fit analyzer, auto showcase
(function () {
  "use strict";

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = typeof gsap !== "undefined";
  const animate = hasGsap && !reduce;
  const hasScrollTrigger = hasGsap && typeof ScrollTrigger !== "undefined";

  if (hasGsap && typeof ScrollToPlugin !== "undefined") gsap.registerPlugin(ScrollToPlugin);

  /* Preloader */
  const preloader = $("#preloader");
  if (preloader) {
    const done = () => window.dispatchEvent(new Event("preloader-done"));
    if (animate) {
      const counter = { n: 0 };
      const percent = $("#pl-percent");
      const bar = $("#pl-bar");
      const intro = gsap
        .timeline({ onComplete: () => preloader.remove() })
        .from(".pl-photo", { scale: 0.4, opacity: 0, duration: 0.8, ease: "back.out(1.6)" })
        .to(".pl-photo", { rotation: 720, duration: 3.4, ease: "power2.inOut" }, 0)
        .from(".pl-name", { y: 20, opacity: 0, duration: 0.6 }, 0.5)
        .to(".pl-line", { scaleX: 1, duration: 0.8, ease: "power2.inOut" }, 1)
        .from(".pl-inner p, .pl-progress, .pl-percent, .pl-skip", { opacity: 0, y: 10, duration: 0.5, stagger: 0.1 }, 1.2)
        .to(counter, {
          n: 100,
          duration: 3.2,
          ease: "power1.inOut",
          onUpdate: () => {
            const value = Math.round(counter.n);
            percent.textContent = value + "%";
            bar.style.width = value + "%";
          },
        }, 0.3)
        .to(".pl-inner", { opacity: 0, y: -20, duration: 0.4 }, 3.9)
        .add(done)
        .to(preloader, { yPercent: -100, duration: 0.8, ease: "power3.inOut" });
      $("#pl-skip").addEventListener("click", () => intro.timeScale(6));
    } else {
      preloader.remove();
      done();
    }
  }

  /* Custom cursor */
  if (animate && fine) {
    const dot = $("#cursor-dot");
    const ring = $("#cursor-ring");
    const ringX = gsap.quickTo(ring, "x", { duration: 0.4, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.4, ease: "power3" });
    window.addEventListener("mousemove", (event) => {
      document.body.classList.add("custom-cursor");
      gsap.set(dot, { x: event.clientX, y: event.clientY });
      ringX(event.clientX);
      ringY(event.clientY);
    });
    document.addEventListener("mouseover", (event) => {
      ring.classList.toggle("is-active", !!event.target.closest("a, button, textarea, input, .tl-card, .skills"));
    });
    document.addEventListener("mouseleave", () => document.body.classList.remove("custom-cursor"));
  }

  /* Technology marquee built from the skill cards */
  const track = $(".marquee-track");
  if (track) {
    const seen = new Set();
    const items = [];
    $$("#skillset .skill").forEach((skill) => {
      const label = skill.querySelector("p").textContent.trim();
      if (seen.has(label) || items.length >= 36) return;
      seen.add(label);
      const item = document.createElement("div");
      item.className = "marquee-item";
      const icon = skill.querySelector("img, i");
      if (icon) item.appendChild(icon.cloneNode(true));
      const text = document.createElement("span");
      text.textContent = label;
      item.appendChild(text);
      items.push(item);
    });
    track.append(...items, ...items.map((item) => item.cloneNode(true)));

    if (animate) {
      const loop = gsap.to(track, { xPercent: -50, duration: 50, ease: "none", repeat: -1 });
      track.addEventListener("mouseenter", () => gsap.to(loop, { timeScale: 0.2, duration: 0.5 }));
      track.addEventListener("mouseleave", () => gsap.to(loop, { timeScale: 1, duration: 0.5 }));
    }
  }

  /* Click the profile photo to spin it a full turn */
  const profilePhoto = $(".profile-image");
  if (animate && profilePhoto) {
    profilePhoto.addEventListener("click", () => {
      if (gsap.isTweening(profilePhoto)) return;
      gsap.fromTo(profilePhoto, { rotation: 0 }, { rotation: 360, duration: 1.2, ease: "power2.inOut", clearProps: "rotation" });
    });
  }

  /* Live GitHub repositories, fetched when the section scrolls into view */
  const repoGrid = $("#repo-grid");
  if (repoGrid) {
    const showNote = (text) => {
      repoGrid.innerHTML = "";
      const note = document.createElement("p");
      note.className = "repo-note";
      note.textContent = text;
      repoGrid.appendChild(note);
    };
    const loadRepos = () => {
      fetch("https://github.com/Sourabhkush123?tab=repositories?sort=updated&per_page=6")
        .then((response) => (response.ok ? response.json() : Promise.reject(new Error(response.status))))
        .then((repos) => {
          const list = repos.filter((repo) => !repo.fork);
          if (!list.length) return showNote("No public repositories to show yet.");
          repoGrid.innerHTML = "";
          list.forEach((repo) => {
            const card = document.createElement("a");
            card.className = "repo-card";
            card.href = repo.html_url;
            card.target = "_blank";
            card.rel = "noopener noreferrer";
            const title = document.createElement("h4");
            title.textContent = repo.name;
            const desc = document.createElement("p");
            desc.textContent = repo.description || "No description provided.";
            const meta = document.createElement("span");
            meta.textContent = [repo.language, repo.stargazers_count + " stars"].filter(Boolean).join(" \u00b7 ");
            card.append(title, desc, meta);
            repoGrid.appendChild(card);
          });
        })
        .catch(() => showNote("Could not load repositories right now. Use the button below to browse them on GitHub."));
    };
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          loadRepos();
        }
      }, { rootMargin: "200px" });
      observer.observe(repoGrid);
    } else {
      loadRepos();
    }
  }

  /* Footer actions */
  const footerStatus = $("#footer-status");
  const footerNote = (message) => {
    if (!footerStatus) return;
    footerStatus.textContent = message;
    clearTimeout(footerNote.timer);
    footerNote.timer = setTimeout(() => (footerStatus.textContent = ""), 2000);
  };
  const copyEmail = $("#footer-copy-email");
  if (copyEmail) {
    copyEmail.addEventListener("click", () => {
      const email = "sourabhkushwaha0701@gmail.com";
      if (!navigator.clipboard) {
        window.location.href = "mailto:" + email;
        return;
      }
      navigator.clipboard.writeText(email).then(
        () => footerNote("Email copied"),
        () => footerNote(email)
      );
    });
  }
  const footerTop = $("#footer-top");
  if (footerTop) {
    footerTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));
  }

  /* Featured project filters */
  const projectFilters = $$(".project-filter");
  const projectCards = $$("#featured [data-project-category]");
  const projectStatus = $("#featured-project-status");
  if (projectFilters.length && projectCards.length) {
    const filterNames = { all: "all", ai: "Generative AI", fullstack: "full-stack", automation: "automation" };
    projectFilters.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        let visibleCount = 0;
        projectFilters.forEach((filterButton) => {
          const isActive = filterButton === button;
          filterButton.classList.toggle("is-active", isActive);
          filterButton.setAttribute("aria-pressed", String(isActive));
        });
        projectCards.forEach((card) => {
          card.hidden = filter !== "all" && card.dataset.projectCategory !== filter;
          if (!card.hidden) visibleCount += 1;
        });
        if (projectStatus) {
          const projectCount = `${visibleCount} project${visibleCount === 1 ? "" : "s"}`;
          projectStatus.textContent = filter === "all"
            ? `Showing all ${projectCount}.`
            : `${filterNames[filter] || "Selected"}: ${projectCount}.`;
        }
      });
    });
  }

  /* Split-text section headings and timeline dots */
  if (animate && hasScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    $$("#skillset h2, #experience h2, #education h2, #ai-lab h2, #ai-orbit h2, #rag-lab h2, #stack-orbit h2, #neural h2, #semantic h2").forEach((heading) => {
      const text = heading.textContent;
      ScrollTrigger.create({
        trigger: heading,
        start: "top 88%",
        once: true,
        onEnter: () => {
          heading.setAttribute("aria-label", text);
          heading.innerHTML = Array.from(text)
            .map((c) => '<span class="split-char" aria-hidden="true">' + (c === " " ? "&nbsp;" : c === "&" ? "&amp;" : c) + "</span>")
            .join("");
          gsap.from(heading.children, {
            yPercent: 110,
            opacity: 0,
            duration: 0.7,
            stagger: 0.03,
            ease: "back.out(1.7)",
            onComplete: () => {
              heading.textContent = text;
              heading.removeAttribute("aria-label");
            },
          });
        },
      });
    });

    $$(".tl-dot").forEach((dot) => {
      gsap.from(dot, {
        scale: 0,
        duration: 0.6,
        ease: "back.out(2.5)",
        scrollTrigger: { trigger: dot, start: "top 85%", once: true },
      });
    });
  }

  /* AI chat assistant: local keyword retrieval over resume facts */
  const KB = [
    { keys: ["hi", "hello", "hey", "hii", "namaste"], answer: "Hi! I'm Sourabh portfolio assistant. Ask me about his experience, projects, skills, education or how to contact him." },
    { keys: ["who", "about", "introduce", "yourself", "Sourabh", "summary", "profile"], answer: "Sourabh Kushwaha is a Full-Stack Java Developer and B.Tech (Computer Science Engineering Learning) graduate with experience at Shrma Computer Academy and Pankaj Sir Academy. He works with Java, Spring Boot, React, Python and Generative AI." },
    { keys: ["experience", "work", "worked", "job", "career", "company", "companies", "employment", "employer"], answer: "Sourabh has worked at two companies: Shrma Computer Academy (Automation Engineer on the LIMS/ESP project) and Pankaj Sir Academy (currently building Generative AI projects: CRISP AI and Personal AI Manager). He also completed a Java Developer internship at Sharma Computer Academy (Aug-Oct 2025)." },
    { keys: ["SCA", "Shrma Computer Academy", "lims", "esp", "webdriverio", "webdriver", "automation engineer"], answer: "At Shrma Computer Academy he worked as an Automation Engineer on the LIMS/ESP project, using TypeScript, WebdriverIO, the Axios library and Postman." },
    { keys: ["Pankaj Sir Academy", "crisp", "personal ai", "current", "currently", "mcp"], answer: "At Pankaj Sir Academy he is currently working on two projects. CRISP AI uses Python, Generative AI, RAG, Streamlit and a vector database. Personal AI Manager uses the same stack plus an MCP service, a FastAPI backend and an HTML, CSS and JavaScript frontend." },
    { keys: ["project", "projects", "built", "portfolio"], answer: "Featured projects: HireSense (AI resume screening), GadgetHub (e-commerce), BlogHub (blogging platform), Online Voting, Swift Cart (e-commerce with React and Spring Boot) and Krishi Mandal (farming application). The Projects section also has 15+ front-end apps hosted on Netlify." },
    { keys: ["swift", "swiftcart", "swift cart"], answer: "Swift Cart is an e-commerce application built with Spring, Spring Boot, REST API, React and MySQL." },
    { keys: ["krishi", "mandal", "farming", "farmer"], answer: "Krishi Mandal is a farming application built with Spring, Spring Boot, React and REST API." },
    { keys: ["hiresense", "hiresence", "resume screening"], answer: "HireSense is an AI-driven resume screening platform. Sourabh contributed to it during his internship, building backend services with Advanced Java, Servlets, JDBC and MySQL." },
    { keys: ["gadgethub", "gadget", "ecommerce", "e-commerce"], answer: "GadgetHub is an e-commerce application built with Java, JEE, JDBC, JSP, MySQL and Bootstrap, with secure payments, order tracking, reviews and recommendations." },
    { keys: ["bloghub", "blog", "blogging"], answer: "BlogHub is a full-stack blogging platform built with Spring Boot, Spring REST API, MySQL and Bootstrap, with authentication, blog management and comments." },
    { keys: ["voting", "vote", "election"], answer: "The Online Voting Application uses Spring Boot, Spring Data JPA, REST API and MySQL, with secure voter authentication, real-time vote tracking and result generation." },
    { keys: ["generative", "genai", "rag", "llm", "vector", "fastapi", "streamlit", "ai", "artificial intelligence"], answer: "Sourabh builds Generative AI applications with Python: RAG over vector databases, Streamlit and FastAPI interfaces and an MCP service. He applies this at Pankaj Sir Academy in CRISP AI and Personal AI Manager." },
    { keys: ["skill", "skills", "tech", "technology", "technologies", "stack", "language", "languages", "know"], answer: "Core skills: Java, Spring Boot, Spring MVC, Spring Data JPA, REST APIs, Microservices, MySQL, React, JavaScript, TypeScript, Python, Generative AI, and test automation (WebdriverIO, Selenium, TestNG, Postman). See the Skillset section for the full list." },
    { keys: ["java", "spring", "backend", "boot", "microservices", "api", "apis", "rest"], answer: "On the backend Sourabh works with Java, Spring Core, Spring Boot, Spring MVC, Spring Data JPA, JDBC, Servlets/JSP, REST APIs, Microservices and MySQL." },
    { keys: ["frontend", "front-end", "react", "html", "css", "javascript", "typescript", "ui"], answer: "On the frontend he uses HTML, CSS, JavaScript, TypeScript, Bootstrap and React.js." },
    { keys: ["test", "testing", "automation", "selenium", "testng", "junit", "cucumber", "postman", "axios"], answer: "For test automation he uses TypeScript with WebdriverIO, Axios and Postman, plus Selenium, TestNG, JUnit and Cucumber." },
    { keys: ["education", "degree", "college", "btech", "b.tech", "cgpa", "study", "studied", "university", "school", "graduate"], answer: "B.Tech in Computer Science Engineering Learning (2022-2026) from Vidhyapeeth Institute of Technology and Science, Bhopal, with a CGPA of 7.80/10." },
    { keys: ["certificate", "certification", "certifications", "certified", "ibm", "servicenow"], answer: "He is an IBM-certified Java Fundamentals professional and is ServiceNow certified. The ServiceNow certificate is linked in the Education and Certification section." },
    { keys: ["achievement", "achievements", "coding", "leetcode", "codechef", "competition", "competitions", "problems", "dsa", "won", "winner", "hackerrank"], answer: "He has solved 500+ algorithmic problems across LeetCode, CodeChef, HackerRank and GeeksforGeeks, and won 15 first places and 5 second places in coding and web development competitions." },
    { keys: ["intern", "internship", "sca", "sharma"], answer: "He was a Java Developer Intern at Sharma Computer Academy (Aug-Oct 2025), contributing to HireSense with Advanced Java, Servlets, JDBC and MySQL." },
    { keys: ["contact", "email", "mail", "reach", "hire", "linkedin", "github", "connect", "message"], answer: "You can reach Sourabh through the Contact section, on LinkedIn or GitHub, or by email at sourabhkushwaha0701@gmail.com" },
    { keys: ["resume", "cv", "download"], answer: "Use the Download Resume button at the top of the page, or the Resume link in the navigation bar." },
    { keys: ["thanks", "thank", "bye"], answer: "You're welcome! Feel free to ask anything else about Sourabh." },
  ];

  const FALLBACK = "I can answer questions about Sourabh experience, projects, skills, education, certifications and contact details. Try one of the suggestions below.";
  const SUGGESTIONS = ["Experience", "Projects", "Skills", "Generative AI", "Education", "Contact"];
  window.PORTFOLIO_KB = KB;
  window.PORTFOLIO_FALLBACK = FALLBACK;
  const NEXT = {
    experience: ["Shrma Computer Academy", "Pankaj Sir Academy", "Internship"],
    SCA: ["Pankaj Sir Academy", "Skills", "Projects"],
    Pankaj Sir Academy: ["Generative AI", "Shrma Computer Academy", "Projects"],
    project: ["Swift Cart", "Krishi Mandal", "HireSense", "GadgetHub"],
    swift: ["Krishi Mandal", "Backend", "Frontend"],
    krishi: ["Swift Cart", "Backend", "Frontend"],
    generative: ["Pankaj Sir Academy", "Projects", "Skills"],
    skill: ["Backend", "Frontend", "Test automation", "Generative AI"],
    java: ["Frontend", "Projects", "Experience"],
    education: ["Certifications", "Achievements", "Experience"],
    certificate: ["Achievements", "Education", "Contact"],
    achievement: ["Education", "Projects", "Contact"],
    contact: ["Resume", "Experience", "Projects"],
    who: ["Experience", "Skills", "Education"],
  };

  const panel = $("#chat-panel");
  const messages = $("#chat-messages");
  const chipBox = $("#chat-chips");
  const form = $("#chat-form");
  const input = $("#chat-input");

  function findAnswer(question) {
    const text = question.toLowerCase().replace(/[^a-z0-9+#.\-\s/]/g, " ");
    const tokens = new Set();
    text.split(/\s+/).forEach((word) => {
      if (!word) return;
      tokens.add(word);
      tokens.add(word.replace(/s$/, ""));
    });
    let best = null;
    let bestScore = 0;
    KB.forEach((entry) => {
      let score = 0;
      entry.keys.forEach((key) => {
        if (/[\s.+#/-]/.test(key)) {
          if (text.includes(key)) score += 3;
        } else if (tokens.has(key)) {
          score += 1;
        }
      });
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    });
    return best;
  }

  let speakAnswers = false;

  function speak(text) {
    if (!speakAnswers || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  function setChips(labels) {
    chipBox.innerHTML = "";
    labels.forEach((label) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.textContent = label;
      chip.addEventListener("click", () => ask(label));
      chipBox.appendChild(chip);
    });
    if (animate) gsap.from(chipBox.children, { y: 8, opacity: 0, duration: 0.3, stagger: 0.05 });
  }

  function addMessage(kind, text) {
    const bubble = document.createElement("div");
    bubble.className = "msg " + kind;
    messages.appendChild(bubble);
    if (kind === "bot" && animate) {
      const progress = { n: 0 };
      gsap.from(bubble, { y: 10, opacity: 0, duration: 0.3 });
      gsap.to(progress, {
        n: text.length,
        duration: Math.min(2.2, text.length * 0.014),
        ease: "none",
        onUpdate: () => {
          bubble.textContent = text.slice(0, Math.round(progress.n));
          messages.scrollTop = messages.scrollHeight;
        },
      });
    } else {
      bubble.textContent = text;
      if (animate) gsap.from(bubble, { y: 10, opacity: 0, duration: 0.3 });
    }
    messages.scrollTop = messages.scrollHeight;
  }

  function ask(question) {
    const clean = question.trim();
    if (!clean) return;
    addMessage("user", clean);
    setTimeout(() => {
      const entry = findAnswer(clean);
      const answer = entry ? entry.answer : FALLBACK;
      addMessage("bot", answer);
      speak(answer);
      setChips((entry && NEXT[entry.keys[0]]) || SUGGESTIONS);
    }, animate ? 450 : 0);
  }

  function openChat() {
    panel.hidden = false;
    if (animate) gsap.fromTo(panel, { scale: 0.85, opacity: 0, y: 20 }, { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.6)" });
    if (!messages.children.length) addMessage("bot", KB[0].answer);
    input.focus();
  }

  function closeChat() {
    if (animate) {
      gsap.to(panel, { scale: 0.9, opacity: 0, duration: 0.2, onComplete: () => (panel.hidden = true) });
    } else {
      panel.hidden = true;
    }
  }

  if (panel) {
    setChips(SUGGESTIONS);
    $("#chat-toggle").addEventListener("click", () => (panel.hidden ? openChat() : closeChat()));
    $("#chat-close").addEventListener("click", closeChat);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      ask(input.value);
      input.value = "";
    });
    $$("[data-open-chat]").forEach((link) =>
      link.addEventListener("click", (event) => {
        event.preventDefault();
        if (panel.hidden) openChat();
      })
    );

    // Voice input and read-aloud, using the browser's built-in speech APIs
    const speakBtn = $("#chat-speak");
    speakBtn.addEventListener("click", () => {
      speakAnswers = !speakAnswers;
      speakBtn.classList.toggle("on", speakAnswers);
      if (!speakAnswers && "speechSynthesis" in window) window.speechSynthesis.cancel();
    });
    if (!("speechSynthesis" in window)) speakBtn.remove();

    const micBtn = $("#chat-mic");
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (Recognition) {
      const recognizer = new Recognition();
      recognizer.lang = "en-IN";
      recognizer.interimResults = false;
      recognizer.onresult = (event) => {
        input.value = event.results[0][0].transcript;
        ask(input.value);
        input.value = "";
      };
      recognizer.onend = () => micBtn.classList.remove("on");
      recognizer.onerror = () => micBtn.classList.remove("on");
      micBtn.addEventListener("click", () => {
        if (micBtn.classList.contains("on")) {
          recognizer.stop();
          return;
        }
        micBtn.classList.add("on");
        recognizer.start();
      });
    } else {
      micBtn.remove();
    }
  }

  /* AI job fit analyzer: keyword matching against my skills */
  const HAVE = [
    ["Java", ["java"]],
    ["Spring Framework", ["spring", "spring boot", "springboot", "spring mvc", "spring core"]],
    ["Spring Data JPA", ["spring data jpa", "jpa"]],
    ["REST APIs", ["rest api", "rest apis", "restful", "restful api"]],
    ["Microservices", ["microservices", "microservice"]],
    ["MySQL", ["mysql"]],
    ["SQL", ["sql"]],
    ["JDBC", ["jdbc"]],
    ["Servlets / JSP", ["servlet", "servlets", "jsp"]],
    ["JavaScript", ["javascript"]],
    ["TypeScript", ["typescript"]],
    ["React", ["react", "reactjs", "react.js"]],
    ["HTML / CSS", ["html", "css", "html5", "css3"]],
    ["Bootstrap", ["bootstrap"]],
    ["Python", ["python"]],
    ["C++", ["c++"]],
    ["C#", ["c#"]],
    ["Git / GitHub", ["git", "github"]],
    ["Maven", ["maven"]],
    ["Docker", ["docker"]],
    ["CI/CD", ["ci/cd", "cicd", "jenkins"]],
    ["Selenium", ["selenium"]],
    ["TestNG / JUnit", ["testng", "junit"]],
    ["Cucumber", ["cucumber"]],
    ["WebdriverIO", ["webdriverio", "webdriver.io"]],
    ["Test Automation", ["test automation", "automation testing", "automation engineer", "qa automation"]],
    ["Postman", ["postman", "api testing"]],
    ["Generative AI", ["generative ai", "genai", "gen ai", "llm", "llms", "large language model", "large language models"]],
    ["RAG", ["rag", "retrieval augmented generation", "retrieval-augmented generation"]],
    ["Vector Databases", ["vector db", "vector database", "vector databases", "embeddings"]],
    ["MCP", ["mcp", "model context protocol"]],
    ["FastAPI", ["fastapi"]],
    ["Streamlit", ["streamlit"]],
    ["Machine Learning", ["machine learning", "ml"]],
    ["DSA", ["dsa", "data structures", "algorithms"]],
    ["OOP", ["oop", "oops", "object oriented", "object-oriented"]],
    ["DBMS", ["dbms", "database", "databases"]],
    ["Agile", ["agile", "scrum"]],
    ["System Design", ["system design"]],
  ];

  const GAPS = [
    ["AWS", ["aws", "amazon web services"]],
    ["Azure", ["azure"]],
    ["GCP", ["gcp", "google cloud"]],
    ["Kubernetes", ["kubernetes", "k8s"]],
    ["Hibernate", ["hibernate"]],
    ["MongoDB", ["mongodb"]],
    ["PostgreSQL", ["postgresql", "postgres"]],
    ["Kafka", ["kafka"]],
    ["Redis", ["redis"]],
    ["Angular", ["angular"]],
    ["Node.js", ["node.js", "nodejs"]],
    ["Terraform", ["terraform"]],
    [".NET", [".net", "asp.net"]],
    ["Go", ["golang"]],
  ];

  const SAMPLE_JD =
    "We are looking for a Java Backend Developer with strong Spring Boot, REST APIs, Microservices and MySQL experience. " +
    "Knowledge of Docker, CI/CD, AWS and Kubernetes is required. Exposure to Generative AI, RAG and Python is a plus.";

  const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  function detect(list, text) {
    return list
      .filter(([, aliases]) =>
        aliases.some((alias) => new RegExp("(^|[^a-z0-9+#])" + escapeRegex(alias) + "(?![a-z0-9+#])").test(text))
      )
      .map(([name]) => name);
  }

  function renderChips(container, names, className) {
    container.innerHTML = "";
    const list = names.length ? names : ["None detected"];
    return list.map((name) => {
      const chip = document.createElement("span");
      chip.className = "chip " + (names.length ? className : "none");
      chip.textContent = name;
      container.appendChild(chip);
      return chip;
    });
  }

  const jdInput = $("#jd-input");
  if (jdInput) {
    const result = $("#jd-result");
    const fg = $("#gauge-fg");
    const num = $("#gauge-num");
    const CIRCUMFERENCE = 339.292;

    $("#jd-sample").addEventListener("click", () => {
      jdInput.value = SAMPLE_JD;
      $("#jd-analyze").click();
    });

    $("#jd-analyze").addEventListener("click", () => {
      const text = jdInput.value.toLowerCase();
      if (!text.trim()) {
        if (animate) gsap.fromTo(jdInput, { x: -10 }, { x: 0, duration: 0.6, ease: "elastic.out(1, 0.3)" });
        jdInput.focus();
        return;
      }
      const matched = detect(HAVE, text);
      const gaps = detect(GAPS, text);
      const total = matched.length + gaps.length;
      const percent = total ? Math.round((matched.length / total) * 100) : 0;

      let verdict = "No recognizable technical keywords found. Try pasting a longer description.";
      if (total) {
        verdict =
          percent >= 80 ? "Strong match for this role" : percent >= 60 ? "Good match with a few gaps" : "Partial match, with skills to pick up";
      }

      result.hidden = false;
      $("#jd-verdict").textContent = verdict;
      const chipEls = renderChips($("#jd-matched"), matched, "").concat(renderChips($("#jd-gaps"), gaps, "gap"));

      if (animate) {
        const counter = { value: 0 };
        gsap.fromTo(fg, { strokeDashoffset: CIRCUMFERENCE }, { strokeDashoffset: CIRCUMFERENCE * (1 - percent / 100), duration: 1.4, ease: "power3.out" });
        gsap.to(counter, { value: percent, duration: 1.4, ease: "power3.out", onUpdate: () => (num.textContent = Math.round(counter.value)) });
        gsap.from(chipEls, { scale: 0.5, opacity: 0, duration: 0.4, stagger: 0.04, delay: 0.3, ease: "back.out(2)" });
        gsap.from(result, { y: 20, opacity: 0, duration: 0.5 });
      } else {
        fg.style.strokeDashoffset = CIRCUMFERENCE * (1 - percent / 100);
        num.textContent = percent;
      }
    });
  }

  /* Auto showcase: scrolls through the sections, handy for screen recordings */
  const showcaseBtn = $("#showcase-btn");
  let showcase = null;

  function stopShowcase() {
    if (!showcase) return;
    showcase.kill();
    showcase = null;
    document.documentElement.style.scrollBehavior = "";
    document.body.classList.remove("showcasing");
    showcaseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    showcaseBtn.setAttribute("aria-label", "Play auto showcase");
    ["wheel", "touchstart", "keydown"].forEach((name) => window.removeEventListener(name, stopShowcase));
  }

  function startShowcase() {
    const stops = ["#stats", "#experience", "#education", "#skillset", "#featured", "#services", "#github-feed", "#ai-orbit", "#stack-orbit", "#neural", "#semantic", "#rag-lab", "#ai-lab", "#faq", "#projects", "#cntct"]
      .map((selector) => $(selector))
      .filter(Boolean);
    document.documentElement.style.scrollBehavior = "auto";
    document.body.classList.add("showcasing");
    showcaseBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
    showcaseBtn.setAttribute("aria-label", "Stop auto showcase");
    if (panel && !panel.hidden) closeChat();
    window.scrollTo(0, 0);

    showcase = gsap.timeline({ onComplete: stopShowcase });
    showcase.to({}, { duration: 1.5 });
    stops.forEach((el) => {
      showcase.to(window, { scrollTo: { y: el, offsetY: 100, autoKill: false }, duration: 2.2, ease: "power2.inOut" }).to({}, { duration: 2 });
    });
    showcase.to(window, { scrollTo: { y: 0, autoKill: false }, duration: 3, ease: "power2.inOut" });
    ["wheel", "touchstart", "keydown"].forEach((name) => window.addEventListener(name, stopShowcase, { passive: true }));
  }

  if (showcaseBtn) {
    if (hasGsap && typeof ScrollToPlugin !== "undefined") {
      showcaseBtn.addEventListener("click", () => (showcase ? stopShowcase() : startShowcase()));
    } else {
      showcaseBtn.remove();
    }
  }

  /* AI pitch generator: template-based, tailored by role and any analyzed job description */
  const pitchBtn = $("#pitch-generate");
  if (pitchBtn) {
    const output = $("#pitch-output");
    const copyBtn = $("#pitch-copy");

    pitchBtn.addEventListener("click", () => {
      const company = $("#pitch-company").value.trim();
      const role = $("#pitch-role").value.trim() || "Software Developer";
      const source = ($("#jd-input").value + " " + role).toLowerCase();
      let skills = detect(HAVE, source).slice(0, 6);
      if (!skills.length) skills = ["Java", "Spring Framework", "REST APIs", "Microservices", "Generative AI"];

      let highlight =
        "I build full-stack applications with Spring Boot, REST APIs, React and MySQL, including Swift Cart and Krishi Mandal, and I have worked at Shrma Computer Academy and Pankaj Sir Academy.";
      if (/\b(ai|ml|genai|generative|llm|machine learning|rag)\b/.test(role.toLowerCase())) {
        highlight =
          "At Pankaj Sir Academy I am building Generative AI applications with Python, RAG, vector databases, FastAPI and an MCP service (CRISP AI and Personal AI Manager).";
      } else if (/\b(qa|test|testing|automation|sdet)\b/.test(role.toLowerCase())) {
        highlight =
          "At Shrma Computer Academy I worked as an Automation Engineer on the LIMS/ESP project using TypeScript, WebdriverIO, Axios and Postman.";
      }

      const pitch =
        "Hi " + (company ? company + " team" : "there") + ",\n\n" +
        "I'm Sourabh Kushwaha, a Full-Stack Java Developer with a B.Tech in Computer Science Engineering Learning, and I'm excited about the " +
        role + " opportunity" + (company ? " at " + company : "") + ".\n\n" +
        highlight + "\n\n" +
        "Relevant strengths: " + skills.join(", ") + ".\n\n" +
        "I'd welcome the chance to discuss how I can contribute. You can reach me at sourabhkushwaha0701@gmail.com or linkedin.com/in/Sourabh-kushwaha-02a787276.\n\n" +
        "Best regards,\nSourabh Kushwaha";

      output.hidden = false;
      copyBtn.hidden = false;
      output.dataset.text = pitch;
      if (animate) {
        const progress = { n: 0 };
        gsap.to(progress, {
          n: pitch.length,
          duration: Math.min(3, pitch.length * 0.006),
          ease: "none",
          onUpdate: () => (output.textContent = pitch.slice(0, Math.round(progress.n))),
        });
      } else {
        output.textContent = pitch;
      }
    });

    copyBtn.addEventListener("click", () => {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(output.dataset.text || "").then(() => {
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
        setTimeout(() => (copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy'), 1800);
      });
    });
  }

  /* Smart search palette (Ctrl+K) */
  const cmdk = $("#cmdk");
  if (cmdk) {
    const cmdInput = $("#cmdk-input");
    const cmdList = $("#cmdk-list");
    const goTo = (selector) => () => {
      const el = $(selector);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const open = (url) => () => window.open(url, "_blank", "noopener");

    const COMMANDS = [
      { label: "About", icon: "fa-solid fa-user", hint: "Section", words: "home top intro profile", run: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
      { label: "Experience", icon: "fa-solid fa-briefcase", hint: "Section", words: "Shrma Computer Academy Pankaj Sir Academy work career crisp lims", run: goTo("#experience") },
      { label: "Education & Certification", icon: "fa-solid fa-graduation-cap", hint: "Section", words: "btech ibm servicenow degree cgpa", run: goTo("#education") },
      { label: "Skillset", icon: "fa-solid fa-layer-group", hint: "Section", words: "java spring react python skills technologies", run: goTo("#skillset") },
      { label: "Featured Projects", icon: "fa-solid fa-diagram-project", hint: "Section", words: "swift cart krishi hiresense gadgethub bloghub voting", run: goTo("#featured") },
      { label: "What I Can Build", icon: "fa-solid fa-cubes", hint: "Section", words: "services offer hire genai fullstack automation", run: goTo("#services") },
      { label: "Latest on GitHub", icon: "fa-brands fa-github", hint: "Section", words: "repositories repos live feed", run: goTo("#github-feed") },
      { label: "FAQ", icon: "fa-solid fa-circle-question", hint: "Section", words: "questions answers help", run: goTo("#faq") },
      { label: "My Generative AI Stack", icon: "fa-solid fa-atom", hint: "AI tool", words: "orbit python rag vector fastapi streamlit mcp llm", run: goTo("#ai-orbit") },
      { label: "RAG Pipeline Demo", icon: "fa-solid fa-diagram-project", hint: "AI tool", words: "retrieval augmented generation embedding vector search animation", run: goTo("#rag-lab") },
      { label: "Full-Stack Orbit", icon: "fa-solid fa-circle-notch", hint: "AI tool", words: "spring react mysql docker git orbit", run: goTo("#stack-orbit") },
      { label: "Neural Network in Motion", icon: "fa-solid fa-network-wired", hint: "AI tool", words: "forward pass layers machine learning animation", run: goTo("#neural") },
      { label: "Semantic Skill Map", icon: "fa-solid fa-map", hint: "AI tool", words: "embeddings vector space skills neighbours", run: goTo("#semantic") },
      { label: "AI Job Fit Analyzer", icon: "fa-solid fa-wand-magic-sparkles", hint: "AI tool", words: "ai job description match pitch generator", run: goTo("#ai-lab") },
      { label: "Web Projects", icon: "fa-solid fa-code", hint: "Section", words: "netlify calculator quiz clock", run: goTo("#projects") },
      { label: "Contact", icon: "fa-solid fa-envelope", hint: "Section", words: "email hire reach", run: goTo("#cntct") },
      { label: "Ask the AI assistant", icon: "fa-solid fa-robot", hint: "AI tool", words: "chat question voice", run: () => panel && panel.hidden && openChat() },
      { label: "Play auto showcase", icon: "fa-solid fa-play", hint: "Action", words: "record video scroll tour", run: () => showcaseBtn && showcaseBtn.click() },
      { label: "Change theme", icon: "fa-solid fa-palette", hint: "Action", words: "colour color", run: () => $("#changeTheme").click() },
      { label: "Download resume", icon: "fa-solid fa-download", hint: "Link", words: "cv pdf", run: open("Skillset/Sourabh%20KUSHWAHA%20RESUME-1.pdf") },
      { label: "LinkedIn profile", icon: "fa-brands fa-linkedin", hint: "Link", words: "connect", run: open("https://www.linkedin.com/in/Sourabh-kushwaha-02a787276") },
      { label: "GitHub profile", icon: "fa-brands fa-github", hint: "Link", words: "code repositories", run: open("https://github.com/Sourabh-1234") },
      { label: "ServiceNow certificate", icon: "fa-solid fa-award", hint: "Link", words: "certification", run: open("https://github.com/Sourabh-1234/SERVICENOW-CERTIFICATE") },
    ];

    let shown = [];
    let active = 0;

    function setActive(index) {
      active = index;
      Array.from(cmdList.children).forEach((li, i) => li.classList.toggle("active", i === index));
      const current = cmdList.children[index];
      if (current && current.scrollIntoView) current.scrollIntoView({ block: "nearest" });
    }

    function closePalette() {
      cmdk.hidden = true;
    }

    function choose(index) {
      const command = shown[index];
      if (!command) return;
      closePalette();
      setTimeout(command.run, 150);
    }

    function render() {
      const terms = cmdInput.value.toLowerCase().split(/\s+/).filter(Boolean);
      shown = COMMANDS.filter((command) => {
        const haystack = (command.label + " " + command.words + " " + command.hint).toLowerCase();
        return terms.every((term) => haystack.includes(term));
      });
      cmdList.innerHTML = "";
      if (!shown.length) {
        const empty = document.createElement("li");
        empty.textContent = "No results";
        cmdList.appendChild(empty);
        return;
      }
      shown.forEach((command, index) => {
        const li = document.createElement("li");
        li.innerHTML = '<i class="' + command.icon + '"></i><span></span><small></small>';
        li.children[1].textContent = command.label;
        li.children[2].textContent = command.hint;
        li.addEventListener("click", () => choose(index));
        li.addEventListener("mousemove", () => active !== index && setActive(index));
        cmdList.appendChild(li);
      });
      setActive(0);
      if (animate) gsap.from(cmdList.children, { y: 8, opacity: 0, duration: 0.25, stagger: 0.03 });
    }

    function openPalette() {
      cmdk.hidden = false;
      cmdInput.value = "";
      render();
      if (animate) gsap.fromTo(".cmdk-box", { y: -20, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: "power3.out" });
      cmdInput.focus();
    }

    $("#cmdk-toggle").addEventListener("click", openPalette);
    cmdInput.addEventListener("input", render);
    cmdk.addEventListener("click", (event) => event.target === cmdk && closePalette());
    cmdInput.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive(Math.min(active + 1, shown.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive(Math.max(active - 1, 0));
      } else if (event.key === "Enter") {
        event.preventDefault();
        choose(active);
      }
    });
    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        cmdk.hidden ? openPalette() : closePalette();
      } else if (event.key === "Escape" && !cmdk.hidden) {
        closePalette();
      }
    });
  }
})();

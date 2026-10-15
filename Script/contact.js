// Contact form: validation, delivery to my inbox through FormSubmit, and success/error states
(function () {
  "use strict";

  const form = document.getElementById("contact-form");
  if (!form) return;

  const ENDPOINT = "https://formsubmit.co/ajax/rajnishkushwaha3757@gmail.com";
  const MY_EMAIL = "rajnishkushwaha3757@gmail.com";
  const animate = typeof gsap !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const submitBtn = form.querySelector(".cf-submit");
  const status = form.querySelector(".cf-status");
  const success = document.querySelector(".cf-success");
  const counter = form.querySelector(".cf-count");
  const message = form.elements.message;

  const rules = {
    name: (v) => (v.length < 2 ? "Please enter your name." : ""),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Please enter a valid email address."),
    phone: (v) => (!v || /^[+()\d\s-]{7,20}$/.test(v) ? "" : "Enter a valid phone number or leave it empty."),
    subject: (v) => (v.length < 3 ? "Please add a short subject." : ""),
    message: (v) => (v.length < 10 ? "Please write at least 10 characters." : ""),
  };

  function check(input) {
    const rule = rules[input.name];
    if (!rule) return true;
    const error = rule(input.value.trim());
    const field = input.closest(".cf-field");
    field.classList.toggle("has-error", !!error);
    field.querySelector(".cf-error").textContent = error;
    return !error;
  }

  Object.keys(rules).forEach((name) => {
    const input = form.elements[name];
    input.addEventListener("blur", () => check(input));
    input.addEventListener("input", () => input.closest(".cf-field").classList.contains("has-error") && check(input));
  });

  message.addEventListener("input", () => (counter.textContent = message.value.length + " / 1000"));

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.classList.toggle("is-loading", loading);
    submitBtn.querySelector(".cf-btn-label").lastChild.textContent = loading ? " Sending..." : " Send message";
  }

  function showSuccess(name) {
    document.getElementById("cf-success-text").textContent =
      "Thanks, " + name + "! Your message has reached my inbox and I'll get back to you at the email you provided.";
    form.hidden = true;
    success.hidden = false;
    success.classList.remove("show");
    void success.offsetWidth;
    success.classList.add("show");
    if (animate) gsap.from(success.children, { y: 20, opacity: 0, duration: 0.5, stagger: 0.12, ease: "power3.out" });
  }

  function showError(payload, reason) {
    const body = encodeURIComponent(payload.message + "\n\n" + payload.name + " (" + payload.email + ")");
    status.className = "cf-status error";
    status.innerHTML =
      (reason || "Could not send right now. Please try again, or") + ' <a href="mailto:' + MY_EMAIL + "?subject=" +
      encodeURIComponent(payload.subject) + "&body=" + body + '">email me directly</a>.';
    if (animate) gsap.from(status, { y: 8, opacity: 0, duration: 0.4 });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.className = "cf-status";
    status.textContent = "";

    const invalid = Object.keys(rules)
      .map((name) => form.elements[name])
      .filter((input) => !check(input));
    if (invalid.length) {
      invalid[0].focus();
      if (animate) gsap.fromTo(invalid.map((i) => i.closest(".cf-field")), { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
      return;
    }

    const data = new FormData(form);
    if (data.get("_honey")) return;

    const name = data.get("name").trim();
    const email = data.get("email").trim();
    const phone = data.get("phone").trim() || "Not provided";
    const company = data.get("company").trim();
    const inquiry = data.get("inquiry_type");
    const subject = data.get("subject").trim();
    const sentAt = new Date().toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" });

    // Written as a ready-to-read email so it looks like a normal message in the inbox
    const mailBody =
      "Hi Rajneesh,\n\n" +
      "I'm " + name + (company ? " from " + company : "") + ". I'm reaching out regarding: " + inquiry + ".\n\n" +
      "Subject: " + subject + "\n\n" +
      data.get("message").trim() + "\n\n" +
      "You can reply directly to " + email + (phone !== "Not provided" ? " or call " + phone : "") + ".\n\n" +
      "Best regards,\n" + name + "\n\n" +
      "Sent from your portfolio contact form on " + sentAt + ".";

    const payload = {
      name,
      email,
      phone,
      company: company || "Not provided",
      inquiry_type: inquiry,
      subject,
      message: mailBody,
      _subject: "Portfolio message from " + name + ": " + subject,
      _template: "box",
      _captcha: "false",
      _autoresponse:
        "Hi " + name + ", thank you for contacting Rajneesh Kushwaha. Your message has been received and he will get back to you soon. - Rajneesh Kushwaha (Full-Stack Java Developer)",
    };

    // FormSubmit rejects requests from file:// pages, so the form needs http(s)
    if (location.protocol === "file:") {
      showError(payload, "This page is opened from a file, so the form cannot send. Run it on a local server or the live site, or");
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false || result.success === "false") {
        console.error("Contact form: " + (result.message || response.status));
        throw new Error(result.message || "Request failed");
      }
      showSuccess(payload.name);
      form.reset();
      counter.textContent = "0 / 1000";
    } catch (error) {
      showError(payload);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  });

  success.querySelector(".cf-again").addEventListener("click", () => {
    success.hidden = true;
    form.hidden = false;
    status.textContent = "";
    if (animate) gsap.from(form, { y: 16, opacity: 0, duration: 0.4 });
  });
})();

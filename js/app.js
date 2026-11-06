/* K Explore — client-side application and view renderer. */
(() => {
  "use strict";

  const events = window.K_EXPLORE_EVENTS || [];
  const categories = window.K_EXPLORE_CATEGORIES || [];
  const app = document.getElementById("app");
  const toastRegion = document.getElementById("toast-region");
  const nav = document.getElementById("primary-navigation");
  const menuToggle = document.getElementById("mobile-menu-toggle");
  const themeToggle = document.getElementById("theme-toggle");
  let activeCategory = "All events";
  let searchTerm = "";
  let countdownInterval = null;
  let toastTimeout = null;
  let lastRoute = "";

  const icons = {
    arrow: '<span aria-hidden="true">↗</span>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>',
    calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 10h18"></path></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>',
    ticket: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5V9a3 3 0 0 0 0 6v2.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5V15a3 3 0 0 0 0-6Z"></path><path d="M13 7v2m0 3v2m0 3v.1"></path></svg>'
  };

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function getEvent(id) {
    return events.find((event) => event.id === id);
  }

  function eventDate(event) {
    return new Date(`${event.date}T${event.time}:00+05:30`);
  }

  function formatDate(dateValue, options = {}) {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: options.weekday === false ? undefined : (options.weekday || "short"),
      day: "numeric",
      month: options.month || "short",
      year: options.year === false ? undefined : "numeric",
      timeZone: "Asia/Kolkata"
    }).format(new Date(dateValue));
  }

  function formatEventDate(event, includeWeekday = true) {
    return formatDate(eventDate(event), { weekday: includeWeekday ? "short" : false });
  }

  function formatTime(time) {
    const [hourText, minuteText] = time.split(":");
    const hour = Number(hourText);
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minuteText} ${suffix}`;
  }

  function currencyLabel(price) {
    return price || "Free";
  }

  function renderHeaderState() {
    const count = KExploreStorage.getRegistrations().length;
    const countNode = document.getElementById("registration-count");
    if (countNode) countNode.textContent = String(count);
    const active = currentRoute().path;
    document.querySelectorAll("[data-nav]").forEach((link) => {
      const navKey = link.dataset.nav;
      const isActive = (navKey === "home" && active === "/") ||
        (navKey === "events" && (active === "/events" || active.startsWith("/event/") || active.startsWith("/register/"))) ||
        (navKey === "about" && active === "/about") ||
        (navKey === "registrations" && active === "/my-registrations");
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function currentRoute() {
    const raw = window.location.hash.replace(/^#/, "") || "/";
    const [path, query = ""] = raw.split("?");
    return { path: path || "/", params: new URLSearchParams(query) };
  }

  function navigate(path) {
    window.location.hash = path;
  }

  function closeMobileMenu() {
    nav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
  }

  function showToast(message, type = "success") {
    if (!toastRegion) return;
    window.clearTimeout(toastTimeout);
    toastRegion.innerHTML = `<div class="toast toast-${escapeHTML(type)}" role="status"><span class="toast-mark" aria-hidden="true">${type === "error" ? "!" : "✓"}</span><span>${escapeHTML(message)}</span><button class="toast-close" type="button" aria-label="Dismiss notification">×</button></div>`;
    toastRegion.querySelector(".toast-close")?.addEventListener("click", () => { toastRegion.innerHTML = ""; });
    toastTimeout = window.setTimeout(() => { toastRegion.innerHTML = ""; }, 4200);
  }

  function updateTheme(theme, persist = true) {
    const nextTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    themeToggle.setAttribute("aria-label", nextTheme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    themeToggle.title = nextTheme === "dark" ? "Switch to light theme" : "Switch to dark theme";
    if (persist) KExploreStorage.saveTheme(nextTheme);
  }

  function eventCard(event, compact = false) {
    const dateParts = event.date.split("-");
    const date = new Date(`${event.date}T12:00:00+05:30`);
    const month = new Intl.DateTimeFormat("en", { month: "short", timeZone: "Asia/Kolkata" }).format(date).toUpperCase();
    const day = dateParts[2];
    return `
      <article class="event-card ${compact ? "event-card-compact" : ""}" data-reveal>
        <a class="event-image-link" href="#/event/${escapeHTML(event.id)}" aria-label="View ${escapeHTML(event.title)} details">
          <div class="event-image-wrap">
            <img class="event-image" src="${escapeHTML(event.image)}" alt="${escapeHTML(event.imageAlt)}" loading="lazy">
            <span class="event-category-pill">${escapeHTML(event.category)}</span>
            ${event.featuredLabel ? `<span class="event-featured-pill">${escapeHTML(event.featuredLabel)}</span>` : ""}
            <span class="event-image-arrow" aria-hidden="true">↗</span>
          </div>
        </a>
        <div class="event-card-body">
          <div class="event-date-line"><span class="event-date-block"><b>${escapeHTML(day)}</b><small>${escapeHTML(month)}</small></span><span class="event-card-time">${escapeHTML(formatTime(event.time))}</span></div>
          <h3><a href="#/event/${escapeHTML(event.id)}">${escapeHTML(event.title)}</a></h3>
          <p class="event-card-description">${escapeHTML(event.excerpt)}</p>
          <div class="event-card-location">${icons.pin}<span>${escapeHTML(event.venue)}, ${escapeHTML(event.city)}</span></div>
          <div class="event-card-bottom"><span class="event-price">${escapeHTML(currencyLabel(event.price))}</span><a class="card-detail-button" href="#/event/${escapeHTML(event.id)}">View details <span aria-hidden="true">↗</span></a></div>
          <div class="card-countdown" data-countdown="${escapeHTML(event.id)}"><span class="countdown-dot"></span><span class="countdown-copy">Loading countdown…</span></div>
        </div>
      </article>`;
  }

  function filterEvents() {
    const query = searchTerm.trim().toLowerCase();
    return events.filter((event) => {
      const matchesCategory = activeCategory === "All events" || event.category === activeCategory;
      const searchable = `${event.title} ${event.category} ${event.city} ${event.venue} ${event.excerpt} ${event.description}`.toLowerCase();
      return matchesCategory && (!query || searchable.includes(query));
    }).sort((a, b) => eventDate(a) - eventDate(b));
  }

  function renderEventGrid(container, list, emptyHeading = "No events found", emptyCopy = "Try another search or clear the category filter.") {
    if (!container) return;
    if (!list.length) {
      container.innerHTML = `<div class="empty-state"><span class="empty-state-icon" aria-hidden="true">⌕</span><h3>${escapeHTML(emptyHeading)}</h3><p>${escapeHTML(emptyCopy)}</p><button class="button button-dark" type="button" data-reset-filters>Reset filters</button></div>`;
    } else {
      container.innerHTML = list.map((event) => eventCard(event)).join("");
    }
    observeReveals(container);
    refreshCountdowns();
  }

  function renderFilterControls() {
    return `
      <div class="event-controls">
        <label class="search-field" for="event-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 5 5"></path></svg>
          <input id="event-search" type="search" value="${escapeHTML(searchTerm)}" placeholder="Search events, places, ideas…" autocomplete="off">
          <kbd>⌘ K</kbd>
        </label>
        <button class="button button-outline reset-filters" type="button" data-reset-filters>Reset filters <span aria-hidden="true">↺</span></button>
      </div>
      <div class="filter-row" role="group" aria-label="Filter events by category">
        ${["All events", ...categories.map((category) => category.name)].map((category) => `
          <button class="filter-chip ${activeCategory === category ? "is-active" : ""}" type="button" data-category="${escapeHTML(category)}" aria-pressed="${activeCategory === category}">${escapeHTML(category)}</button>
        `).join("")}
      </div>`;
  }

  function bindFilterControls(gridId, maxDefault = null) {
    const search = document.getElementById("event-search");
    const grid = document.getElementById(gridId);
    const resultCount = document.getElementById("result-count");
    const update = () => {
      let list = filterEvents();
      if (maxDefault && !searchTerm.trim() && activeCategory === "All events") list = list.slice(0, maxDefault);
      renderEventGrid(grid, list);
      if (resultCount) {
        const total = filterEvents().length;
        resultCount.textContent = maxDefault && !searchTerm.trim() && activeCategory === "All events" && total > maxDefault
          ? `Showing ${maxDefault} of ${total} events`
          : `${total} ${total === 1 ? "event" : "events"}`;
      }
    };
    search?.addEventListener("input", (event) => { searchTerm = event.target.value; update(); });
    grid?.addEventListener("click", (event) => { if (event.target.closest("[data-reset-filters]")) resetFilters(); });
    document.querySelectorAll("[data-category]").forEach((button) => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.category;
        document.querySelectorAll("[data-category]").forEach((chip) => {
          const selected = chip.dataset.category === activeCategory;
          chip.classList.toggle("is-active", selected);
          chip.setAttribute("aria-pressed", String(selected));
        });
        update();
      });
    });
    document.querySelectorAll("[data-reset-filters]").forEach((button) => button.addEventListener("click", resetFilters));
    update();
  }

  function resetFilters() {
    activeCategory = "All events";
    searchTerm = "";
    const route = currentRoute();
    if (route.path === "/events" && route.params.has("category")) {
      window.history.replaceState(null, "", "#/events");
    }
    renderCurrentRoute();
  }

  function renderHome() {
    activeCategory = "All events";
    app.innerHTML = `
      <section class="hero-section shell">
        <div class="hero-copy" data-reveal>
          <div class="eyebrow"><span class="eyebrow-line"></span> FIND YOUR NEXT EXPERIENCE</div>
          <h1>Make room for<br><span class="headline-accent">the good stuff.</span></h1>
          <p class="hero-description">The talks that spark an idea. The music that moves you. The people you haven't met yet. Find it all, right here.</p>
          <div class="hero-actions"><a class="button button-coral" href="#/events">Explore events ${icons.arrow}</a><a class="quiet-link" href="#/about">Get to know us <span aria-hidden="true">↗</span></a></div>
          <div class="hero-social-proof"><div class="avatar-stack" aria-hidden="true"><span>R</span><span>A</span><span>M</span><span>+</span></div><div><strong>Find your kind of crowd.</strong><small>Curated experiences, made for real life.</small></div></div>
        </div>
        <div class="hero-visual" data-reveal>
          <div class="hero-orbit orbit-one"></div><div class="hero-orbit orbit-two"></div>
          <div class="hero-donut" aria-hidden="true">
            <svg viewBox="0 0 260 210"><defs><linearGradient id="donutGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9c70"/><stop offset=".48" stop-color="#ff674f"/><stop offset="1" stop-color="#c83351"/></linearGradient><linearGradient id="donutShadow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd4b7"/><stop offset="1" stop-color="#aa3449"/></linearGradient></defs><g class="donut-spin"><path d="M130 12C62 12 10 48 10 95s52 83 120 83 120-36 120-83S198 12 130 12Zm0 54c30 0 54 13 54 29s-24 29-54 29-54-13-54-29 24-29 54-29Z" fill="url(#donutGradient)" fill-rule="evenodd"/><path d="M10 95c0 47 52 83 120 83s120-36 120-83c-12 31-58 53-120 53S22 126 10 95Z" fill="url(#donutShadow)" opacity=".52"/></g><circle cx="205" cy="38" r="8" fill="#d9f36a"/><circle cx="48" cy="44" r="4" fill="#fff"/></svg>
          </div>
          <div class="hero-photo hero-photo-main"><img src="https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1000&q=85" alt="A live music crowd under warm stage lights"><span class="photo-caption"><b>21 NOV</b><span>Afterglow Sessions</span></span></div>
          <div class="hero-photo hero-photo-small"><img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=500&q=80" alt="Audience at a conference"><span class="floating-photo-label">IDEAS IN MOTION <span>✳</span></span></div>
          <div class="hero-sticker"><span>GOOD<br>ENERGY</span><b>↗</b></div>
          <div class="hero-counter"><strong>08</strong><span>events to<br>look forward to</span></div>
        </div>
      </section>

      <section class="ticker-band" aria-label="K Explore event categories"><div class="ticker-track"><span>MAKE A PLAN</span><i>✳</i><span>MEET YOUR PEOPLE</span><i>✳</i><span>TRY SOMETHING NEW</span><i>✳</i><span>MAKE A PLAN</span><i>✳</i><span>MEET YOUR PEOPLE</span><i>✳</i><span>TRY SOMETHING NEW</span><i>✳</i></div></section>

      <section class="section shell featured-section">
        <div class="section-heading"><div><span class="eyebrow">THE SHORTLIST</span><h2>Worth making<br><span class="serif-accent">a plan for.</span></h2></div><a class="text-link heading-link" href="#/events">See all events ${icons.arrow}</a></div>
        <div class="featured-grid">${events.filter((event) => event.featured).slice(0, 3).map((event, index) => `<div class="featured-card-wrap featured-card-${index + 1}">${eventCard(event, true)}</div>`).join("")}</div>
      </section>

      <section class="section section-tinted" id="upcoming-events">
        <div class="shell">
          <div class="section-heading section-heading-inline"><div><span class="eyebrow">YOUR NEXT YES</span><h2>Find your <span class="serif-accent">next thing.</span></h2><p class="section-intro">From front-row energy to hands-on learning, your next good day starts here.</p></div><span class="result-count" id="result-count">8 events</span></div>
          ${renderFilterControls()}
          <div class="event-grid" id="home-event-grid"></div>
          <div class="section-bottom-link"><a class="button button-dark" href="#/events">Explore all experiences ${icons.arrow}</a></div>
        </div>
      </section>

      <section class="section shell categories-section">
        <div class="section-heading"><div><span class="eyebrow">FOLLOW YOUR CURIOSITY</span><h2>Pick a <span class="serif-accent">feeling.</span></h2></div><p class="section-side-copy">A little bit of everything.<br>A lot to look forward to.</p></div>
        <div class="category-grid">${categories.map((category) => `<a href="#/events?category=${encodeURIComponent(category.name)}" class="category-tile ${category.tone}" data-reveal><span class="category-icon">${category.icon}</span><span class="category-name">${escapeHTML(category.name)}</span><span class="category-description">${escapeHTML(category.description)}</span><span class="category-arrow" aria-hidden="true">↗</span></a>`).join("")}</div>
      </section>

      <section class="about-teaser-section">
        <div class="shell about-teaser-grid">
          <div class="about-art" data-reveal><div class="about-art-circle"><span>GO<br>OUT<br>THERE<span class="art-star">✳</span></span></div><span class="about-art-caption">LESS SCROLLING.<br>MORE STORIES.</span><span class="about-art-dot"></span></div>
          <div class="about-teaser-copy" data-reveal><span class="eyebrow">A LITTLE ABOUT US</span><h2>Life is better<br>when it's <span class="serif-accent">shared.</span></h2><p>K Explore is a simple idea: make it easier to find experiences that bring people together. We curate spaces to learn, listen, make, taste and meet — so you can spend less time searching and more time being there.</p><a class="text-link" href="#/about">The K Explore story ${icons.arrow}</a></div>
        </div>
      </section>

      <section class="drive-strip" aria-label="Find your next event"><div class="drive-strip-inner"><span class="drive-strip-label">YOUR NEXT GOOD DAY IS OUT THERE</span><div class="road-line"><span class="road-dashes"></span><svg class="little-car" viewBox="0 0 150 70" role="img" aria-label="Illustration of a car driving"><path d="M18 43h113l-8-18c-2-5-7-8-13-8H55c-6 0-11 3-15 8L28 37h-8c-5 0-8 3-8 7v8h10" fill="#ff674f" stroke="#172322" stroke-width="3" stroke-linejoin="round"/><path d="m47 25 9-4h21v16H38Zm36-4h25c4 0 6 2 8 5l5 11H83Z" fill="#d7e7df" stroke="#172322" stroke-width="2"/><circle cx="42" cy="50" r="10" fill="#172322"/><circle cx="42" cy="50" r="4" fill="#d9f36a"/><circle cx="111" cy="50" r="10" fill="#172322"/><circle cx="111" cy="50" r="4" fill="#d9f36a"/><path d="M15 42h-8m132 0h-7" stroke="#172322" stroke-width="3" stroke-linecap="round"/></svg></div><a href="#/events" class="drive-strip-link">LET'S GO <span>↗</span></a></div></section>`;

    bindFilterControls("home-event-grid", 4);
    observeReveals(app);
  }

  function renderEventsPage(params) {
    activeCategory = params.get("category") || "All events";
    if (!["All events", ...categories.map((category) => category.name)].includes(activeCategory)) activeCategory = "All events";
    const title = activeCategory === "All events" ? "The event <span class=\"serif-accent\">line-up.</span>" : `${escapeHTML(activeCategory)} <span class="serif-accent">events.</span>`;
    app.innerHTML = `
      <section class="page-intro shell"><div class="eyebrow"><span class="eyebrow-line"></span> THE K EXPLORE CALENDAR</div><div class="page-intro-row"><div><h1>${title}</h1><p>Good plans start with a little curiosity. Find the one that feels like you.</p></div><div class="page-intro-stamp"><span>CURATED<br>FOR THE<br>CURIOUS</span><b>✳</b></div></div></section>
      <section class="section section-tinted listing-section"><div class="shell">${renderFilterControls()}<div class="listing-meta"><span id="result-count">${events.length} events</span><span>All times shown in IST · Sample event catalogue</span></div><div class="event-grid" id="events-page-grid"></div></div></section>`;
    bindFilterControls("events-page-grid");
    observeReveals(app);
  }

  function renderEventDetails(id) {
    const event = getEvent(id);
    if (!event) return renderNotFound("We couldn't find that event.", "It may have moved, or the link may be out of date.");
    const related = events.filter((item) => item.id !== event.id && (item.category === event.category || item.city === event.city)).slice(0, 3);
    app.innerHTML = `
      <section class="detail-hero shell">
        <a class="back-link" href="#/events">← Back to all events</a>
        <div class="detail-hero-image"><img src="${escapeHTML(event.image)}" alt="${escapeHTML(event.imageAlt)}"><div class="detail-image-overlay"></div><div class="detail-hero-title"><span class="event-category-pill">${escapeHTML(event.category)}</span><h1>${escapeHTML(event.title)}</h1><p>${escapeHTML(event.excerpt)}</p></div><div class="detail-image-date"><b>${escapeHTML(event.date.split("-")[2])}</b><span>${escapeHTML(new Intl.DateTimeFormat("en", { month: "short", timeZone: "Asia/Kolkata" }).format(eventDate(event)).toUpperCase())}</span></div></div>
      </section>
      <section class="detail-content shell">
        <div class="detail-main-column">
          <div class="detail-facts"><div>${icons.calendar}<span><small>DATE</small><b>${escapeHTML(formatEventDate(event))}</b></span></div><div>${icons.clock}<span><small>TIME</small><b>${escapeHTML(formatTime(event.time))} onwards</b></span></div><div>${icons.pin}<span><small>LOCATION</small><b>${escapeHTML(event.city)}</b></span></div></div>
          <div class="detail-section-block"><span class="eyebrow">THE EXPERIENCE</span><h2>Here's what<br>you're <span class="serif-accent">walking into.</span></h2><p>${escapeHTML(event.description)}</p></div>
          <div class="detail-section-block"><span class="eyebrow">GOOD TO KNOW</span><h3>What's in the plan</h3><ul class="highlight-list">${event.highlights.map((item) => `<li><span class="list-check">✓</span>${escapeHTML(item)}</li>`).join("")}</ul></div>
          <div class="detail-section-block"><span class="eyebrow">THE RUN OF SHOW</span><h3>A little look at the day</h3><div class="schedule-list">${event.schedule.map((item, index) => `<div class="schedule-item"><span class="schedule-index">0${index + 1}</span><b>${escapeHTML(item.time)}</b><span>${escapeHTML(item.label)}</span></div>`).join("")}</div></div>
          <div class="detail-location-block"><div><span class="eyebrow">WHERE TO FIND US</span><h3>${escapeHTML(event.venue)}</h3><p>${escapeHTML(event.address)}</p></div><a class="button button-outline" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}" target="_blank" rel="noopener noreferrer">Open map ↗</a></div>
        </div>
        <aside class="registration-card" data-reveal><div class="registration-card-top"><span class="eyebrow">SAVE YOUR SPOT</span><span class="availability-dot">REGISTRATION OPEN</span></div><div class="registration-price">${escapeHTML(currencyLabel(event.price))}</div><div class="registration-card-facts"><div>${icons.ticket}<span>${escapeHTML(event.capacity)}</span></div><div><span class="mini-icon">◎</span><span>${escapeHTML(event.age)}</span></div><div><span class="mini-icon">✳</span><span>Organised by ${escapeHTML(event.organizer)}</span></div></div><div class="detail-countdown" data-countdown="${escapeHTML(event.id)}"><span class="countdown-dot"></span><span class="countdown-copy">Loading countdown…</span></div><a class="button button-coral button-full" href="#/register/${escapeHTML(event.id)}">Register for this event ${icons.arrow}</a><p class="registration-disclaimer">Demo registration only. No payment is collected and no real ticket is issued.</p></aside>
      </section>
      ${related.length ? `<section class="section section-tinted related-section"><div class="shell"><div class="section-heading"><div><span class="eyebrow">KEEP THE GOOD PLANS COMING</span><h2>You might also <span class="serif-accent">like.</span></h2></div><a class="text-link heading-link" href="#/events">All events ${icons.arrow}</a></div><div class="event-grid">${related.map((item) => eventCard(item)).join("")}</div></div></section>` : ""}`;
    refreshCountdowns();
    observeReveals(app);
  }

  function renderRegistrationForm(eventId = "") {
    const preselected = getEvent(eventId);
    app.innerHTML = `
      <section class="form-page shell"><div class="form-intro"><a class="back-link" href="${preselected ? `#/event/${escapeHTML(preselected.id)}` : "#/events"}">← ${preselected ? "Back to event" : "Back to events"}</a><span class="eyebrow">MAKE IT OFFICIAL (WELL, ALMOST)</span><h1>Save your <span class="serif-accent">spot.</span></h1><p>Share a few details and we'll save your demo registration in this browser.</p><div class="demo-notice"><span class="demo-notice-icon">i</span><p><b>College project demo:</b> this form stores information in your browser's LocalStorage. It is not connected to a server, payment gateway or real ticketing system.</p></div></div>
        <form class="registration-form" id="registration-form" novalidate>
          <div class="form-heading"><div><span class="eyebrow">YOUR DETAILS</span><h2>Who are we saving a seat for?</h2></div><span class="form-step">01 <i>/</i> 01</span></div>
          <div class="form-field"><label for="participant-name">Full name <span>*</span></label><input id="participant-name" name="name" type="text" autocomplete="name" placeholder="e.g. Aanya Sharma" required minlength="2" maxlength="80"><small class="field-error" id="name-error"></small></div>
          <div class="form-two-col"><div class="form-field"><label for="participant-email">Email address <span>*</span></label><input id="participant-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required maxlength="120"><small class="field-error" id="email-error"></small></div><div class="form-field"><label for="participant-phone">Phone number <span>*</span></label><input id="participant-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="+91 98765 43210" required maxlength="20"><small class="field-error" id="phone-error"></small></div></div>
          <div class="form-field"><label for="selected-event">Choose your event <span>*</span></label><select id="selected-event" name="eventId" required><option value="">Select an event</option>${events.map((event) => `<option value="${escapeHTML(event.id)}" ${preselected?.id === event.id ? "selected" : ""}>${escapeHTML(event.title)} · ${escapeHTML(formatEventDate(event, false))} · ${escapeHTML(event.city)}</option>`).join("")}</select><small class="field-error" id="event-error"></small></div>
          <label class="consent-check"><input id="demo-consent" type="checkbox" required><span>I understand this is a browser-based demo registration and not a confirmed paid ticket.</span></label><small class="field-error consent-error" id="consent-error"></small>
          <button class="button button-coral button-full form-submit" type="submit">Complete demo registration ${icons.arrow}</button>
          <p class="form-privacy-note">Your details stay in this browser for this project demo. Avoid entering sensitive or real personal information.</p>
        </form>
      </section>`;
    const form = document.getElementById("registration-form");
    form.addEventListener("submit", handleRegistrationSubmit);
    ["participant-name", "participant-email", "participant-phone", "selected-event", "demo-consent"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", () => clearFieldError(id));
      document.getElementById(id)?.addEventListener("change", () => clearFieldError(id));
    });
    observeReveals(app);
  }

  function validateRegistration(formData) {
    const errors = {};
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const eventId = String(formData.get("eventId") || "").trim();
    const consent = document.getElementById("demo-consent").checked;
    if (name.length < 2) errors.name = "Please enter your full name (at least 2 characters).";
    else if (name.length > 80) errors.name = "Name must be 80 characters or fewer.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Enter a valid email address.";
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15 || !/^\+?[0-9][0-9\s().-]*$/.test(phone)) errors.phone = "Enter a valid phone number with 10–15 digits.";
    if (!getEvent(eventId)) errors.eventId = "Please choose an event from the list.";
    if (!consent) errors.consent = "Please confirm that you understand this is a demo registration.";
    return { errors, values: { name, email, phone, eventId } };
  }

  function clearFieldError(fieldId) {
    const map = {
      "participant-name": "name-error", "participant-email": "email-error", "participant-phone": "phone-error",
      "selected-event": "event-error", "demo-consent": "consent-error"
    };
    const errorId = map[fieldId];
    const field = document.getElementById(fieldId);
    const error = errorId ? document.getElementById(errorId) : null;
    if (error) error.textContent = "";
    field?.removeAttribute("aria-invalid");
    field?.closest(".form-field")?.classList.remove("has-error");
  }

  function showValidationErrors(errors) {
    const map = { name: "participant-name", email: "participant-email", phone: "participant-phone", eventId: "selected-event", consent: "demo-consent" };
    Object.entries(map).forEach(([key, fieldId]) => {
      const field = document.getElementById(fieldId);
      const error = document.getElementById(`${key}-error`);
      if (errors[key]) {
        if (error) error.textContent = errors[key];
        field?.setAttribute("aria-invalid", "true");
        field?.closest(".form-field")?.classList.add("has-error");
      } else {
        if (error) error.textContent = "";
        field?.removeAttribute("aria-invalid");
        field?.closest(".form-field")?.classList.remove("has-error");
      }
    });
    const firstInvalid = document.querySelector('[aria-invalid="true"]');
    firstInvalid?.focus();
  }

  function handleRegistrationSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector("button[type=submit]");
    const { errors, values } = validateRegistration(new FormData(form));
    showValidationErrors(errors);
    if (Object.keys(errors).length) {
      showToast("Please check the highlighted fields.", "error");
      return;
    }

    const existing = KExploreStorage.getRegistrations().some((item) =>
      item.eventId === values.eventId && item.email.trim().toLowerCase() === values.email.trim().toLowerCase()
    );
    if (existing) {
      const emailError = document.getElementById("email-error");
      emailError.textContent = "This email is already registered for this event. View your saved registrations instead.";
      document.getElementById("participant-email").setAttribute("aria-invalid", "true");
      document.getElementById("participant-email").closest(".form-field")?.classList.add("has-error");
      showToast("A registration for this email and event already exists.", "error");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Saving your registration…";
    const registration = {
      id: `KE-${Date.now().toString(36).toUpperCase()}`,
      name: values.name,
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      eventId: values.eventId,
      createdAt: new Date().toISOString(),
      status: "Demo registration saved"
    };
    const result = KExploreStorage.saveRegistration(registration);
    if (!result.ok) {
      submitButton.disabled = false;
      submitButton.textContent = `Complete demo registration ${icons.arrow}`;
      if (result.reason === "duplicate") {
        document.getElementById("email-error").textContent = "This email is already registered for this event.";
        document.getElementById("participant-email").setAttribute("aria-invalid", "true");
        document.getElementById("participant-email").closest(".form-field")?.classList.add("has-error");
        showToast("Duplicate registration detected.", "error");
      } else {
        showToast("Your browser could not save this registration. Check LocalStorage permissions and try again.", "error");
      }
      return;
    }
    renderHeaderState();
    renderRegistrationSuccess(registration);
    showToast("Your demo registration has been saved.", "success");
  }

  function renderRegistrationSuccess(registration) {
    const event = getEvent(registration.eventId);
    if (!event) return renderMyRegistrations();
    app.innerHTML = `
      <section class="success-page shell"><div class="success-mark" aria-hidden="true"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="35"></circle><path d="m23 41 11 11 24-26"></path></svg></div><span class="eyebrow">YOU'RE ON THE LIST</span><h1>That's a <span class="serif-accent">good plan.</span></h1><p class="success-lead">Your demo registration is saved in this browser. Here's your confirmation summary.</p>
        <div class="confirmation-card"><div class="confirmation-card-top"><span>K EXPLORE · DEMO CONFIRMATION</span><span class="confirmation-status">SAVED ✓</span></div><div class="confirmation-event"><img src="${escapeHTML(event.image)}" alt="${escapeHTML(event.imageAlt)}"><div><span class="eyebrow">${escapeHTML(event.category)}</span><h2>${escapeHTML(event.title)}</h2><p>${escapeHTML(formatEventDate(event))} · ${escapeHTML(formatTime(event.time))}</p><p>${escapeHTML(event.venue)}, ${escapeHTML(event.city)}</p></div></div><div class="confirmation-details"><div><small>PARTICIPANT</small><b>${escapeHTML(registration.name)}</b></div><div><small>EMAIL</small><b>${escapeHTML(registration.email)}</b></div><div><small>REFERENCE</small><b>${escapeHTML(registration.id)}</b></div></div><div class="confirmation-note"><span>i</span><p>This is a LocalStorage demo record, not a real ticket or payment confirmation. No email has been sent.</p></div></div>
        <div class="success-actions"><a class="button button-dark" href="#/my-registrations">View my registrations ${icons.arrow}</a><a class="quiet-link" href="#/events">Explore more events ↗</a></div></section>`;
    observeReveals(app);
  }

  function renderMyRegistrations() {
    const registrations = KExploreStorage.getRegistrations();
    if (!registrations.length) {
      app.innerHTML = `<section class="empty-registrations shell"><div class="empty-ticket" aria-hidden="true">${icons.ticket}</div><span class="eyebrow">YOUR LITTLE CORNER</span><h1>No plans <span class="serif-accent">saved yet.</span></h1><p>Once you register for an event, your saved demo registrations will show up here.</p><a class="button button-coral" href="#/events">Find an event ${icons.arrow}</a><div class="storage-explainer"><b>How this works</b><span>Registrations are saved in LocalStorage on this device and browser. They won't sync across devices or browsers.</span></div></section>`;
      return;
    }
    app.innerHTML = `<section class="page-intro shell"><div class="eyebrow"><span class="eyebrow-line"></span> YOUR K EXPLORE SPACE</div><div class="page-intro-row"><div><h1>Your saved <span class="serif-accent">plans.</span></h1><p>These are the demo registrations saved in this browser.</p></div><div class="registration-total"><b>${String(registrations.length).padStart(2, "0")}</b><span>SAVED<br>REGISTRATIONS</span></div></div></section><section class="section section-tinted registrations-section"><div class="shell"><div class="registration-list">${registrations.map((registration) => {
      const event = getEvent(registration.eventId);
      if (!event) return "";
      return `<article class="saved-registration"><img src="${escapeHTML(event.image)}" alt="${escapeHTML(event.imageAlt)}"><div class="saved-registration-info"><span class="eyebrow">${escapeHTML(event.category)}</span><h2>${escapeHTML(event.title)}</h2><p>${escapeHTML(formatEventDate(event))} · ${escapeHTML(formatTime(event.time))}</p><p>${escapeHTML(event.venue)}, ${escapeHTML(event.city)}</p><small>Reference: ${escapeHTML(registration.id)}</small></div><div class="saved-registration-action"><span class="saved-status"><i></i> Saved locally</span><a class="text-link" href="#/event/${escapeHTML(event.id)}">Event details ${icons.arrow}</a></div></article>`;
    }).join("")}</div><div class="storage-explainer"><b>LocalStorage reminder</b><span>Saved registrations live only in this browser on this device. Clearing browser data may remove them. This student demo does not contact event organisers.</span></div><div class="section-bottom-link"><a class="button button-dark" href="#/events">Discover more events ${icons.arrow}</a></div></div></section>`;
    observeReveals(app);
  }

  function renderAbout() {
    app.innerHTML = `<section class="about-page-hero shell"><div class="eyebrow"><span class="eyebrow-line"></span> THE IDEA BEHIND K EXPLORE</div><h1>Make the world<br>a little <span class="serif-accent">less ordinary.</span></h1><p>We believe the best parts of life rarely happen in your bookmarks. They happen when you go, meet, listen, learn and make something with other people.</p><div class="about-page-image"><img src="https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1800&q=85" alt="Friends sharing a meal together around a table"><span>MORE MOMENTS<br>LIKE THIS. <b>✳</b></span></div></section><section class="section shell about-values"><div class="about-value-intro"><span class="eyebrow">WHAT WE'RE HERE FOR</span><h2>Less searching.<br><span class="serif-accent">More showing up.</span></h2></div><div class="about-value-list"><article><span>01</span><div><h3>Curiosity comes first.</h3><p>We bring different kinds of experiences into one place, so trying something new feels easy.</p></div></article><article><span>02</span><div><h3>People make the moment.</h3><p>Events are more than dates and venues. They're a chance to find your people and build a shared story.</p></div></article><article><span>03</span><div><h3>Good plans should be simple.</h3><p>Clear information, straightforward discovery and an easy demo registration flow — no fuss.</p></div></article></div></section><section class="about-project-note"><div class="shell"><span class="eyebrow">A NOTE ON THIS PROJECT</span><h2>Built as a front-end<br><span class="serif-accent">college project.</span></h2><p>K Explore is a demonstration event discovery platform built with HTML, CSS and vanilla JavaScript. Sample events and LocalStorage registrations are included to demonstrate the experience; it is not a live ticketing service.</p><a class="button button-coral" href="#/events">Explore the event line-up ${icons.arrow}</a></div></section>`;
    observeReveals(app);
  }

  function renderNotFound(title = "This page took a wrong turn.", copy = "Let's get you back to the good stuff.") {
    app.innerHTML = `<section class="not-found shell"><span class="not-found-number">404</span><h1>${escapeHTML(title)}</h1><p>${escapeHTML(copy)}</p><a class="button button-coral" href="#/">Back to K Explore ${icons.arrow}</a></section>`;
  }

  function renderCurrentRoute() {
    const route = currentRoute();
    const routeKey = `${route.path}?${route.params.toString()}`;
    if (routeKey !== lastRoute) closeMobileMenu();
    lastRoute = routeKey;
    if (countdownInterval) window.clearInterval(countdownInterval);

    if (route.path === "/" || route.path === "") renderHome();
    else if (route.path === "/events") renderEventsPage(route.params);
    else if (route.path.startsWith("/event/")) renderEventDetails(route.path.split("/")[2]);
    else if (route.path.startsWith("/register")) renderRegistrationForm(route.path.split("/")[2] || "");
    else if (route.path === "/my-registrations") renderMyRegistrations();
    else if (route.path === "/about") renderAbout();
    else renderNotFound();

    renderHeaderState();
    document.getElementById("current-year").textContent = String(new Date().getFullYear());
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    refreshCountdowns();
  }

  function refreshCountdowns() {
    if (countdownInterval) window.clearInterval(countdownInterval);
    const update = () => {
      document.querySelectorAll("[data-countdown]").forEach((node) => {
        const event = getEvent(node.dataset.countdown);
        if (!event) return;
        const difference = eventDate(event).getTime() - Date.now();
        const copy = node.querySelector(".countdown-copy");
        if (!copy) return;
        if (difference <= 0) {
          copy.textContent = "Event has started";
          node.classList.add("countdown-started");
          return;
        }
        const days = Math.floor(difference / 86400000);
        const hours = Math.floor((difference % 86400000) / 3600000);
        const minutes = Math.floor((difference % 3600000) / 60000);
        const seconds = Math.floor((difference % 60000) / 1000);
        copy.textContent = days > 0 ? `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m to go` : `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s to go`;
      });
    };
    update();
    countdownInterval = window.setInterval(update, 1000);
  }

  function observeReveals(scope = document) {
    const targets = scope.querySelectorAll?.("[data-reveal]") || [];
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          instance.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -35px 0px" });
    targets.forEach((target) => observer.observe(target));
  }

  // Delegate image error handling so a network failure never leaves a broken-image icon.
  document.addEventListener("error", (event) => {
    if (event.target instanceof HTMLImageElement) {
      event.target.classList.add("image-failed");
      event.target.alt = event.target.alt || "Event image unavailable";
    }
  }, true);

  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  });
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMobileMenu();
  });
  themeToggle.addEventListener("click", () => {
    updateTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
  window.addEventListener("hashchange", renderCurrentRoute);
  window.addEventListener("storage", (event) => {
    if (event.key === "kExplore.registrations.v1") renderHeaderState();
    if (event.key === "kExplore.theme.v1" && ["light", "dark"].includes(event.newValue)) updateTheme(event.newValue, false);
  });
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      const search = document.getElementById("event-search");
      if (search) { event.preventDefault(); search.focus(); }
    }
    if (event.key === "Escape") closeMobileMenu();
  });

  updateTheme(KExploreStorage.getTheme(), false);
  renderCurrentRoute();
})();

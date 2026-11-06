/* Dependency-free data and LocalStorage smoke tests. Run with: node tests/smoke-test.js */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

function createBrowserContext(sharedStorage) {
  const browser = { window: {}, localStorage: sharedStorage, console, Date };
  vm.createContext(browser);
  vm.runInContext(read("js/data.js"), browser, { filename: "js/data.js" });
  vm.runInContext(read("js/storage.js"), browser, { filename: "js/storage.js" });
  return browser.window;
}

function createLocalStorage() {
  const entries = new Map();
  return {
    getItem(key) { return entries.has(key) ? entries.get(key) : null; },
    setItem(key, value) { entries.set(key, String(value)); },
    removeItem(key) { entries.delete(key); }
  };
}

function run() {
  const html = read("index.html");
  const css = read("styles.css");
  const appSource = read("js/app.js");
  const dataSource = read("js/data.js");

  assert.match(html, /<main id="main-content"/);
  assert.match(html, /js\/data\.js/);
  assert.match(html, /js\/storage\.js/);
  assert.match(html, /js\/app\.js/);
  assert.match(appSource, /validateRegistration/);
  assert.match(appSource, /data-countdown/);
  assert.match(appSource, /data-category/);
  assert.match(css, /prefers-reduced-motion/);
  assert.equal(css.match(/{/g).length, css.match(/}/g).length, "CSS braces must balance");

  const localStorage = createLocalStorage();
  let browser = createBrowserContext(localStorage);
  const events = browser.K_EXPLORE_EVENTS;
  const categories = browser.K_EXPLORE_CATEGORIES;
  assert.equal(events.length, 8, "expected 8 sample events");
  assert.equal(new Set(events.map((event) => event.id)).size, events.length, "event IDs must be unique");
  assert.ok(categories.length >= 5, "expected multiple event categories");

  const requiredFields = ["title", "category", "date", "time", "venue", "city", "address", "price", "image", "imageAlt", "excerpt", "description", "highlights", "schedule", "capacity", "organizer", "age"];
  for (const event of events) {
    for (const field of requiredFields) assert.ok(event[field] !== undefined && event[field] !== null && event[field] !== "", `${event.id} is missing ${field}`);
    assert.ok(Array.isArray(event.highlights) && event.highlights.length, `${event.id} needs highlights`);
    assert.ok(Array.isArray(event.schedule) && event.schedule.length, `${event.id} needs a schedule`);
  }

  const storage = browser.KExploreStorage;
  const registration = {
    id: "KE-SMOKE-01", name: "Demo Participant", email: "demo@example.com",
    phone: "+91 9876543210", eventId: events[0].id,
    createdAt: new Date().toISOString(), status: "Demo registration saved"
  };
  assert.equal(storage.saveRegistration(registration).ok, true, "first registration should save");
  const duplicate = storage.saveRegistration({ ...registration, id: "KE-SMOKE-02" });
  assert.equal(duplicate.ok, false, "same event and email must be rejected");
  assert.equal(duplicate.reason, "duplicate");
  assert.equal(storage.saveRegistration({ ...registration, id: "KE-SMOKE-03", eventId: events[1].id }).ok, true, "same email may register for another event");
  assert.equal(storage.getRegistrations().length, 2);

  storage.saveTheme("dark");
  browser = createBrowserContext(localStorage); // simulate a fresh page/app instance
  assert.equal(browser.KExploreStorage.getTheme(), "dark", "theme must survive app reload");
  assert.equal(browser.KExploreStorage.getRegistrations().length, 2, "registrations must survive app reload");
  browser.KExploreStorage.saveTheme("light");
  assert.equal(browser.KExploreStorage.getTheme(), "light");

  console.log("PASS — HTML app shell, required modules and semantic main landmark");
  console.log("PASS — event catalogue completeness, unique IDs and category data");
  console.log("PASS — LocalStorage save/read, duplicate prevention and cross-event registration");
  console.log("PASS — light/dark preference persists across a fresh app instance");
  console.log("PASS — JavaScript feature hooks, reduced-motion stylesheet and CSS brace balance");
}

try {
  run();
} catch (error) {
  console.error("FAIL —", error.message);
  process.exitCode = 1;
}

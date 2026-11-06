/* Small, defensive LocalStorage layer. No backend or remote data is used. */
(() => {
  const REGISTRATIONS_KEY = "kExplore.registrations.v1";
  const THEME_KEY = "kExplore.theme.v1";
  let memoryRegistrations = [];
  let memoryTheme = "light";

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.warn(`K Explore: unable to read ${key} from LocalStorage.`, error);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`K Explore: unable to save ${key} to LocalStorage.`, error);
      return false;
    }
  }

  function getRegistrations() {
    const value = readJSON(REGISTRATIONS_KEY, memoryRegistrations);
    return Array.isArray(value) ? value : [];
  }

  function saveRegistration(registration) {
    const registrations = getRegistrations();
    const duplicate = registrations.some((item) =>
      item.eventId === registration.eventId &&
      String(item.email).trim().toLowerCase() === registration.email.trim().toLowerCase()
    );
    if (duplicate) return { ok: false, reason: "duplicate" };

    const updated = [registration, ...registrations];
    memoryRegistrations = updated;
    const saved = writeJSON(REGISTRATIONS_KEY, updated);
    if (!saved) return { ok: false, reason: "storage" };
    return { ok: true, registrations: updated };
  }

  function getTheme() {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === "dark" || stored === "light") {
        memoryTheme = stored;
        return stored;
      }
    } catch (error) {
      console.warn("K Explore: theme preference could not be read.", error);
    }
    return memoryTheme;
  }

  function saveTheme(theme) {
    memoryTheme = theme === "dark" ? "dark" : "light";
    try {
      localStorage.setItem(THEME_KEY, memoryTheme);
      return true;
    } catch (error) {
      console.warn("K Explore: theme preference could not be persisted.", error);
      return false;
    }
  }

  window.KExploreStorage = {
    getRegistrations,
    saveRegistration,
    getTheme,
    saveTheme
  };
})();

# K Explore — Event Discovery Website

A responsive event discovery and demo registration website built for a college web-designing project. K Explore helps visitors browse a curated catalogue of sample events, search and filter by category, view event information, and save a demo registration locally in the browser.

> **Project scope:** This is a front-end demonstration. Event information is sample data and registrations are stored in the visitor's browser with `localStorage`. There is no server, database, payment processing, email delivery, or real ticket issuance.

## Project overview

Event information is often spread across multiple pages and social platforms. K Explore presents event details in one place and provides a simple path from discovery to a saved demo registration. The project demonstrates semantic HTML, responsive CSS, client-side routing, form validation, browser storage, accessibility, and interaction testing without a framework or build step.

## Features

### Event discovery
- Homepage with a hero section, featured picks, upcoming events, category shortcuts, an About section, and footer navigation.
- Event catalogue with eight fictional sample events across Music, Technology, Art & Design, Workshop, and Food & Drink.
- Search by event title, category, city, venue, or description.
- Category filters that work together with search, plus a reset action and an empty state.
- Individual event detail views with description, date, time, venue/address, highlights, schedule, capacity, age guidance, organiser, price label, map link, and registration call to action.

### Registration
- Required full name, email, phone number, event selection, and demo-consent checkbox.
- Client-side validation with field-level feedback.
- Duplicate prevention using the combination of event ID and normalized email address.
- Successful registrations are saved in `localStorage` and shown in a confirmation view.
- A **My registrations** view lists the saved records.
- A clear notice explains that LocalStorage is browser- and device-specific and does not create a real booking.

### Bonus and UX
- Persistent light/dark theme toggle.
- Live countdowns for upcoming events.
- Responsive mobile navigation.
- Animated hero illustration, rotating donut, moving car/road strip, hover states, and scroll reveals.
- Reduced-motion support, keyboard focus styles, skip link, semantic landmarks, form labels, and accessible button names.
- No framework, package installation, or build process required.

## Technology stack

- HTML5
- CSS3 (custom properties, Grid, Flexbox, transitions and keyframe animations)
- Vanilla JavaScript (ES6+)
- LocalStorage for demo registration and theme preference
- Google Fonts (`DM Sans` and `Space Grotesk`) and Unsplash-hosted event photography

## Project structure

```text
k-explore/
├── index.html             # App shell, header, footer and asset loading
├── styles.css             # Responsive design system and component styles
├── README.md              # Project documentation
├── assets/
│   ├── logo.svg
│   └── favicon.svg
└── js/
    ├── data.js            # Sample event and category data
    ├── storage.js         # Defensive LocalStorage wrapper
    ├── app.js             # Hash routing, views, filtering, validation and UI behavior
└── tests/
    └── smoke-test.js      # Dependency-free data and LocalStorage smoke tests
```

## Run locally

No Node.js packages or server are required.

1. Download or clone this repository.
2. Open the `k-explore` folder.
3. Double-click `index.html` to open it in a modern browser.

For a local HTTP server (recommended while developing), run one of the following from the project folder:

```bash
# Python 3
python -m http.server 8000
```

Then visit `http://localhost:8000`.

Or use the **Live Server** extension in Visual Studio Code and open `index.html` with Live Server.

## Registration data and browser storage

The app uses the browser's `localStorage` API. The storage keys are:

- `kExplore.registrations.v1` — array of saved demo registration objects.
- `kExplore.theme.v1` — `light` or `dark` theme preference.

A registration record contains a generated reference, participant name, normalized email address, phone number, event ID, timestamp, and demo status. Before saving, the app checks whether the same normalized email already exists for the selected event. A visitor can view saved registrations through **My registrations**.

The data remains in the same browser profile on the same device. It is not synchronized, backed up, sent to an organiser, or protected like production account data. Clearing site data can remove it. Use sample details for evaluation rather than sensitive personal information.

## Customizing event content

Edit `js/data.js` to update the catalogue. Each event object includes:

- `id`, `title`, `category`
- `date` (`YYYY-MM-DD`), `time` and `endTime` (24-hour clock, interpreted as IST)
- `venue`, `city`, `address`, `price`
- `image`, `imageAlt`, `excerpt`, `description`
- `highlights`, `schedule`, `capacity`, `organizer`, `age`
- `featured` and optional `featuredLabel`

Use a unique, URL-friendly `id`. To add a category, add a matching category object to `K_EXPLORE_CATEGORIES`.

The sample catalogue and names are fictional demonstration content. Event photographs load from Unsplash over the internet; an internet connection is needed for those remote images and Google Fonts. Replace the demo contact address (`hello@kexplore.example`) with a real project contact address before publishing publicly.

## Testing and quality checks

A dependency-free Node smoke-test script verifies the event catalogue, storage behavior, duplicate prevention, theme persistence, and key source structure. Run it from the project folder with `node tests/smoke-test.js`. The project should also be manually verified in a modern Chromium, Firefox, or Safari browser using this checklist:

| Test | Expected result |
|---|---|
| Open `index.html` | Homepage loads with navigation and featured events |
| Explore events | All sample events render as cards |
| Search by title / venue / city | Matching events update while typing |
| Select a category | Only events in that category remain |
| Search + category together | Both constraints are applied |
| Reset filters | Search clears and all categories return |
| Select an event | Correct detail view opens with full sample information |
| Submit empty registration | Required-field errors appear; nothing is saved |
| Submit invalid email / phone | Field-level validation blocks submission |
| Submit valid demo registration | Confirmation appears and a record is saved |
| Register same email for same event again | Duplicate is rejected |
| Register same email for a different event | A separate registration is allowed |
| Refresh and open My registrations | Saved record remains visible in the same browser |
| Toggle theme and refresh | Theme preference persists |
| View an event page | Countdown updates every second |
| Open mobile navigation | Menu opens, links navigate, and menu closes |
| Resize to mobile / tablet / desktop | Layout adapts without intentional horizontal overflow |
| Block an image request | Card retains its layout and fallback background |
| Open browser developer console | No expected application errors |

## Known limitations and future improvements

- Add a backend API and database for shared, durable registrations.
- Add authentication, email confirmation, organiser tools, capacity checks, and secure access controls.
- Integrate a payment gateway only with a proper server-side order and verification flow.
- Add real event management tools for creating, editing, publishing, and cancelling events.
- Add image hosting/CDN and an offline-friendly asset strategy.
- Add automated browser tests (for example, Playwright) to a CI workflow.

## Screenshots

Add screenshots of the homepage, event listing with filters, event details, registration validation, successful registration, and mobile layout here after capturing them from your local or deployed build.

```text
screenshots/
├── homepage.png
├── event-listing.png
├── event-details.png
├── registration-form.png
└── mobile-homepage.png
```

## Academic project note

K Explore is a client-side educational project. Its purpose is to demonstrate the requested website interface and interactions. It does not represent a production event marketplace or a real event organiser.

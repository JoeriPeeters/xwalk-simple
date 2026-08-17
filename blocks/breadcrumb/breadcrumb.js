import { moveInstrumentation } from '../../scripts/scripts.js';

let indexPromise;

/**
 * Fetches and caches the site's query-index once per session.
 * @returns {Promise<Array>} the indexed pages
 */
function fetchPageIndex() {
  if (!indexPromise) {
    indexPromise = fetch('/query-index.json')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => json.data || [])
      .catch(() => []);
  }
  return indexPromise;
}

/**
 * Turns a URL path segment into a readable fallback label
 * when no matching query-index entry (and thus no real title) exists.
 * Sentence case ("Wat is pensioen"), not title case, to match how
 * real page titles read.
 * @param {string} segment
 * @returns {string}
 */
function humanize(segment) {
  const words = segment.replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Loads and decorates the breadcrumb.
 * Fully automatic: derives the trail from the current URL path and the
 * site's query-index (for real page titles), so authors never edit
 * breadcrumb content by hand — the block just needs to be placed once.
 *
 * Only path segments that resolve to an actual indexed page get a crumb.
 * A segment that's purely structural (e.g. a "werknemer"/"werkgever"
 * pillar prefix with no page of its own) is skipped rather than shown
 * with a guessed label — matching how the real site's breadcrumb omits
 * that level entirely. The current page (last segment) always gets a
 * crumb, falling back to a humanized label if it isn't indexed yet
 * (e.g. during local/draft testing).
 * @param {Element} block The breadcrumb block element
 */
export default async function decorate(block) {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const pageIndex = await fetchPageIndex();

  const crumbs = segments
    .map((segment, i) => {
      const path = `/${segments.slice(0, i + 1).join('/')}`;
      const entry = pageIndex.find((page) => page.path === path);
      const isCurrent = i === segments.length - 1;
      if (!entry && !isCurrent) return null; // structural segment, no real page
      return { path, label: entry?.title || humanize(segment) };
    })
    .filter(Boolean);

  const nav = document.createElement('nav');
  nav.className = 'breadcrumb';
  nav.setAttribute('aria-label', 'Breadcrumb');

  const ol = document.createElement('ol');

  const home = document.createElement('li');
  home.className = 'breadcrumb-home';
  home.innerHTML = '<a href="/"><span class="icon icon-home"></span><span class="icon-label">Home</span></a>';
  ol.append(home);

  crumbs.forEach((crumb, i) => {
    const li = document.createElement('li');
    const isCurrent = i === crumbs.length - 1;

    if (isCurrent) {
      li.textContent = crumb.label;
      li.setAttribute('aria-current', 'page');
    } else {
      const a = document.createElement('a');
      a.href = crumb.path;
      a.textContent = crumb.label;
      li.append(a);
    }

    ol.append(li);
  });

  nav.append(ol);
  moveInstrumentation(block, nav);
  block.replaceChildren(nav);
}

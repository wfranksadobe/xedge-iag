import { getMetadata } from '../../scripts/aem.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Fetch the nav fragment as plain HTML.
 * Local/aem-up serves /content/nav.plain.html; DA/EDS serves `${navPath}.plain.html`.
 */
async function fetchNav(navPath) {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) resp = await fetch(`${navPath}.plain.html`);
  if (!resp.ok) return null;
  const html = await resp.text();
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp;
}

/** Close every open mega-menu panel. */
function closeAllPanels(nav, exception) {
  nav.querySelectorAll('.nav-item.open').forEach((item) => {
    if (item === exception) return;
    item.classList.remove('open');
    const trigger = item.querySelector(':scope > .nav-item-toggle');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });
}

/** Build one top-level nav item with its mega-menu panel from a heading group. */
function buildNavItem(h2, groups) {
  const item = document.createElement('div');
  item.className = 'nav-item';
  if (groups.length) item.classList.add('nav-drop');

  const sourceLink = h2.querySelector('a');
  const label = (sourceLink || h2).textContent.trim();
  const href = sourceLink ? sourceLink.getAttribute('href') : null;

  // The visible top-level entry: a link + a toggle button (matches source: link + chevron)
  const entry = document.createElement('div');
  entry.className = 'nav-item-entry';

  const link = document.createElement('a');
  link.className = 'nav-item-link';
  link.textContent = label;
  if (href) link.href = href;
  entry.append(link);

  if (groups.length) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-item-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', `Toggle ${label} navigation dropdown`);
    toggle.innerHTML = '<span class="nav-chevron" aria-hidden="true"></span>';
    entry.append(toggle);

    const panel = document.createElement('div');
    panel.className = 'nav-megamenu';
    const inner = document.createElement('div');
    inner.className = 'nav-megamenu-inner';
    groups.forEach((g) => {
      const col = document.createElement('div');
      col.className = 'nav-megamenu-col';
      col.append(...g);
      inner.append(col);
    });
    panel.append(inner);
    item.append(entry, panel);
  } else {
    item.append(entry);
  }
  return item;
}

/** Parse section 2 (flat H2 + H3/UL groups) into structured nav items. */
function parseNavItems(sectionEl) {
  const items = [];
  let currentH2 = null;
  let groups = [];
  const flush = () => {
    if (currentH2) items.push(buildNavItem(currentH2, groups));
    currentH2 = null;
    groups = [];
  };
  [...sectionEl.children].forEach((el) => {
    if (el.tagName === 'H2') {
      flush();
      currentH2 = el;
    } else if (el.tagName === 'H3') {
      groups.push([el]);
    } else if (el.tagName === 'UL') {
      if (groups.length) groups[groups.length - 1].push(el);
      else groups.push([el]);
    }
  });
  flush();
  return items;
}

/** Build the expandable search form (controls live in JS, never in the fragment). */
function buildSearch() {
  const wrap = document.createElement('div');
  wrap.className = 'nav-search';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nav-search-trigger';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = '<span class="nav-search-label">Search</span><span class="nav-search-icon" aria-hidden="true"></span>';

  const form = document.createElement('form');
  form.className = 'nav-search-form';
  form.setAttribute('role', 'search');
  form.action = '/search';
  form.hidden = true;
  form.innerHTML = `
    <input type="search" name="q" class="nav-search-input" placeholder="Search" aria-label="Site search input. Please input at least 3 characters." minlength="3">
    <button type="submit" class="nav-search-submit" aria-label="search"><span class="nav-search-icon" aria-hidden="true"></span></button>
    <button type="button" class="nav-search-close" aria-label="Close"></button>`;

  trigger.addEventListener('click', () => {
    const open = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
    form.hidden = open;
    wrap.classList.toggle('open', !open);
    if (!open) form.querySelector('.nav-search-input').focus();
  });
  form.querySelector('.nav-search-close').addEventListener('click', () => {
    trigger.setAttribute('aria-expanded', 'false');
    form.hidden = true;
    wrap.classList.remove('open');
    trigger.focus();
  });

  wrap.append(trigger, form);
  return wrap;
}

/**
 * loads and decorates the header (IAG click-triggered mega-menu nav)
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await fetchNav(navPath);
  block.textContent = '';
  if (!fragment) return;

  const sections = fragment.querySelectorAll(':scope > div');
  const brandSection = sections[0];
  const navSection = sections[1];

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  // Brand (logo)
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  const logoLink = brandSection ? brandSection.querySelector('a img') : null;
  if (logoLink) brand.append(logoLink.closest('a'));

  // Hamburger (mobile)
  const hamburger = document.createElement('button');
  hamburger.type = 'button';
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('aria-controls', 'nav');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-label', 'Open navigation');
  hamburger.innerHTML = '<span class="nav-hamburger-icon"></span>';

  // Sections (nav items)
  const navSections = document.createElement('div');
  navSections.className = 'nav-sections';
  if (navSection) parseNavItems(navSection).forEach((it) => navSections.append(it));

  // Tools (search)
  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  tools.append(buildSearch());

  // Wire click-to-toggle for each mega-menu (desktop full panel; mobile level-1 accordion)
  navSections.querySelectorAll('.nav-item.nav-drop').forEach((item) => {
    const toggle = item.querySelector(':scope > .nav-item-entry > .nav-item-toggle');
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const open = item.classList.contains('open');
      // On desktop, only one panel open at a time; on mobile, allow multiple (accordion)
      if (isDesktop.matches) closeAllPanels(nav, open ? null : item);
      item.classList.toggle('open', !open);
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    });

    // Mobile sub-accordion: each group heading (h3) toggles its following list
    item.querySelectorAll('.nav-megamenu-col').forEach((col) => {
      const heading = col.querySelector('h3');
      const list = col.querySelector('ul');
      if (!heading || !list) return;
      const subToggle = document.createElement('button');
      subToggle.type = 'button';
      subToggle.className = 'nav-subgroup-toggle';
      subToggle.setAttribute('aria-expanded', 'false');
      subToggle.setAttribute('aria-label', `Toggle ${heading.textContent.trim()} navigation dropdown`);
      subToggle.innerHTML = '<span class="nav-chevron" aria-hidden="true"></span>';
      // Wrap the heading's visible text so the toggle's aria-label doesn't merge into it
      const headingText = document.createElement('span');
      headingText.className = 'nav-subgroup-label';
      while (heading.firstChild) headingText.appendChild(heading.firstChild);
      heading.append(headingText, subToggle);
      subToggle.addEventListener('click', (e) => {
        e.preventDefault();
        if (isDesktop.matches) return; // headings are static columns on desktop
        const open = col.classList.contains('subopen');
        col.classList.toggle('subopen', !open);
        subToggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    });
  });

  // Close panels when clicking outside or pressing Escape
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeAllPanels(nav);
  });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') closeAllPanels(nav);
  });

  // Hamburger toggles the whole nav on mobile
  hamburger.addEventListener('click', () => {
    const open = nav.classList.contains('nav-open');
    nav.classList.toggle('nav-open', !open);
    hamburger.setAttribute('aria-expanded', open ? 'false' : 'true');
    hamburger.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
    document.body.style.overflowY = open || isDesktop.matches ? '' : 'hidden';
  });

  // Reset state cleanly when crossing the desktop/mobile breakpoint
  isDesktop.addEventListener('change', () => {
    nav.classList.remove('nav-open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open navigation');
    document.body.style.overflowY = '';
    closeAllPanels(nav);
  });

  nav.append(brand, hamburger, navSections, tools);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}

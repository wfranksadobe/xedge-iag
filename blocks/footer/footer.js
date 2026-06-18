import { getMetadata } from '../../scripts/aem.js';

/**
 * Fetch the footer fragment as plain HTML.
 * Local/aem-up serves /content/footer.plain.html; DA/EDS serves `${footerPath}.plain.html`.
 */
async function fetchFooter(footerPath) {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) resp = await fetch(`${footerPath}.plain.html`);
  if (!resp.ok) return null;
  const html = await resp.text();
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp;
}

/**
 * loads and decorates the IAG footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await fetchFooter(footerPath);
  block.textContent = '';
  if (!fragment) return;

  const footer = document.createElement('div');
  footer.className = 'footer-inner';

  const sections = [...fragment.querySelectorAll(':scope > div')];

  // Section 0 = acknowledgement, 1 = link columns, 2 = legal bar
  const [ack, columns, legal] = sections;

  if (ack) {
    ack.classList.add('footer-acknowledgement');
    // First <p> contains the artwork image; second is the heading
    const paras = ack.querySelectorAll(':scope > p');
    if (paras[0] && paras[0].querySelector('img')) paras[0].classList.add('footer-ack-art');
    if (paras[1]) paras[1].classList.add('footer-ack-heading');
    if (paras[2]) paras[2].classList.add('footer-ack-body');
  }

  if (columns) {
    columns.classList.add('footer-columns');
    // Group each H3 with its following UL (and the Connect/LinkedIn block) into a column
    const cols = [];
    let current = null;
    [...columns.children].forEach((el) => {
      if (el.tagName === 'H3') {
        current = document.createElement('div');
        current.className = 'footer-col';
        current.append(el);
        cols.push(current);
      } else if (current) {
        current.append(el);
      }
    });
    columns.replaceChildren(...cols);
    // Mark the LinkedIn link (contains an img) so CSS can style it as an icon
    const social = columns.querySelector('a img');
    if (social) social.closest('a').classList.add('footer-social-icon');
    // Mark the Contact us CTA (the link in the "Get in touch" column)
    const contactCol = cols.find((c) => /get in touch|contact/i.test(c.querySelector('h3')?.textContent || ''));
    if (contactCol) {
      contactCol.classList.add('footer-col-contact');
      const cta = contactCol.querySelector('a');
      if (cta) cta.classList.add('footer-cta');
    }

    // Mobile accordion: the link-group columns (not the contact column) get a
    // tappable heading that expands/collapses its list. Wiring is harmless on
    // desktop because CSS keeps the list visible there.
    cols.forEach((col) => {
      if (col === contactCol) return;
      const heading = col.querySelector('h3');
      const list = col.querySelector('ul');
      if (!heading || !list) return;
      col.classList.add('footer-col-accordion');
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'footer-accordion-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      const label = document.createElement('span');
      label.className = 'footer-accordion-label';
      while (heading.firstChild) label.appendChild(heading.firstChild);
      const chevron = document.createElement('span');
      chevron.className = 'footer-accordion-chevron';
      chevron.setAttribute('aria-hidden', 'true');
      toggle.append(label, chevron);
      heading.append(toggle);
      toggle.addEventListener('click', () => {
        const open = col.classList.contains('open');
        col.classList.toggle('open', !open);
        toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    });
  }

  if (legal) {
    legal.classList.add('footer-legal');
    const copy = legal.querySelector(':scope > p');
    if (copy) copy.classList.add('footer-copyright');
    const links = legal.querySelector(':scope > ul');
    if (links) links.classList.add('footer-legal-links');
  }

  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);
  block.append(footer);
}

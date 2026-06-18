import { createOptimizedPicture } from '../../scripts/aem.js';

const VALID_HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

/**
 * Hero block — full-bleed background image with overlaid title, optional text
 * and a button CTA.
 * Authored fields (in order): backgroundImage, backgroundImageAlt, title,
 * titleType, text, cta link, cta text.
 */
export default function decorate(block) {
  const rows = [...block.children];
  const cell = (i) => (rows[i] ? rows[i].querySelector(':scope > div') || rows[i] : null);

  const bgCell = cell(0);
  const bgAltCell = cell(1);
  const titleCell = cell(2);
  const titleTypeCell = cell(3);
  const textCell = cell(4);
  const ctaLinkCell = cell(5);
  const ctaTextCell = cell(6);

  const content = document.createElement('div');
  content.className = 'hero-content';

  const titleText = titleCell ? titleCell.textContent.trim() : '';
  if (titleText) {
    const level = (titleTypeCell?.textContent.trim().toLowerCase()) || 'h1';
    const tag = VALID_HEADINGS.includes(level) ? level : 'h1';
    const heading = document.createElement(tag);
    heading.className = 'hero-title';
    heading.textContent = titleText;
    content.append(heading);
  }

  if (textCell && textCell.textContent.trim()) {
    const text = document.createElement('div');
    text.className = 'hero-text';
    text.append(...textCell.childNodes);
    content.append(text);
  }

  const ctaAnchor = ctaLinkCell ? ctaLinkCell.querySelector('a') : null;
  const ctaHref = ctaAnchor ? ctaAnchor.getAttribute('href') : (ctaLinkCell?.textContent.trim() || '');
  const ctaLabel = ctaTextCell ? ctaTextCell.textContent.trim() : '';
  if (ctaHref && ctaLabel) {
    const cta = document.createElement('a');
    cta.className = 'hero-cta button';
    cta.href = ctaHref;
    cta.textContent = ctaLabel;
    content.append(cta);
  }

  const bgImg = bgCell ? bgCell.querySelector('img') : null;
  block.textContent = '';
  if (bgImg) {
    const alt = bgAltCell ? bgAltCell.textContent.trim() : (bgImg.getAttribute('alt') || '');
    const picture = createOptimizedPicture(bgImg.src, alt, true, [{ width: '2000' }]);
    picture.classList.add('hero-bg');
    block.append(picture);
  }
  block.append(content);
}

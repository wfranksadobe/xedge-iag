import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Hero block — full-bleed background image with overlaid title, optional text
 * and a button CTA.
 * Collapsed model cells (in order): backgroundImage (img alt →
 * backgroundImageAlt), title (heading level → titleType), body group
 * (body_text richtext + body_cta link → body_ctaText).
 */
export default function decorate(block) {
  const rows = [...block.children];
  const cell = (i) => (rows[i] ? rows[i].querySelector(':scope > div') || rows[i] : null);

  const bgCell = cell(0);
  const titleCell = cell(1);
  const bodyCell = cell(2);

  const content = document.createElement('div');
  content.className = 'hero-content';

  const heading = titleCell ? titleCell.querySelector('h1, h2, h3, h4, h5, h6') : null;
  const titleText = heading ? heading.textContent.trim() : (titleCell?.textContent.trim() || '');
  if (titleText) {
    const tag = heading ? heading.tagName.toLowerCase() : 'h1';
    const titleEl = document.createElement(tag);
    titleEl.className = 'hero-title';
    titleEl.textContent = titleText;
    content.append(titleEl);
  }

  // Body group: CTA link is the last anchor; remaining content is the text.
  const ctaAnchor = bodyCell ? bodyCell.querySelector('a') : null;
  if (bodyCell) {
    const textNodes = [...bodyCell.childNodes].filter((n) => {
      if (ctaAnchor && (n === ctaAnchor || n.contains?.(ctaAnchor))) return false;
      return true;
    });
    const hasText = textNodes.some((n) => (n.textContent || '').trim());
    if (hasText) {
      const text = document.createElement('div');
      text.className = 'hero-text';
      text.append(...textNodes);
      content.append(text);
    }
  }

  if (ctaAnchor) {
    const ctaHref = ctaAnchor.getAttribute('href');
    const ctaLabel = ctaAnchor.textContent.trim();
    if (ctaHref && ctaLabel) {
      const cta = document.createElement('a');
      cta.className = 'hero-cta button';
      cta.href = ctaHref;
      cta.textContent = ctaLabel;
      content.append(cta);
    }
  }

  const bgImg = bgCell ? bgCell.querySelector('img') : null;
  block.textContent = '';
  if (bgImg) {
    const alt = bgImg.getAttribute('alt') || '';
    const picture = createOptimizedPicture(bgImg.src, alt, true, [{ width: '2000' }]);
    picture.classList.add('hero-bg');
    block.append(picture);
  }
  block.append(content);
}

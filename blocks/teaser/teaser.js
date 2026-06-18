import { createOptimizedPicture } from '../../scripts/aem.js';

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Returns true when a HEX colour is dark enough to need light text. */
function isDark(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Relative luminance (perceptual)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

/**
 * Teaser block.
 * Collapsed model cells (in order): title (heading level → titleType),
 * body group (body_text richtext + body_cta link → body_ctaText), image
 * (img alt → imageAlt), backgroundColour. Image position is a block option
 * class (`teaser-image-right`).
 */
export default function decorate(block) {
  const rows = [...block.children];
  const cell = (i) => (rows[i] ? rows[i].querySelector(':scope > div') || rows[i] : null);

  const titleCell = cell(0);
  const bodyCell = cell(1);
  const imageCell = cell(2);
  const bgColourCell = cell(3);

  // Media side
  const media = document.createElement('div');
  media.className = 'teaser-media';
  const srcImg = imageCell ? imageCell.querySelector('img') : null;
  if (srcImg) {
    const alt = srcImg.getAttribute('alt') || '';
    const picture = createOptimizedPicture(srcImg.src, alt, false, [{ width: '750' }]);
    media.append(picture);
  }

  // Content side
  const content = document.createElement('div');
  content.className = 'teaser-content';

  const heading = titleCell ? titleCell.querySelector('h1, h2, h3, h4, h5, h6') : null;
  const titleText = heading ? heading.textContent.trim() : (titleCell?.textContent.trim() || '');
  if (titleText) {
    const tag = heading ? heading.tagName.toLowerCase() : 'h2';
    const titleEl = document.createElement(tag);
    titleEl.className = 'teaser-title';
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
      text.className = 'teaser-text';
      text.append(...textNodes);
      content.append(text);
    }
  }

  if (ctaAnchor) {
    const ctaHref = ctaAnchor.getAttribute('href');
    const ctaLabel = ctaAnchor.textContent.trim();
    if (ctaHref && ctaLabel) {
      const cta = document.createElement('a');
      cta.className = 'teaser-cta button';
      cta.href = ctaHref;
      cta.textContent = ctaLabel;
      content.append(cta);
    }
  }

  // Image position controls layout order (block option class)
  const position = block.classList.contains('teaser-image-right') ? 'right' : 'left';
  block.classList.add(`teaser-image-${position}`);

  block.textContent = '';
  if (position === 'right') {
    block.append(content, media);
  } else {
    block.append(media, content);
  }

  const hex = bgColourCell ? bgColourCell.textContent.trim() : '';
  if (hex && HEX_RE.test(hex)) {
    block.style.setProperty('--teaser-bg', hex);
    block.classList.add('teaser-has-bg');
    if (isDark(hex)) block.classList.add('teaser-bg-dark');
  }
}

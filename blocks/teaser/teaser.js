import { createOptimizedPicture } from '../../scripts/aem.js';

const VALID_HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
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
 * Authored fields (in order): title, titleType, text, ctaLink, ctaText,
 * image, imageAlt, imagePosition, backgroundColour.
 */
export default function decorate(block) {
  const rows = [...block.children];
  const cell = (i) => (rows[i] ? rows[i].querySelector(':scope > div') || rows[i] : null);

  const titleCell = cell(0);
  const titleTypeCell = cell(1);
  const textCell = cell(2);
  const ctaLinkCell = cell(3);
  const ctaTextCell = cell(4);
  const imageCell = cell(5);
  const imageAltCell = cell(6);
  const imagePositionCell = cell(7);
  const bgColourCell = cell(8);

  // Media side
  const media = document.createElement('div');
  media.className = 'teaser-media';
  const srcImg = imageCell ? imageCell.querySelector('img') : null;
  if (srcImg) {
    const alt = imageAltCell ? imageAltCell.textContent.trim() : (srcImg.getAttribute('alt') || '');
    const picture = createOptimizedPicture(srcImg.src, alt, false, [{ width: '750' }]);
    media.append(picture);
  }

  // Content side
  const content = document.createElement('div');
  content.className = 'teaser-content';

  const titleText = titleCell ? titleCell.textContent.trim() : '';
  if (titleText) {
    const level = (titleTypeCell?.textContent.trim().toLowerCase()) || 'h2';
    const tag = VALID_HEADINGS.includes(level) ? level : 'h2';
    const heading = document.createElement(tag);
    heading.className = 'teaser-title';
    heading.textContent = titleText;
    content.append(heading);
  }

  if (textCell && textCell.textContent.trim()) {
    const text = document.createElement('div');
    text.className = 'teaser-text';
    text.append(...textCell.childNodes);
    content.append(text);
  }

  const ctaAnchor = ctaLinkCell ? ctaLinkCell.querySelector('a') : null;
  const ctaHref = ctaAnchor ? ctaAnchor.getAttribute('href') : (ctaLinkCell?.textContent.trim() || '');
  const ctaLabel = ctaTextCell ? ctaTextCell.textContent.trim() : '';
  if (ctaHref && ctaLabel) {
    const cta = document.createElement('a');
    cta.className = 'teaser-cta button';
    cta.href = ctaHref;
    cta.textContent = ctaLabel;
    content.append(cta);
  }

  // Image position controls layout order
  const position = (imagePositionCell?.textContent.trim().toLowerCase()) === 'right' ? 'right' : 'left';
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

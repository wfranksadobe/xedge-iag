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
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

/**
 * Banner block.
 * Authored fields (in order): image, imageAlt, title, titleType, text,
 * cta link, cta text, backgroundColour.
 */
export default function decorate(block) {
  const rows = [...block.children];
  const cell = (i) => (rows[i] ? rows[i].querySelector(':scope > div') || rows[i] : null);

  const imageCell = cell(0);
  const imageAltCell = cell(1);
  const titleCell = cell(2);
  const titleTypeCell = cell(3);
  const textCell = cell(4);
  const ctaLinkCell = cell(5);
  const ctaTextCell = cell(6);
  const bgColourCell = cell(7);

  // Content side
  const content = document.createElement('div');
  content.className = 'banner-content';

  const titleText = titleCell ? titleCell.textContent.trim() : '';
  if (titleText) {
    const level = (titleTypeCell?.textContent.trim().toLowerCase()) || 'h1';
    const tag = VALID_HEADINGS.includes(level) ? level : 'h1';
    const heading = document.createElement(tag);
    heading.className = 'banner-title';
    heading.textContent = titleText;
    content.append(heading);
  }

  if (textCell && textCell.textContent.trim()) {
    const text = document.createElement('div');
    text.className = 'banner-text';
    text.append(...textCell.childNodes);
    content.append(text);
  }

  // CTA — always rendered as a text link with trailing arrow (matches source)
  const ctaAnchor = ctaLinkCell ? ctaLinkCell.querySelector('a') : null;
  const ctaHref = ctaAnchor ? ctaAnchor.getAttribute('href') : (ctaLinkCell?.textContent.trim() || '');
  const ctaLabel = ctaTextCell ? ctaTextCell.textContent.trim() : '';
  if (ctaHref && ctaLabel) {
    const cta = document.createElement('a');
    cta.className = 'banner-cta';
    cta.href = ctaHref;
    cta.textContent = ctaLabel;
    content.append(cta);
  }

  // Square content image
  const media = document.createElement('div');
  media.className = 'banner-media';
  const srcImg = imageCell ? imageCell.querySelector('img') : null;
  if (srcImg) {
    const alt = imageAltCell ? imageAltCell.textContent.trim() : (srcImg.getAttribute('alt') || '');
    const picture = createOptimizedPicture(srcImg.src, alt, true, [{ width: '750' }]);
    media.append(picture);
  }

  block.textContent = '';
  block.append(content);
  if (srcImg) block.append(media);

  // Optional author background colour (HEX)
  const hex = bgColourCell ? bgColourCell.textContent.trim() : '';
  if (hex && HEX_RE.test(hex)) {
    block.style.setProperty('--banner-bg', hex);
    block.classList.add('banner-has-bg');
    if (isDark(hex)) block.classList.add('banner-bg-dark');
  }
}

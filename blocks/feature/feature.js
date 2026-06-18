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
 * Feature block.
 * Authored fields (in order): title, titleType, text, cta1Link, cta1Text,
 * cta2Link, cta2Text, backgroundColour.
 */
export default function decorate(block) {
  const rows = [...block.children];
  const cell = (i) => (rows[i] ? rows[i].querySelector(':scope > div') || rows[i] : null);

  const titleCell = cell(0);
  const titleTypeCell = cell(1);
  const textCell = cell(2);
  const cta1LinkCell = cell(3);
  const cta1TextCell = cell(4);
  const cta2LinkCell = cell(5);
  const cta2TextCell = cell(6);
  const bgColourCell = cell(7);

  const content = document.createElement('div');
  content.className = 'feature-content';

  const titleText = titleCell ? titleCell.textContent.trim() : '';
  if (titleText) {
    const level = (titleTypeCell?.textContent.trim().toLowerCase()) || 'h3';
    const tag = VALID_HEADINGS.includes(level) ? level : 'h3';
    const heading = document.createElement(tag);
    heading.className = 'feature-title';
    heading.textContent = titleText;
    content.append(heading);
  }

  if (textCell && textCell.textContent.trim()) {
    const text = document.createElement('div');
    text.className = 'feature-text';
    text.append(...textCell.childNodes);
    content.append(text);
  }

  const buildCta = (linkCell, textCell2, primary) => {
    const anchor = linkCell ? linkCell.querySelector('a') : null;
    const href = anchor ? anchor.getAttribute('href') : (linkCell?.textContent.trim() || '');
    const label = textCell2 ? textCell2.textContent.trim() : '';
    if (!href || !label) return null;
    const cta = document.createElement('a');
    cta.className = `feature-cta button${primary ? ' feature-cta-primary' : ' feature-cta-secondary'}`;
    cta.href = href;
    cta.textContent = label;
    return cta;
  };

  const ctas = document.createElement('div');
  ctas.className = 'feature-ctas';
  const cta1 = buildCta(cta1LinkCell, cta1TextCell, true);
  const cta2 = buildCta(cta2LinkCell, cta2TextCell, false);
  if (cta1) ctas.append(cta1);
  if (cta2) ctas.append(cta2);
  if (cta1 || cta2) content.append(ctas);

  block.textContent = '';
  block.append(content);

  // Optional author-supplied background colour (HEX)
  const hex = bgColourCell ? bgColourCell.textContent.trim() : '';
  if (hex && HEX_RE.test(hex)) {
    block.style.setProperty('--feature-bg', hex);
    block.classList.add('feature-has-bg');
    if (isDark(hex)) block.classList.add('feature-bg-dark');
  }
}

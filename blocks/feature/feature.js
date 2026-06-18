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
 * Collapsed model cells (in order): title (heading level → titleType), text
 * (richtext), ctas group (ctas_cta1 + ctas_cta2 links → *Text), backgroundColour.
 */
export default function decorate(block) {
  const rows = [...block.children];
  const cell = (i) => (rows[i] ? rows[i].querySelector(':scope > div') || rows[i] : null);

  const titleCell = cell(0);
  const textCell = cell(1);
  const ctasCell = cell(2);
  const bgColourCell = cell(3);

  const content = document.createElement('div');
  content.className = 'feature-content';

  const heading = titleCell ? titleCell.querySelector('h1, h2, h3, h4, h5, h6') : null;
  const titleText = heading ? heading.textContent.trim() : (titleCell?.textContent.trim() || '');
  if (titleText) {
    const tag = heading ? heading.tagName.toLowerCase() : 'h3';
    const titleEl = document.createElement(tag);
    titleEl.className = 'feature-title';
    titleEl.textContent = titleText;
    content.append(titleEl);
  }

  if (textCell && textCell.textContent.trim()) {
    const text = document.createElement('div');
    text.className = 'feature-text';
    text.append(...textCell.childNodes);
    content.append(text);
  }

  const buildCta = (anchor, primary) => {
    if (!anchor) return null;
    const href = anchor.getAttribute('href');
    const label = anchor.textContent.trim();
    if (!href || !label) return null;
    const cta = document.createElement('a');
    cta.className = `feature-cta button${primary ? ' feature-cta-primary' : ' feature-cta-secondary'}`;
    cta.href = href;
    cta.textContent = label;
    return cta;
  };

  const anchors = ctasCell ? [...ctasCell.querySelectorAll('a')] : [];
  const ctas = document.createElement('div');
  ctas.className = 'feature-ctas';
  const cta1 = buildCta(anchors[0], true);
  const cta2 = buildCta(anchors[1], false);
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

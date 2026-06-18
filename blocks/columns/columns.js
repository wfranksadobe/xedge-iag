import { decorateBlock, loadBlock } from '../../scripts/aem.js';

export default async function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  // Decorate and load any nested blocks authored inside a column
  // (e.g. a Feature block embedded within the columns block).
  const KNOWN_NESTED = ['feature', 'teaser', 'banner', 'cards', 'quote'];
  const nestedBlocks = KNOWN_NESTED
    .flatMap((name) => [...block.querySelectorAll(`.${name}`)])
    .filter((el) => !el.dataset.blockStatus);
  await Promise.all(nestedBlocks.map(async (nested) => {
    decorateBlock(nested);
    await loadBlock(nested);
  }));
}

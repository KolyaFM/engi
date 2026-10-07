import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('decks.css contains mobile touch targets, safe-area insets, dark mode and reduced motion', async () => {
  const css = await readFile(new URL('../src/components/knowledge/decks.css', import.meta.url), 'utf8');

  assert(css.includes('env(safe-area-inset-bottom)'), 'Safe-area inset bottom must be supported for iOS PWA');
  assert(css.includes('touch-action: manipulation'), 'Touch action manipulation must be set on interactive targets');
  assert(css.includes('min-height: 44px'), '44px minimum touch targets must be preserved for buttons');
  assert(css.includes('.dark .deck-card'), 'Dark mode styles must be present');
  assert(css.includes('prefers-reduced-motion'), 'Reduced motion accessibility query must be present');
  assert(css.includes('object-fit: contain'), 'Thumbnails must use object-fit: contain to avoid cropping images');
});
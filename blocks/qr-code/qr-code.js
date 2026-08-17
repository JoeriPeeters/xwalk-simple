import QRCode from 'qrcode';
import { moveInstrumentation } from '../../scripts/scripts.js';
// 'qrcode' resolves via the <script type="importmap"> entry in head.html.
// Listed in package.json "dependencies" (not devDependencies) since block
// code imports it directly by bare specifier — see AGENTS notes on the
// npm-import-demo block for why that distinction matters to eslint.

export default async function decorate(block) {
  const [urlRow, labelRow] = block.children;
  const url = urlRow?.querySelector('a')?.href
    || urlRow?.querySelector('p')?.textContent?.trim()
    || '';
  const label = labelRow?.querySelector('p')?.textContent?.trim() || '';

  block.textContent = '';

  if (!url) {
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'qr-code-wrapper';

  const canvas = document.createElement('canvas');
  wrapper.append(canvas);

  if (label) {
    const caption = document.createElement('p');
    caption.className = 'qr-code-label';
    caption.textContent = label;
    wrapper.append(caption);
  }

  moveInstrumentation(block, wrapper);
  block.append(wrapper);

  try {
    await QRCode.toCanvas(canvas, url, { width: 200, margin: 1 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('qr-code: failed to render QR code', error);
  }
}

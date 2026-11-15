import { initShell } from '../core/shell.js';
import { PatternStudio, PRESETS } from '../pattern/studio.js';
import { toast } from '../core/ui.js';
import { canvasToBlob, downloadBlob } from '../core/util.js';
import { saveWork, getWork, loadJSON, saveJSON } from '../core/storage.js';

initShell();

const AUTOSAVE_KEY = 'yantra.pattern.v1';
const AUTOSAVE_ON = 'yantra.pattern.autosave';
let autosave = loadJSON(AUTOSAVE_ON, true);

const studio = new PatternStudio({
  onToast: (m) => toast(m),
  onCommit: (s) => { if (autosave) saveJSON(AUTOSAVE_KEY, s); },
});

// Initial state priority: ?load=<gallery id> > ?preset= > saved auto-save > defaults
const params = new URLSearchParams(location.search);
let initial = autosave ? loadJSON(AUTOSAVE_KEY) : null;
if (params.get('load')) { const w = getWork(params.get('load')); if (w && w.settings) initial = w.settings; }
studio.init(initial || undefined);
if (params.get('preset') && PRESETS[params.get('preset')]) studio.applyPreset(params.get('preset'));
if (params.get('random')) studio.randomPattern();

const auto = document.getElementById('autoSaveToggle');
auto.setAttribute('aria-pressed', String(autosave));
auto.addEventListener('click', () => {
  autosave = !autosave;
  auto.setAttribute('aria-pressed', String(autosave));
  saveJSON(AUTOSAVE_ON, autosave);
  if (autosave) saveJSON(AUTOSAVE_KEY, studio.settings);
  toast(`Auto-save ${autosave ? 'enabled' : 'disabled'}`);
});

document.getElementById('downloadBtn').addEventListener('click', async () => {
  try {
    const blob = await canvasToBlob(studio.renderOffscreen(2048));
    downloadBlob(blob, `yantra-pattern-${Date.now()}.png`);
    toast('Pattern downloaded (2048×2048)', 'success');
  } catch (e) { toast(e.message, 'error'); }
});

document.getElementById('saveBtn').addEventListener('click', () => {
  try {
    const image = studio.renderOffscreen(640).toDataURL('image/jpeg', 0.88);
    const name = `${document.getElementById('infoTheme').textContent} ${studio.settings.symmetry}-fold`;
    saveWork({ kind: 'pattern', name, image, settings: { ...studio.settings } });
    toast('Saved to your gallery', 'success');
  } catch (e) { toast(e.message, 'error'); }
});

document.getElementById('shareBtn').addEventListener('click', async () => {
  try {
    const blob = await canvasToBlob(studio.renderOffscreen(1200));
    const file = new File([blob], 'yantra-pattern.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'YANTRA Pattern', text: 'Check out this sacred geometric pattern I created!' });
    } else if (navigator.share) {
      await navigator.share({ title: 'YANTRA Pattern', text: 'Check out this sacred geometric pattern I created!', url: location.href });
    } else if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast('Pattern copied to clipboard', 'success');
    } else {
      downloadBlob(blob, 'yantra-pattern.png');
      toast('Sharing is not supported here — downloaded instead');
    }
  } catch (e) { if (e && e.name !== 'AbortError') toast('Could not share this pattern', 'error'); }
});

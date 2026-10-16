// Layout preferences; built-in Actions now ship inside the native WASM engine.
export const PDF_TRANSFER = '__quincy_flattened_pdf__.png';

export function revealActionsOnce(storage = globalThis.localStorage) {
  if (storage.getItem('quincy.actions.revealed.v1')) return;
  const prefs = JSON.parse(storage.getItem('photocraft.preferences') || '{}');
  const layout = prefs.panelLayout ?? {};
  layout.panels = {layers: true, properties: true, color: true, navigator: false, toolbar: true,
    options_bar: true, status_bar: true, ...layout.panels, history: true};
  layout.dockTabs = {...layout.dockTabs, history: 1};
  layout.dock = {...layout.dock, collapsed: (layout.dock?.collapsed ?? []).filter(g => g !== 'history')};
  if (layout.dock.hidden_tabs?.history) layout.dock.hidden_tabs.history = layout.dock.hidden_tabs.history.filter(n => n !== 'Actions');
  prefs.panelLayout = layout;
  storage.setItem('photocraft.preferences', JSON.stringify(prefs));
  storage.setItem('quincy.actions.revealed.v1', '1');
}

// One-time upgrade to the full-height, collapsible Actions/History column.
// Later layout choices and locked workspaces remain under the user's control.
export function dockActionsColumnOnce(storage = globalThis.localStorage) {
  const marker = 'quincy.actions.column.v2';
  if (storage.getItem(marker)) return;
  const prefs = JSON.parse(storage.getItem('photocraft.preferences') || '{}');
  if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs)) throw new Error('Invalid preferences');
  if (prefs.workspaceLocked) { storage.setItem(marker, '1'); return; }
  const layout = prefs.panelLayout && typeof prefs.panelLayout === 'object' ? prefs.panelLayout : {};
  layout.panels = {...layout.panels, dock: true, rail: true, history: false};
  layout.dock = {...layout.dock, actions_in_rail: true, actions_rail_open: true, actions_rail_history: false};
  prefs.panelLayout = layout;
  storage.setItem('photocraft.preferences', JSON.stringify(prefs));
  storage.setItem(marker, '1');
}

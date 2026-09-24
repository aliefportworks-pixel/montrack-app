/* Ikon line stroke 1.5px (design.md — Atoms) */
window.Icons = {
  _svg: function (body) {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
      'stroke-linecap="round" stroke-linejoin="round" class="w-full h-full" aria-hidden="true">' +
      body +
      '</svg>'
    );
  },
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/>',
  wallet:
    '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1.2" fill="currentColor" stroke="none"/>',
  chart: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.6 1.6M17.4 17.4 19 19M19 5l-1.6 1.6M6.6 17.4 5 19"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrowUpRight: '<path d="M7 17 17 7"/><path d="M9 7h8v8"/>',
  arrowDownLeft: '<path d="M17 7 7 17"/><path d="M15 17H7V9"/>',
  bell: '<path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z"/><path d="M10 18.5a2 2 0 0 0 4 0"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:
    '<path d="M4 4l16 16"/><path d="M9.9 5.9A9.4 9.4 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.6 17.6 0 0 1-3 3.8"/><path d="M6.6 7.6A16.8 16.8 0 0 0 2.5 12S6 18.5 12 18.5a9.7 9.7 0 0 0 4-.85"/><path d="M9.9 10a3 3 0 0 0 4.2 4.2"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronLeft: '<path d="m14 6-6 6 6 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  calendar:
    '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 9.5h17"/><path d="M8 3v4M16 3v4"/>',
  check: '<path d="m5 12.5 5 5L19 7"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  clip: '<path d="M20 11.5 12.7 18.8a4.6 4.6 0 0 1-6.5-6.5L14 4.5a3.1 3.1 0 1 1 4.4 4.4l-7.7 7.7a1.6 1.6 0 0 1-2.2-2.2l7-7"/>',
  trash:
    '<path d="M4.5 7h15"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M6.5 7l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12"/><path d="M10 11v5M14 11v5"/>',
  dots: '<circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
  logout: '<path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2"/><path d="M10 12h10"/><path d="m17 9 3 3-3 3"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  coin: '<ellipse cx="12" cy="7" rx="7.5" ry="3"/><path d="M4.5 7v10c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V7"/><path d="M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"/>',
  alert: '<path d="M12 8v5"/><circle cx="12" cy="16.5" r="0.8" fill="currentColor" stroke="none"/><path d="M10.3 4.2 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r="0.8" fill="currentColor" stroke="none"/>',
};

Object.keys(window.Icons).forEach(function (key) {
  if (typeof window.Icons[key] === 'string' && key !== '_svg') {
    window.Icons[key] = window.Icons._svg(window.Icons[key]);
  }
});

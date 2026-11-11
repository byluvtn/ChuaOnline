// Inline SVG line icons (24x24, currentColor). Static strings only, never user input.
const S = (body: string) =>
  `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

const beads = Array.from({ length: 9 }, (_, i) => {
  const a = (i / 9) * Math.PI * 2;
  return `<circle cx="${(12 + Math.cos(a) * 7.5).toFixed(2)}" cy="${(10 + Math.sin(a) * 7.5).toFixed(2)}" r="1.5" fill="currentColor" stroke="none"/>`;
}).join('');

export const ICONS: Record<string, string> = {
  bow: S('<path d="M12 3c-3 3-4.2 7-4 11l4 6 4-6c.2-4-1-8-4-11z"/><path d="M12 3v17"/>'),
  incense: S('<path d="M9.5 22V11M14.5 22V11M7 22h10"/><path d="M9.5 8c-1.4-1.4 1.4-2.4 0-4.5M14.5 8c-1.4-1.4 1.4-2.4 0-4.5"/>'),
  chant: S(`${beads}<path d="M12 17.5v4.5M10.5 22h3"/>`),
  palms: S('<path d="M12 3c-2.200 2.600-3.200 5.400-3.200 8.200L12 19l3.200-7.800C15.200 8.400 14.200 5.600 12 3z"/><path d="M12 3v16M7 14.500c-1.200.8-2 2-2 3.500M17 14.500c1.200.8 2 2 2 3.500"/>'),
  beads: S(`<g transform="translate(0 2)">${beads}</g><path d="M12 19.500v2.500"/><circle cx="12" cy="22.200" r="1.200" fill="currentColor" stroke="none"/>`),
  meditate: S('<circle cx="12" cy="5" r="2.2"/><path d="M12 8.2v4.6M7.5 12.8c1.6.6 3 .8 4.5.8s2.9-.2 4.5-.8M4.5 19c2-.2 4-1.4 7.5-1.4s5.500 1.200 7.500 1.400M7 17.800 9.500 14M17 17.800 14.500 14"/>'),
  lantern: S('<path d="M9 3h6M8.500 5h7a2.500 2.500 0 0 1 2.500 2.500v6A2.500 2.500 0 0 1 15.500 16h-7A2.500 2.500 0 0 1 6 13.500v-6A2.500 2.500 0 0 1 8.500 5z"/><path d="M12 5v11M10 19h4M12 16v3"/>'),
  shop: S('<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8a3 3 0 0 1 6 0"/>'),
  bag: S('<path d="M7 10a5 5 0 0 1 10 0v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9z"/><path d="M9 15h6M10 6V4h4v2"/>'),
  scroll: S('<path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M9 9h6M9 13h6M9 17h3"/>'),
  trophy: S('<path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H5a2 2 0 0 0 2 4M16 6h3a2 2 0 0 1-2 4M12 13v4M9 20h6M10 17h4"/>'),
  temple: S('<path d="M2.500 10 12 4l9.500 6M5 10v9M19 10v9M9 19v-6h6v6M3 19h18"/>'),
  exit: S('<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9"/>'),
  coin: S('<circle cx="12" cy="12" r="9"/><rect x="9.800" y="9.800" width="4.400" height="4.400" rx=".6"/>'),
  sound: S('<path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.500 8.500a5 5 0 0 1 0 7M18.500 5.500a9 9 0 0 1 0 13"/>'),
  mute: S('<path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="m16 9 5 6M21 9l-5 6"/>'),
  chat: S('<path d="M4 5h16v11H9l-5 4V5z"/>'),
  close: S('<path d="M6 6l12 12M18 6 6 18"/>'),
  minus: S('<path d="M5 12h14"/>'),
  plus: S('<path d="M12 5v14M5 12h14"/>'),
  lotus: S('<path d="M12 20c-4.500 0-8.500-3-9.500-8 4 0 7.500 2 9.500 5 2-3 5.500-5 9.500-5-1 5-5 8-9.500 8z"/><path d="M12 4c2.400 3 3.200 6.500 0 12-3.200-5.500-2.400-9 0-12z"/>'),
  halo: S('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4" stroke-dasharray="2 2.500"/>'),
  scarf: S('<path d="M5 9c4 3 10 3 14 0v3c-4 3-10 3-14 0V9z"/><path d="M15 14.500 17 21l2-1-1.200-5.500"/>'),
  user: S('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  collapse: S('<path d="M7 7l5 5 5-5M7 13l5 5 5-5"/>'),
  move: S('<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>'),
  expand: S('<path d="M7 11l5-5 5 5M7 17l5-5 5 5"/>'),
  game: S('<rect x="3" y="8" width="18" height="10" rx="5"/><path d="M8 11v4M6 13h4"/><circle cx="15.500" cy="12" r=".8" fill="currentColor"/><circle cx="17.500" cy="14" r=".8" fill="currentColor"/>'),
  festival: S('<path d="M12 3v3M5 7l2 2M19 7l-2 2"/><path d="M8 21v-6a4 4 0 0 1 8 0v6M6 21h12"/><path d="M12 9v3"/>'),
  news: S('<path d="M12 3l2.200 5.300 5.800.5-4.400 3.800 1.400 5.600L12 15l-5 3.200 1.400-5.600L4 8.800l5.800-.5L12 3z"/>'),
  community: S('<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.400"/><path d="M16 14.200a5 5 0 0 1 5 5.800"/>'),
  level: S('<path d="M4 20V14h4v6M10 20V9h4v11M16 20V4h4v16"/>'),
  map: S('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>'),
  checkin: S('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/><path d="m9 15 2 2 4-4"/>'),
  mail: S('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.500 7 8.500 6 8.500-6"/>'),
  fortune: S('<path d="M8 21h8l-1-9H9l-1 9z"/><path d="M10 12 9 3M12 12V2M14 12l1-9"/>'),
  guide: S('<circle cx="12" cy="12" r="9"/><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 .9-1 1.700M12 17v.01"/>'),
  feedback: S('<path d="M4 5h16v11H9l-5 4V5z"/><path d="M8 9h8M8 12h5"/>'),
  donate: S('<path d="M12 20s-7-4.500-7-10a4 4 0 0 1 7-2.500A4 4 0 0 1 19 10c0 5.500-7 10-7 10z"/><path d="M12 9v5M10 11h4" />'),
  facebook: S('<path d="M14 21v-8h3l.5-3.500H14V7.500c0-1 .5-1.700 1.800-1.700H17.500V2.800A20 20 0 0 0 15 2.700c-2.600 0-4 1.600-4 4.200v2.600H8V13h3v8h3z"/>'),
  settings: S('<circle cx="12" cy="12" r="3"/><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3M5.300 5.300l2.100 2.100M16.600 16.600l2.100 2.100M18.700 5.300l-2.100 2.100M7.400 16.600l-2.100 2.100"/>'),
  install: S('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 19h14"/>'),
  heart: S('<path d="M12 20s-7-4.500-7-10a4 4 0 0 1 7-2.500A4 4 0 0 1 19 10c0 5.500-7 10-7 10z"/>'),
};
export const iconSvg = (name: string) => ICONS[name] ?? '';

/** Fill every [data-icon] element under root with its SVG. */
export function hydrateIcons(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-icon]').forEach((el) => {
    const svg = ICONS[el.dataset.icon ?? ''];
    if (svg) el.insertAdjacentHTML('afterbegin', svg);
  });
}

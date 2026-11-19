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
  camera: S('<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>'),
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
// ---- warm chibi item illustrations (24x24). One named entry per shop item, never user input.
const W = (body: string) =>
  `<svg viewBox="0 0 24 24" width="1em" height="1em" stroke="#5c3a1e" stroke-width=".85" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${body}</svg>`;
const sparkle = (cx: number, cy: number) =>
  `<path d="M${cx} ${cy - 2.4}l.62 1.78 1.78.62-1.78.62L${cx} ${cy + 3.42}l-.62-1.78-1.78-.62 1.78-.62z" fill="#ffcf4a" stroke="#c98a12" stroke-width=".5"/>`;

/** Warm, individually drawn chibi icons, keyed by shop item id (prefix `it_`). */
export const ITEM_ICONS: Record<string, string> = {
  // ---- Lễ vật
  it_huong_tram: W('<rect x="6.1" y="15.4" width="11.8" height="5.4" rx="2.2" fill="#c98a4b"/><path d="M7.6 18.6h8.8" stroke="#a8683a"/><path d="M9.7 15.2V6.9M12 15.2V5.7M14.3 15.2V6.9" stroke="#8a5a2e" stroke-width="1.1"/><circle cx="9.7" cy="6.2" r="1.2" fill="#ff9a3c"/><circle cx="12" cy="5" r="1.3" fill="#ffbe55"/><circle cx="14.3" cy="6.2" r="1.2" fill="#ff9a3c"/><path d="M12 3.4c.9-.5.6-1.3 0-1.7" stroke="#c8b9a6" fill="none"/>'),
  it_hoa_sen: W('<path d="M12 20.6c-4.2 0-7.8-2.6-8.6-6.4 3.4-.2 6.4 1.2 8.6 3.6 2.2-2.4 5.2-3.8 8.6-3.6-.8 3.8-4.4 6.4-8.6 6.4z" fill="#f2a0b6"/><path d="M12 4.4c2.6 3 3.2 6.6 0 11.4-3.2-4.8-2.6-8.4 0-11.4z" fill="#f8c4d2"/><path d="M6.6 8.6c2.2 1.6 3.6 3.6 4.4 5.8-2.6.2-5-.8-6.6-2.6.4-1.4 1.2-2.4 2.2-3.2z" fill="#ef8fa6"/><path d="M17.4 8.6c-2.2 1.6-3.6 3.6-4.4 5.8 2.6.2 5-.8 6.6-2.6-.4-1.4-1.2-2.4-2.2-3.2z" fill="#ef8fa6"/><circle cx="12" cy="12.2" r="1.5" fill="#ffd86b"/>'),
  it_den_hoa_dang: W('<path d="M9.6 3.6h4.8" stroke="#8a5a2e" stroke-width="1.2"/><path d="M6 4.4h12" stroke="#e8b64a" stroke-width="1.5"/><rect x="6.4" y="5.2" width="11.2" height="11.6" rx="3.4" fill="#e0412f"/><path d="M9 7.6v6.8M12 7.6v6.8M15 7.6v6.8" stroke="#b3261e"/><path d="M5.6 5.4v11.2M18.4 5.4v11.2" stroke="#e8b64a" stroke-width="1.1"/><path d="M6 16.8h12" stroke="#e8b64a" stroke-width="1.3"/><path d="M12 17.2v3.2" stroke="#b3261e"/><circle cx="12" cy="21.4" r="1.5" fill="#e8b64a"/>'),
  it_nen_sap_ong: W('<path d="M12 2.6c1.4 1.6 1.9 2.7 1.9 3.5a1.9 1.9 0 0 1-3.8 0c0-.8.5-1.9 1.9-3.5z" fill="#ffb24d"/><path d="M8.4 9.6h7.2l-.5 10.4a1.6 1.6 0 0 1-1.6 1.5h-3a1.6 1.6 0 0 1-1.6-1.5z" fill="#f0c26a"/><path d="M9.2 10.6h5.6" stroke="#c28a2c"/><path d="M12 6.4v3" stroke="#7a4a1c" stroke-width="1.1"/><rect x="6.6" y="20.2" width="10.8" height="2.2" rx="1.1" fill="#b3954f"/>'),
  it_hoa_dang_phat: W('<path d="M12 10.4c-2 0-3.8-1.6-3.8-3.6S10 3.2 12 3.2s3.8 1.6 3.8 3.6-1.8 3.6-3.8 3.6z" fill="#f6b7c8"/><path d="M8.4 12.4c-2 .4-3.6-.4-4.2-2 1.8-1 3.6-.8 5 .4z" fill="#f2809e"/><path d="M15.6 12.4c2 .4 3.6-.4 4.2-2-1.8-1-3.6-.8-5 .4z" fill="#f2809e"/><path d="M12 12.6v3.6M9.6 16.2h4.8" stroke="#4f8a4a" stroke-width="1.1"/><path d="M6.4 18.2h11.2l-1.2 3.2H7.6z" fill="#c9b27a"/><circle cx="12" cy="7.2" r="1.1" fill="#ffe08a"/>'),
  // ---- Đồ ăn
  it_pho_chay: W('<path d="M3.6 11.6h16.8c0 4.6-3.8 8.2-8.4 8.2s-8.4-3.6-8.4-8.2z" fill="#e9e1cb"/><path d="M3.6 11.6h16.8" stroke="#b9ad90" stroke-width="1.4"/><path d="M6.8 9.8c1.2-1.6 2.8-2.4 5.2-2.4 2.4 0 4 .8 5.2 2.4z" fill="#f6d38a"/><path d="M8.6 8.4c1.4.5 2.6.5 4 0M12.6 8.4c1.4.5 2.6.5 4 0" stroke="#e0a94a"/><path d="M7.4 4.2l10 4.2M9.2 3.4l9.6 4.2" stroke="#8a5a2e" stroke-width="1.1"/><path d="M5.4 6.4c-.9.6-1.2 1.5-.9 2.4M18.6 6.4c.9.6 1.2 1.5.9 2.4" stroke="#6fae57" fill="none"/>'),
  it_com_chay: W('<path d="M6.6 11.2c0-3.2 2.4-5.6 5.4-5.6s5.4 2.4 5.4 5.6z" fill="#fdf6e4"/><path d="M7.8 9c1-1.6 2.4-2.4 4.2-2.4s3.2.8 4.2 2.4" stroke="#e6dcc2" fill="none"/><path d="M4.2 11.6h15.6c0 4.4-3.4 7.8-7.8 7.8s-7.8-3.4-7.8-7.8z" fill="#6fae57"/><path d="M4.2 11.6h15.6" stroke="#4f8a3e" stroke-width="1.4"/><path d="M8 14.6h8" stroke="#4f8a3e"/><circle cx="12" cy="8.4" r=".9" fill="#fff"/>'),
  it_tra_da: W('<path d="M7.4 5.6h9.2l-1.2 14a1.6 1.6 0 0 1-1.6 1.5h-3.6a1.6 1.6 0 0 1-1.6-1.5z" fill="#dff0f5"/><path d="M7.9 10.4h8.2l-.8 9.4a1.2 1.2 0 0 1-1.2 1.1h-4.2a1.2 1.2 0 0 1-1.2-1.1z" fill="#e0a94a"/><rect x="8.8" y="11.6" width="2.2" height="2.2" rx=".5" fill="#fff" stroke="#bcd6de" stroke-width=".5"/><rect x="12.2" y="14.4" width="2" height="2" rx=".5" fill="#fff" stroke="#bcd6de" stroke-width=".5"/><path d="M14.6 4.6 13 10.6" stroke="#e0412f" stroke-width="1.4"/><path d="M7.4 5.6h9.2" stroke="#bcd6de" stroke-width="1.2"/>'),
  // ---- Cây Phật
  it_cay_bo_de: W('<path d="M11 21.4h2l.5-6.4h-3z" fill="#8a5a2e"/><path d="M12 4.2c3.6 0 6.4 2.6 6.4 6 0 3.2-2.6 5.4-6.4 5.4S5.6 13.4 5.6 10.2c0-3.4 2.8-6 6.4-6z" fill="#5fae5a"/><path d="M9 6.6c1.6 2.4 2.6 3.6 4.6 4.2M14.8 7c-.6 2.4-1.8 4.2-3.6 5.4M7.4 12c2-.6 3.6-.4 5.4.6" stroke="#3f8a45" fill="none"/><path d="M12 15.4v2.2" stroke="#3f8a45" stroke-width="1.2"/><path d="M6.6 19.4h10.8a1.2 1.2 0 0 1 0 2.4H6.6a1.2 1.2 0 0 1 0-2.4z" fill="#c98a4b"/>'),
  it_cay_truc: W('<path d="M8.2 21.4V6.4M12 21.4V3.4M15.8 21.4V6.4" stroke="#4f8a3e" stroke-width="2.4"/><path d="M7 10.6h2.4M10.8 8.2h2.4M14.6 12.6H17M7 15.6h2.4M10.8 13.4h2.4M14.6 17.6H17" stroke="#3f8a45" stroke-width="1.1"/><path d="M12 6.4c1.6-.6 2.8 0 3.4 1.2-1.4.7-2.6.2-3.4-1.2z" fill="#6fbf5c"/><path d="M12 10c-1.6-.6-2.8 0-3.4 1.2 1.4.7 2.6.2 3.4-1.2z" fill="#6fbf5c"/>'),
  // ---- Áo tràng
  it_ao_trang_nau: W('<path d="M9.4 3.8 12 5.2l2.6-1.4 3.4 2.4v4l-1.8.6v9.4H7.8V10.8l-1.8-.6v-4z" fill="#8a5a3a"/><path d="M12 5.2v11.6" stroke="#6b4426"/><path d="M9.8 8.8c1.4.7 3 .7 4.4 0" stroke="#6b4426"/><path d="M7.8 12.4h8.4" stroke="#6b4426"/>'),
  it_ao_trang_vang: W('<path d="M9.4 3.8 12 5.2l2.6-1.4 3.4 2.4v4l-1.8.6v9.4H7.8V10.8l-1.8-.6v-4z" fill="#e8b64a"/><path d="M12 5.2v11.6" stroke="#b9851f"/><path d="M9.8 8.8c1.4.7 3 .7 4.4 0" stroke="#b9851f"/>' + sparkle(17.4, 6.4)),
  it_ao_trang_truc: W('<path d="M9.4 3.8 12 5.2l2.6-1.4 3.4 2.4v4l-1.8.6v9.4H7.8V10.8l-1.8-.6v-4z" fill="#5b8ac0"/><path d="M12 5.2v11.6" stroke="#3d6a9c"/><path d="M9.8 8.8c1.4.7 3 .7 4.4 0" stroke="#3d6a9c"/>'),
  it_ao_dai_hong_sen: W('<path d="M9.6 3.6 12 5l2.4-1.4 3.2 2.6v3.6l-1.6.4v3.4l1.6 6.6h-3.4L12 14.6 9.8 20.2H6.4l1.8-6.6V10.2l-1.6-.4V6.2z" fill="#e8738f"/><path d="M12 5v9.4" stroke="#c4516d"/><path d="M8.6 6.2c1 .9 2.2 1.3 3.4 1.3s2.4-.4 3.4-1.3" stroke="#c4516d"/><path d="M8.2 20.2h7.6" stroke="#f6f1e2" stroke-width="1.6"/>'),
  it_ao_dai_vang_nhat: W('<path d="M9.6 3.6 12 5l2.4-1.4 3.2 2.6v3.6l-1.6.4v3.4l1.6 6.6h-3.4L12 14.6 9.8 20.2H6.4l1.8-6.6V10.2l-1.6-.4V6.2z" fill="#eccb70"/><path d="M12 5v9.4" stroke="#b8943a"/><path d="M8.6 6.2c1 .9 2.2 1.3 3.4 1.3s2.4-.4 3.4-1.3" stroke="#b8943a"/><path d="M8.2 20.2h7.6" stroke="#f6f1e2" stroke-width="1.6"/>'),
  it_ba_ba_nau: W('<path d="M7.4 5.6C8.8 4.6 10.3 4 12 4s3.2.6 4.6 1.6l1.8 3.8-2.3.9-1.1-2v11.3H8.6V8.3l-1.1 2-2.3-.9z" fill="#8a5a3a"/><path d="M12 4.4v3.4" stroke="#6b4426"/><path d="M9 10.8h6" stroke="#6b4426"/><path d="M7.4 5.6 9 6.6M16.6 5.6 15 6.6" stroke="#6b4426"/>'),
  it_ba_ba_tim: W('<path d="M7.4 5.6C8.8 4.6 10.3 4 12 4s3.2.6 4.6 1.6l1.8 3.8-2.3.9-1.1-2v11.3H8.6V8.3l-1.1 2-2.3-.9z" fill="#8a6fb0"/><path d="M12 4.4v3.4" stroke="#6a4f8e"/><path d="M9 10.8h6" stroke="#6a4f8e"/><path d="M7.6 20.4h8.8" stroke="#3a3110" stroke-width="1.4"/>'),
  it_ao_lam: W('<path d="M7.4 5.6C8.8 4.6 10.3 4 12 4s3.2.6 4.6 1.6l1.8 3.8-2.3.9-1.1-2v11.3H8.6V8.3l-1.1 2-2.3-.9z" fill="#7d8794"/><path d="M9.8 4.8 12 7l2.2-2.2" fill="#f6f1e2" stroke="#c9c2b2"/><path d="M9 10.8h6M12 10.8v6.6" stroke="#616b77"/>'),
  // ---- Tràng hạt
  it_trang_hat: W('<circle cx="12" cy="13" r="7.2" fill="none" stroke="#a8683a" stroke-width="1.1" stroke-dasharray="1.6 1.9"/><circle cx="6.2" cy="9.4" r="1.5" fill="#c98a4b"/><circle cx="9" cy="6.6" r="1.5" fill="#c98a4b"/><circle cx="12.6" cy="5.9" r="1.5" fill="#c98a4b"/><circle cx="16" cy="7.4" r="1.5" fill="#c98a4b"/><circle cx="18.2" cy="10.4" r="1.5" fill="#c98a4b"/><circle cx="18" cy="14.4" r="1.5" fill="#c98a4b"/><circle cx="15.4" cy="17.8" r="1.5" fill="#c98a4b"/><circle cx="11.4" cy="19.4" r="1.5" fill="#c98a4b"/><circle cx="7.6" cy="18" r="1.5" fill="#c98a4b"/><circle cx="5.4" cy="14.6" r="1.5" fill="#c98a4b"/><circle cx="12" cy="22.1" r="1.5" fill="#e8b64a"/><path d="M12 19.4v-.8" stroke="#a8683a"/>'),
  it_trang_hat_ngoc: W('<circle cx="12" cy="13" r="7.2" fill="none" stroke="#cbb98e" stroke-width="1" stroke-dasharray="1.6 1.9"/><circle cx="6.2" cy="9.4" r="1.5" fill="#fdf6e4"/><circle cx="9" cy="6.6" r="1.5" fill="#f6ecda"/><circle cx="12.6" cy="5.9" r="1.5" fill="#fdf6e4"/><circle cx="16" cy="7.4" r="1.5" fill="#f6ecda"/><circle cx="18.2" cy="10.4" r="1.5" fill="#fdf6e4"/><circle cx="18" cy="14.4" r="1.5" fill="#f6ecda"/><circle cx="15.4" cy="17.8" r="1.5" fill="#fdf6e4"/><circle cx="11.4" cy="19.4" r="1.5" fill="#f6ecda"/><circle cx="7.6" cy="18" r="1.5" fill="#fdf6e4"/><circle cx="5.4" cy="14.6" r="1.5" fill="#f6ecda"/><circle cx="6.8" cy="8.4" r=".55" fill="#fff"/><circle cx="15.4" cy="6.6" r=".55" fill="#fff"/><circle cx="12" cy="22.1" r="1.5" fill="#9fd3c8"/><path d="M12 19.4v-.8" stroke="#cbb98e"/>'),
  // ---- Bồ đoàn
  it_bo_doan_do: W('<path d="M4.4 14.2c0-3.6 3.4-6.2 7.6-6.2s7.6 2.6 7.6 6.2c0 3.4-3.4 5.8-7.6 5.8s-7.6-2.4-7.6-5.8z" fill="#b8403a"/><path d="M6.2 13c1.6-2 3.6-3 5.8-3s4.2 1 5.8 3" stroke="#8f2b26" fill="none"/><path d="M9 15.4c1-1 2-1.4 3-1.4s2 .4 3 1.4" stroke="#f0a08a" fill="none"/><path d="M6 19.6h12" stroke="#8f2b26" stroke-width="1.4"/>'),
  it_bo_doan_vang: W('<path d="M4.4 14.2c0-3.6 3.4-6.2 7.6-6.2s7.6 2.6 7.6 6.2c0 3.4-3.4 5.8-7.6 5.8s-7.6-2.4-7.6-5.8z" fill="#c9762f"/><path d="M5.6 12.6c1.8-2.2 3.9-3.2 6.4-3.2s4.6 1 6.4 3.2" stroke="#e8b64a" stroke-width="1.5" fill="none"/><path d="M9 15.6c1-1 2-1.4 3-1.4s2 .4 3 1.4" stroke="#ffe6a8" fill="none"/><path d="M6 19.6h12" stroke="#a85a1c" stroke-width="1.4"/>'),
  // ---- Mũ
  it_mu_sen: W('<path d="M12 3.4c2 2.6 2.6 5.6 0 9.2-2.6-3.6-2-6.6 0-9.2z" fill="#f6b7c8"/><path d="M8.6 6c1.4 1.2 2.2 2.6 2.6 4-1.8 0-3.2-.8-4-2 .2-.8.6-1.4 1.4-2z" fill="#ef8fa6"/><path d="M15.4 6c-1.4 1.2-2.2 2.6-2.6 4 1.8 0 3.2-.8 4-2-.2-.8-.6-1.4-1.4-2z" fill="#ef8fa6"/><path d="M4.6 13.6c0-1.2 3.3-2 7.4-2s7.4.8 7.4 2-3.3 2.6-7.4 2.6-7.4-1.4-7.4-2.6z" fill="#8a5a3a"/><path d="M5.4 15.4c1.6 1 4 1.6 6.6 1.6s5-.6 6.6-1.6" stroke="#6b4426" fill="none"/>'),
  it_khan_do: W('<path d="M6.6 5.4c3.6 2.2 7.2 2.2 10.8 0v3.4c-3.6 2.2-7.2 2.2-10.8 0z" fill="#d6453c"/><path d="M9.4 8.6c1.8 1.2 3.4 3 4.2 5 .8 2 .6 4.4-.6 6.4-1.6-1.2-2.6-2.8-3-4.8-.4-2-.2-4.2.6-6.6z" fill="#e8665b"/><path d="M14.6 8.8c1 1.4 1.4 2.8 1 4.4" stroke="#b3261e" fill="none"/>'),
  it_mu_truc: W('<path d="M3.8 15.2c0-4.6 3.7-8.2 8.2-8.2s8.2 3.6 8.2 8.2z" fill="#e0bd77"/><path d="M3.8 15.2h16.4" stroke="#b08a50" stroke-width="1.5"/><path d="M7.4 9.6c.8 1.6 1.2 3.2 1.2 5.2M12 7.2v7.8M16.6 9.6c-.8 1.6-1.2 3.2-1.2 5.2" stroke="#c49a58" fill="none"/><path d="M5.6 17.2h12.8a1 1 0 0 1 0 2H5.6a1 1 0 0 1 0-2z" fill="#c98a4b"/>'),
  it_non_la: W('<path d="M12 3.8 21 15.4c-2.7 1.7-5.7 2.6-9 2.6s-6.3-.9-9-2.6z" fill="#d9b478"/><path d="M3.4 15.6c2.6-1.7 5.4-2.6 8.6-2.6s6 .9 8.6 2.6" stroke="#b08a50" stroke-width="1.3" fill="none"/><path d="M8 8.4c1 2 1.4 4 1.2 6M14.2 7.6c-1 2-1.4 4-1.2 6" stroke="#c49a58" fill="none"/>'),
  it_khan_dong: W('<path d="M4.6 13.6c0-4.1 3.3-7.4 7.4-7.4s7.4 3.3 7.4 7.4z" fill="#3a4463"/><path d="M4.6 13.6c2.4-1.2 4.9-1.8 7.4-1.8s5 .6 7.4 1.8" stroke="#28304a" stroke-width="1.3" fill="none"/><path d="M12 6.4v7.2M6.6 10.4c3.6.9 7.2.9 10.8 0" stroke="#28304a" fill="none"/><path d="M19 8.4c1.4.8 1.8 2 1 3.4l-1.6-1.2z" fill="#3a4463"/>'),
  // ---- Pháp khí
  it_chuong_nho: W('<path d="M9.4 4.6a2.6 2.6 0 0 1 5.2 0" fill="none" stroke="#8a5a2e" stroke-width="1.1"/><path d="M6.6 16.2V10.8a5.4 5.4 0 0 1 10.8 0v5.4z" fill="#c99a42"/><path d="M8.2 10.6c1-1.6 2.3-2.4 3.8-2.4" stroke="#f0d79a" fill="none"/><path d="M5 16.2h14" stroke="#a87a2a" stroke-width="1.5"/><circle cx="12" cy="18.6" r="1.6" fill="#8a5a2e"/>'),
  it_mo_go: W('<path d="M3.8 13.8c0-3.6 3.6-6.2 8-6.2 5 0 8.4 2.8 8.4 6 0 3-3.2 5-7.8 5-4.8 0-8.6-1.6-8.6-4.8z" fill="#b06a30"/><path d="M8.4 12c2.2.8 4.8.8 7 0" stroke="#7a4218" stroke-width="1.3" fill="none"/><path d="M6.4 10.4c1.4-1.4 3.2-2 5.4-2" stroke="#e0a060" fill="none"/><circle cx="13.4" cy="10.6" r="1" fill="#7a4218"/><path d="M18.6 6.4 15.8 9.8" stroke="#a8622f" stroke-width="2"/><circle cx="19.2" cy="5.8" r="1.8" fill="#c98a4b"/>'),
  // ---- Mây
  it_may_lan: W('<path d="M6.2 12.6c-1.8 0-3.2-1.3-3.2-3s1.4-3 3.2-3c.4-1.9 2-3.2 4-3.2 1.7 0 3.2.9 3.8 2.3.5-.2 1-.3 1.6-.3 2.3 0 4.2 1.7 4.2 3.8 0 .4 0 .7-.1 1 .9.4 1.5 1.3 1.5 2.3 0 1.5-1.3 2.7-2.9 2.7H6.2z" fill="#fdf8ec"/><path d="M7 17.6h6.4M10 20.4h7.4" stroke="#e8dcc4" stroke-width="1.3"/>'),
  // ---- Linh thú
  it_linh_thu_ky_lan: W('<path d="M12 3.2c1 1.5 1.2 2.9.6 4.2" fill="none" stroke="#e8b64a" stroke-width="1.4"/><path d="M7.6 9.2c1.4-2 3-3 4.4-3s3 1 4.4 3c1.6.6 2.6 1.8 2.6 3.4 0 2.4-2.2 4.2-5 4.2-1 0-1.8-.1-2.6-.5-.8.4-1.6.5-2.6.5-2.8 0-5-1.8-5-4.2 0-1.6 1-2.8 2.6-3.4z" fill="#e8b64a"/><circle cx="9.6" cy="10.6" r="1.1" fill="#3a2410"/><circle cx="14.4" cy="10.6" r="1.1" fill="#3a2410"/><path d="M11 13.4c.7.5 1.3.5 2 0" stroke="#8a5a1c" fill="none"/><path d="M5.4 16.2c-1.6-.8-2.6-2-3-3.6 1.6.2 2.8.9 3.6 2M18.6 16.2c1.6-.8 2.6-2 3-3.6-1.6.2-2.8.9-3.6 2" fill="#f0d79a"/><path d="M8 19.4h8" stroke="#c99a42" stroke-width="1.3"/>'),
  // ---- Diều
  it_dieu_sen: W('<path d="M12 3.2 19.4 11 12 18.8 4.6 11z" fill="#f6b7c8"/><path d="M12 3.2v15.6M4.6 11h14.8" stroke="#d4557a" fill="none"/><path d="M12 6.2c1.2 1.2 1.6 2.6 0 4.6-1.6-2-1.2-3.4 0-4.6z" fill="#fff0f4"/><path d="M12 18.8c.4 1.6-.6 2.4-1.4 3 .8 1 .4 1.8-.4 2.2" fill="none" stroke="#d4557a" stroke-width="1.1"/>'),
  // ---- Đồ linh thú
  it_vong_co_lan: W('<circle cx="12" cy="13.4" r="7" fill="none" stroke="#8a5a2e" stroke-width="2.4"/><path d="M7 9.4c1.6-1.4 3.4-2 5-2s3.4.6 5 2" stroke="#c98a4b" stroke-width="1.2" fill="none"/><path d="M12 11.4l1.5 2.2 2.5.3-1.9 1.7.5 2.6-2.6-1.3-2.6 1.3.5-2.6-1.9-1.7 2.5-.3z" fill="#7fd3e0"/><circle cx="10.8" cy="14.4" r=".5" fill="#fff"/><path d="M6.6 20.4h10.8" stroke="#8a5a2e" stroke-width="1.2"/>'),
  // ---- Phóng sinh
  it_chim_phong_sinh: W('<path d="M8.4 12.6c0-2.6 2-4.6 4.6-4.6 2.2 0 4 1.4 4.4 3.4.3 1.6-.3 3.2-1.6 4.2l-.6 2.6h-4l-.6-2.6c-1.4-.6-2.2-1.7-2.2-3z" fill="#8fb0c4"/><circle cx="14.6" cy="9.6" r=".9" fill="#23343c"/><path d="M15.4 10.8 17.8 12l-2.4 1" fill="#e8b64a"/><path d="M9.6 8.6c-1.4-1.4-2.8-1.8-4-1 .6 1.4 1.8 2.2 3.4 2.4" fill="#a9c6d6"/><path d="M9.6 15.8 7.6 20h1.8l1.6-3.4M14 15.8 16 20h-1.8l-1.6-3.4" fill="none" stroke="#5c3a1e"/>'),
  it_ca_phong_sinh: W('<path d="M4 12.6c2.6-3.6 6-5.4 10-5.4 2.6 0 4.8.8 6 2.4-1 1.2-1 2.6 0 3.8-1.2 1.6-3.4 2.4-6 2.4-4 0-7.4-1.8-10-5.4z" fill="#f0913a"/><path d="M12.4 8.2c1.8.6 3 2 3.2 4.2" stroke="#fff3d6" stroke-width="1.6" fill="none"/><circle cx="8.2" cy="11.4" r="1" fill="#3a2410"/><path d="M4 12.6c-1.2-1-1.8-2.2-1.8-3.6 1.4.2 2.6.8 3.4 1.8M4 12.6c-1.2 1-1.8 2.2-1.8 3.6 1.4-.2 2.6-.8 3.4-1.8" fill="#e0762a"/>'),
  it_thuc_an_chim: W('<path d="M8 6.4h8l1.4 13.2a1.2 1.2 0 0 1-1.2 1.4H7.8a1.2 1.2 0 0 1-1.2-1.4z" fill="#d9c49a"/><path d="M8.6 9.4h6.8M8.8 12.6h6.4" stroke="#b9a074" fill="none"/><circle cx="10.4" cy="6.2" r="1.1" fill="#e0b04a"/><circle cx="13.6" cy="5.8" r="1.1" fill="#c99a42"/><path d="M9.8 4.6c.6-.8 1.6-1.2 2.4-1" stroke="#8a5a2e" fill="none"/><path d="M6.8 6.6c1.6-1 3.4-1.6 5.2-1.6s3.6.6 5.2 1.6" stroke="#8a5a2e" fill="none"/>'),
  it_thuc_an_cho_meo: W('<path d="M4 12.6h16c0 4.4-3.6 7.8-8 7.8s-8-3.4-8-7.8z" fill="#c98a4b"/><path d="M4 12.6h16" stroke="#a8683a" stroke-width="1.4"/><path d="M8.6 9.2c0-1.6 1.4-2.8 3.4-2.8s3.4 1.2 3.4 2.8" fill="#f6e0c0"/><circle cx="9.4" cy="7.6" r="1.6" fill="#e8804a"/><circle cx="12" cy="6.4" r="1.6" fill="#e8804a"/><circle cx="14.6" cy="7.6" r="1.6" fill="#e8804a"/><path d="M8 17.4h8" stroke="#8a5a2e"/>'),
  // ---- Hạt giống
  it_hat_soi: W('<path d="M7 12.6c0-3.2 2.2-5.4 5-5.4s5 2.2 5 5.4v3.8c0 1.6-1.2 2.8-2.8 2.8h-4.4c-1.6 0-2.8-1.2-2.8-2.8z" fill="#d9a25a"/><path d="M6.6 8.4c1.4-1.6 3.2-2.4 5.4-2.4s4 .8 5.4 2.4-1 3-5.4 3-6.8-1.4-5.4-3z" fill="#a8683a"/><path d="M10 7.2h4" stroke="#7a4a20"/><path d="M9.2 12.6c1.2.6 2 .6 3.2 0" stroke="#f0c88a" fill="none"/>'),
  it_hat_thong: W('<path d="M12 4.2c2.4 1.6 3.6 4 3.6 7s-1.2 5.4-3.6 7c-2.4-1.6-3.6-4-3.6-7s1.2-5.4 3.6-7z" fill="#a8683a"/><path d="M8.8 8.2h6.4M8.6 11.4h6.8M8.8 14.6h6.4M9.8 17.4h4.4" stroke="#7a4a20" fill="none"/><path d="M12 4.4v13" stroke="#8a5a2e" stroke-width="1.1"/>'),
  it_hat_bo_de: W('<circle cx="12" cy="12.4" r="7" fill="#c98a4b"/><circle cx="9.6" cy="10.2" r="1" fill="#8a5a2e"/><circle cx="14.4" cy="10.6" r="1" fill="#8a5a2e"/><circle cx="12" cy="14.8" r="1" fill="#8a5a2e"/><circle cx="12" cy="12.6" r="1.1" fill="#f0c88a"/><path d="M12 5.4c1.4 0 2.4.6 3 1.6" stroke="#a8683a" fill="none"/>'),
  it_hat_soi_tot: W('<path d="M7 13.6c0-3.2 2.2-5.4 5-5.4s5 2.2 5 5.4v2.8c0 1.6-1.2 2.8-2.8 2.8h-4.4c-1.6 0-2.8-1.2-2.8-2.8z" fill="#e0b45a"/><path d="M6.6 9.4c1.4-1.6 3.2-2.4 5.4-2.4s4 .8 5.4 2.4-1 3-5.4 3-6.8-1.4-5.4-3z" fill="#b8842e"/>' + sparkle(18.4, 5.4) + sparkle(6.2, 16.4)),
  it_hat_thong_tot: W('<path d="M12 5.2c2.4 1.6 3.6 3.8 3.6 6.6s-1.2 5-3.6 6.6c-2.4-1.6-3.6-3.8-3.6-6.6s1.2-5 3.6-6.6z" fill="#b8842e"/><path d="M8.8 9h6.4M8.6 12h6.8M9 15h6" stroke="#8a5c18" fill="none"/><path d="M12 5.4v12.6" stroke="#a06a20" stroke-width="1.1"/>' + sparkle(18.6, 6) + sparkle(5.8, 16.8)),
  it_hat_bo_de_tot: W('<circle cx="12" cy="13" r="6.6" fill="#e0b45a"/><circle cx="9.8" cy="11" r="1" fill="#8a5a2e"/><circle cx="14.2" cy="11.4" r="1" fill="#8a5a2e"/><circle cx="12" cy="15.2" r="1" fill="#8a5a2e"/><circle cx="12" cy="13.2" r="1.1" fill="#f6dca0"/>' + sparkle(18.4, 5.2) + sparkle(5.8, 17.2)),
  // ---- Đồ tịnh thất
  it_tt_chieu_coi: W('<rect x="3.4" y="9.6" width="17.2" height="9.4" rx="1.6" fill="#d9c08a"/><path d="M3.4 12.2h17.2M3.4 14.8h17.2M3.4 17.4h17.2" stroke="#bda26a"/><path d="M8 9.6v9.4M12 9.6v9.4M16 9.6v9.4" stroke="#c8ad76"/><path d="M2.8 8.2h18.4l-1 1.4H3.8z" fill="#cbb180"/><path d="M4.8 19h14.4l-1 2H5.8z" fill="#cbb180"/>'),
  it_tt_den_long: W('<path d="M12 2.6v2.2" stroke="#8a5a2e" stroke-width="1.1"/><path d="M7 4.8h10" stroke="#a8622f" stroke-width="1.4"/><path d="M6.4 6.6h11.2l1.2 8.2H5.2z" fill="#f0a83c"/><path d="M7.4 6.6 6.4 14.8M12 6.6v8.2M16.6 6.6l1 8.2" stroke="#c9762f" fill="none"/><path d="M5.2 14.8h13.6l-1 2H6.2z" fill="#c9762f"/><path d="M12 16.8v2.6" stroke="#e0412f"/><path d="M10.8 19.4h2.4l-.6 2.4h-1.2z" fill="#e0412f"/>'),
  it_tt_chuong_gio: W('<path d="M4.6 5.4h14.8" stroke="#c98a4b" stroke-width="1.5"/><path d="M12 5.4v1.6" stroke="#8a5a2e"/><path d="M8 7.2v3.4M12 7.2v5.4M16 7.2v3.4" stroke="#c9a23c" stroke-width="1.2"/><path d="M7 10.6h2l-.5 4.4h-1zM11 12.6h2l-.5 5h-1zM15 10.6h2l-.5 4.4h-1z" fill="#d9b06a"/><circle cx="8" cy="16.6" r="1" fill="#b08a50"/><circle cx="12" cy="19" r="1" fill="#b08a50"/><circle cx="16" cy="16.6" r="1" fill="#b08a50"/>'),
  it_tt_binh_hoa: W('<path d="M9.4 8.4h5.2l1.4 9.6a1.8 1.8 0 0 1-1.8 2h-4.4a1.8 1.8 0 0 1-1.8-2z" fill="#a9c8dd"/><path d="M9 8.4h6" stroke="#5b8ac0" stroke-width="1.3"/><path d="M9.6 12.6c1.6 1 3.2 1 4.8 0" stroke="#fff" fill="none"/><path d="M12 8.2V5.6" stroke="#4f8a4a" stroke-width="1.1"/><path d="M12 2.8c1.2 1.4 1.6 2.6 0 4.2-1.6-1.6-1.2-2.8 0-4.2z" fill="#f2809e"/><path d="M9.6 4.6c.8.8 1.2 1.6 1.4 2.6-1-.1-1.8-.6-2.4-1.4z" fill="#f6b7c8"/>'),
  it_tt_ban_tra: W('<path d="M3.4 13.6h17.2v2.2H3.4z" fill="#b06a30"/><path d="M6 15.8h2.4v5.4H6zM15.6 15.8H18v5.4h-2.4z" fill="#8a5a2e"/><path d="M9.4 9.4c0-1.6 1.2-2.8 2.8-2.8s2.8 1.2 2.8 2.8v2.6H9.4z" fill="#c98a4b"/><path d="M15 10.4c1.2 0 2 .8 2 1.8s-.8 1.8-2 1.8" fill="none" stroke="#a8683a" stroke-width="1.1"/><path d="M14.6 13.6v1.4" stroke="#a8683a"/><path d="M5.8 12.2h2.4v1.4H5.8z" fill="#e9e1cb"/><path d="M12.2 4.6c.6.8.4 1.4 0 2M12.2 3.2c.6.6.6 1 .2 1.4" stroke="#e0dcc8" fill="none"/>'),
  it_tt_lu_huong: W('<path d="M6 12.4c0-2.6 2.7-4.4 6-4.4s6 1.8 6 4.4c0 2.4-2.4 4.2-6 4.2s-6-1.8-6-4.2z" fill="#c99a42"/><path d="M7.2 11.4c1.4-1.4 3-2 4.8-2" stroke="#f0d79a" fill="none"/><path d="M6 12.6h12" stroke="#a87a2a"/><path d="M8.4 16.2 7 20.4M15.6 16.2 17 20.4M12 16.8v3.6" stroke="#a87a2a" stroke-width="1.3"/><path d="M9.6 7.4V5.2M12 7.4V4.4M14.4 7.4V5.2" stroke="#8a5a2e" stroke-width="1"/><circle cx="9.6" cy="4.6" r="1" fill="#ff9a3c"/><circle cx="12" cy="3.6" r="1.1" fill="#ffbe55"/><circle cx="14.4" cy="4.6" r="1" fill="#ff9a3c"/>'),
  it_tt_tranh_truc: W('<path d="M6.4 2.8h11.2v1.8H6.4z" fill="#8a5a2e"/><path d="M6.4 19.4h11.2v1.8H6.4z" fill="#8a5a2e"/><rect x="7.6" y="4.6" width="8.8" height="14.8" fill="#f6efdb"/><path d="M10.6 7.4c.8 1.8.8 3.6 0 5.6M13.4 9.4c.8 1.6.8 3.2 0 4.8" stroke="#4f8a4a" stroke-width="1.2" fill="none"/><path d="M11 10.4c1.2-.6 2.2-.4 3 .6-1 .8-2 .8-3-.6z" fill="#6fbf5c"/><path d="M9.4 16.4h5.2" stroke="#3a3a3a"/><path d="M9.8 17.8h3.4" stroke="#6a6a6a"/>'),
  it_tt_ke_kinh: W('<path d="M3.6 9.4h16.8v11.2H3.6z" fill="#b06a30"/><path d="M3.6 15h16.8" stroke="#8a5a2e" stroke-width="1.2"/><path d="M6 9.4V6.2h2v3.2M10 9.4V5h2.2v4.4M14.2 9.4V6.6h2.2v2.8" fill="#e8dfc4"/><path d="M6 11h2.4M10.4 11h2.4M14.6 11h2.4" stroke="#8a5a2e"/><path d="M6.6 16.6h5M14 16.6h3.4" stroke="#e0b04a"/>'),
  it_tt_bonsai: W('<path d="M12 9.6c-2.6 0-4.6-1.6-4.6-3.6 0-1.8 1.6-3.2 3.6-3.2 1.6 0 3 .8 3.6 2.2.5-.2 1-.3 1.4-.3 1.6 0 2.8 1.2 2.8 2.6 0 1.4-1.2 2.3-2.8 2.3z" fill="#5fae5a"/><path d="M9.4 5.6c1.4.8 2.2 1.8 2.6 3" stroke="#3f8a45" fill="none"/><path d="M12 9.6v2.6" stroke="#8a5a2e" stroke-width="1.4"/><path d="M6.4 12.4h11.2l-1.6 7.6a1.4 1.4 0 0 1-1.4 1.2H9.4a1.4 1.4 0 0 1-1.4-1.2z" fill="#c96a3c"/><path d="M6.4 12.4h11.2" stroke="#a8532e" stroke-width="1.3"/><path d="M9 18.6h6" stroke="#a8532e"/>'),
  it_tt_phat_nho: W('<path d="M12 3.4a2 2 0 0 1 2 2c0 .8-.4 1.5-1 1.9 1.6.6 2.6 2 2.6 3.6 0 1.2-.6 2.2-1.6 2.8 1.2.5 2 1.6 2 2.9H7.9c0-1.3.9-2.4 2.1-2.9-1-.6-1.6-1.6-1.6-2.8 0-1.6 1-3 2.6-3.6-.6-.4-1-1.1-1-1.9a2 2 0 0 1 2-2z" fill="#e8b64a"/><path d="M9.6 16.6h4.8l.8 3.4H8.8z" fill="#c9762f"/><path d="M12 7.8v6.4" stroke="#b9851f" fill="none"/><circle cx="12" cy="5.4" r=".7" fill="#fff3c4"/>'),
};

export const iconSvg = (name: string) => ICONS[name] ?? ITEM_ICONS[name] ?? '';
export const itemIconSvg = (name: string) => ITEM_ICONS[name] ?? '';

/** Fill every [data-icon] element under root with its SVG. */
export function hydrateIcons(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-icon]').forEach((el) => {
    const svg = ICONS[el.dataset.icon ?? ''];
    if (svg) el.insertAdjacentHTML('afterbegin', svg);
  });
}

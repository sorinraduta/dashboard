import { html, svg } from "../vendor/lit-html.js";

/*
 * The glyphs, as Horah draws them: Lucide's, on its 24-unit grid, at a 1.7
 * stroke unless a mark needs more weight. One definition each, so a glyph is
 * the same everywhere it is used.
 */
const GLYPHS = {
    eye: svg`<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>`,
    eyeOff: svg`<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>`,
    maximize: svg`<path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/>`,
    minimize: svg`<path d="m14 10 7-7"/><path d="M20 10h-6V4"/><path d="m3 21 7-7"/><path d="M4 14h6v6"/>`,
    check: svg`<path d="M20 6 9 17l-5-5"/>`,
    flame: svg`<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>`,
    arrowUpRight: svg`<path d="M7 7h10v10"/><path d="M7 17 17 7"/>`,
    chevronLeft: svg`<path d="m15 18-6-6 6-6"/>`,
    chevronRight: svg`<path d="m9 18 6-6-6-6"/>`,
    x: svg`<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`,
};

export function Icon(name, { size = 17, stroke = 1.7, cls = "" } = {}) {
    return html`<svg class="icon ${cls}" width=${size} height=${size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width=${stroke} stroke-linecap="round" stroke-linejoin="round"
        aria-hidden="true">${GLYPHS[name]}</svg>`;
}

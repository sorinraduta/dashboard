import { injectStyles } from "./styles.js";

/*
 * **The full-screen sheet** that a panel expands into (quests, calendar): a
 * pane of liquid glass over a scrim, held off every edge by the page's own
 * gutter with all four corners round, the way an iOS 26 sheet floats. What it
 * holds is opaque content on the glass — cells on `--color-surface` — because
 * glass under text that is read for more than a moment is mud.
 *
 * It arrives like glass (`omGlassIn`) and leaves the way it came
 * (`omGlassOut` on the mirrored spring); it stays mounted until the departure
 * has finished, because an element removed from the page cannot animate.
 */
const css = `
.sheet-layer {
    position: fixed;
    inset: 0;
    z-index: 1000;
}

.sheet-layer[data-away] {
    pointer-events: none;
}

.sheet-scrim {
    position: absolute;
    inset: 0;
    background: var(--scrim);
    animation: omFadeIn var(--dur-slow) var(--ease-gentle) backwards;
}

.sheet-layer[data-away] .sheet-scrim {
    animation: omFadeOut var(--dur-slow) var(--ease-gentle) forwards;
}

.sheet {
    position: absolute;
    inset: 12px;
    border-radius: calc(var(--radius-sheet) + 8px);
    padding: 16px 20px 20px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    /* A pane the height of the screen: the compositor gets its layer before the first frame. */
    will-change: transform, opacity;
    animation: omGlassIn var(--dur-slow) var(--ease-spring) backwards;
}

.sheet-layer[data-away] .sheet {
    animation: omGlassOut var(--dur-slow) var(--ease-spring-back) forwards;
}

.sheet-bar {
    flex-shrink: 0;
    min-height: 44px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.sheet-titlegroup {
    display: flex;
    align-items: baseline;
    gap: 10px;
    min-width: 0;
}

.sheet-title {
    font-size: var(--text-title-2);
    font-weight: 700;
    letter-spacing: -0.022em;
    color: var(--color-text);
}

.sheet-sub {
    font-size: var(--text-subhead);
    color: var(--label-2);
    font-variant-numeric: tabular-nums;
}

.sheet-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* The bar's circles: the pane's own wash, because they are its furniture and not a second pane. */
.sheet-btn {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: var(--radius-pill);
    background: var(--fill);
    color: var(--label-2);
    cursor: pointer;
}

.sheet-btn.sheet-word {
    width: auto;
    padding: 0 14px;
    font-size: var(--text-subhead);
    font-weight: 590;
    color: var(--color-accent);
}

@media (hover: hover) {
    .sheet-btn:hover {
        background: var(--fill-strong);
        color: var(--color-text);
    }

    .sheet-btn.sheet-word:hover {
        color: var(--color-accent);
    }
}

.sheet-btn:active {
    background: var(--fill-strong);
}

/* A group's caption, the way a settings list heads a section (Horah's ListHeader). */
.sheet-caption {
    flex-shrink: 0;
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 0 16px 6px;
    font-size: var(--text-footnote);
    font-weight: 590;
    letter-spacing: -0.005em;
    color: var(--label-2);
}

.sheet-caption .count {
    margin-left: auto;
    font-weight: 400;
    color: color-mix(in srgb, var(--color-text) 38%, transparent);
    font-variant-numeric: tabular-nums;
}

/* Opaque content on the glass. */
.sheet-cell {
    background: var(--color-surface);
    border-radius: var(--radius-cell);
}
`;

/**
 * Unmount `el` once `surface` has played its departure. `animationend` is the
 * signal; the timer is for when it never comes — Chrome does not run animations
 * in a window it is not painting, and a surface must not outlive its close.
 */
export function removeAfterDeparture(el, surface = el) {
    const remove = () => el.remove();
    surface.addEventListener("animationend", (e) => { if (e.target === surface) remove(); });
    setTimeout(remove, 1000);
}

/**
 * Mount an empty sheet and return it. `onDismiss` runs for a press on the
 * scrim; `close()` plays the departure and unmounts when it ends.
 */
export function openSheet({ className = "", bodyClass, onKey, onDismiss }) {
    injectStyles("sheet", css);

    const layer = document.createElement("div");
    layer.className = "sheet-layer";
    const scrim = document.createElement("div");
    scrim.className = "sheet-scrim";
    const sheet = document.createElement("div");
    sheet.className = `sheet om-glass ${className}`;
    layer.append(scrim, sheet);
    document.body.appendChild(layer);

    if (bodyClass) document.body.classList.add(bodyClass);
    if (onKey) document.addEventListener("keydown", onKey);
    if (onDismiss) scrim.addEventListener("click", onDismiss);

    let closed = false;
    function close() {
        if (closed) return;
        closed = true;
        if (bodyClass) document.body.classList.remove(bodyClass);
        if (onKey) document.removeEventListener("keydown", onKey);
        layer.dataset.away = "";
        removeAfterDeparture(layer, sheet);
    }

    return { sheet, close };
}

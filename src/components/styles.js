const injected = new Set();

export function injectStyles(id, css) {
    if (injected.has(id)) return;
    injected.add(id);
    const style = document.createElement("style");
    style.dataset.component = id;
    style.textContent = css;
    document.head.appendChild(style);
}

/*
 * Shared drag styles, injected once. The row being carried wears the accent —
 * a wash and an accent edge, the one state a surface may mark — and the row it
 * displaced steps back.
 */
injectStyles("drag-shared", `
    .drag-ghost-src {
        background: color-mix(in srgb, var(--color-accent) 16%, transparent) !important;
        box-shadow: inset 0 0 0 1.5px var(--color-accent);
    }
    .drag-ghost-src::before,
    .drag-ghost-src + *::before {
        opacity: 0;
    }
    .drag-ghost-dst {
        opacity: 0.4;
    }
`);

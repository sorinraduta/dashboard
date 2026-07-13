const injected = new Set();

export function injectStyles(id, css) {
    if (injected.has(id)) return;
    injected.add(id);
    const style = document.createElement("style");
    style.dataset.component = id;
    style.textContent = css;
    document.head.appendChild(style);
}

/* Inject shared drag-ghost styles once */
injectStyles("drag-shared", `
    .drag-ghost-src {
        opacity: 0.3;
        outline: 1px dashed var(--accent);
        outline-offset: -1px;
    }
    .drag-ghost-dst {
        opacity: 0.5;
        outline: 1px solid var(--accent);
        outline-offset: -1px;
        background: color-mix(in srgb, var(--accent) 8%, transparent) !important;
    }
`);

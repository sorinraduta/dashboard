/**
 * Reusable drag-and-drop reorder utility — display-position based.
 *
 * WHY display positions (not actual indices) for over/drop:
 *
 *   When we re-render with A moved to slot overIdx, whatever item is now
 *   displayed at slot srcIdx has actualIdx = overIdx, so the check
 *   `idx !== overIdx` is false and the preview never resets — the "go back"
 *   gesture stops working.
 *
 *   By using the visual slot number instead:
 *   • slot === overIdx  →  cursor is on A's ghost      → no-op  (stable, no flicker)
 *   • slot === srcIdx   →  cursor is at A's origin      → reset  (show original order)
 *   • anything else     →  cursor on a different item   → update
 *
 *   At dragstart displayIdx === actualIdx (no preview is active yet), so
 *   start() records the correct array position.
 *
 * Usage:
 *   const drag = createDraggable({
 *       getItems:  () => items,
 *       onReorder: (arr) => { items = arr; save(); },
 *       render:    () => renderFn(),
 *   });
 *
 *   drag.displayItems().map((item, displayIdx) => {
 *       const actualIdx = items.indexOf(item); // only needed for non-drag actions (e.g. toggle)
 *       return html`
 *           <div class="${drag.classFor(displayIdx)}"
 *                draggable="true"
 *                @dragstart=${e => drag.start(e, displayIdx)}
 *                @dragend=${e  => drag.end(e)}
 *                @dragover=${e  => drag.over(e, displayIdx)}
 *                @drop=${e     => drag.drop(e, displayIdx)}>
 *               …
 *           </div>`;
 *   });
 */
export function createDraggable({ getItems, onReorder, render }) {
    let srcIdx = null;   // display-position (= actual position at dragstart)
    let overIdx = null;  // display-position of current hover target

    /** Items in preview order (dragged item inserted at hover slot). */
    function displayItems() {
        const items = getItems();
        if (srcIdx !== null && overIdx !== null && overIdx !== srcIdx) {
            const copy = [...items];
            const [moved] = copy.splice(srcIdx, 1);
            copy.splice(overIdx, 0, moved);
            return copy;
        }
        return items;
    }

    /**
     * CSS class string for the item currently at `displayIdx`.
     *   drag-ghost-src  →  the dragged item rendered at its preview destination
     *   drag-ghost-dst  →  the item occupying the dragged item's original slot
     */
    function classFor(displayIdx) {
        if (srcIdx === null || overIdx === null || overIdx === srcIdx) return "";
        if (displayIdx === overIdx) return "drag-ghost-src";
        if (displayIdx === srcIdx) return "drag-ghost-dst";
        return "";
    }

    function start(e, displayIdx) {
        // displayIdx === actualIdx here because overIdx is null (no preview active)
        srcIdx = displayIdx;
        overIdx = null;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(displayIdx));
    }

    function end(_e) {
        srcIdx = null;
        overIdx = null;
        render();
    }

    function over(e, displayIdx) {
        // Always prevent default so the browser allows drops everywhere,
        // including on the ghost element at overIdx.
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";

        if (displayIdx === srcIdx) {
            // Cursor is back at the dragged item's original slot → reset preview.
            // After re-render the same slot still has displayIdx === srcIdx, so
            // the next dragover returns here without re-rendering → stable, no flicker.
            if (overIdx !== null) {
                overIdx = null;
                render();
            }
            return;
        }

        // Cursor is on the ghost (displayIdx === overIdx) → already correct, skip.
        // Cursor is elsewhere → update target and re-render.
        if (displayIdx !== overIdx) {
            overIdx = displayIdx;
            render();
        }
    }

    function drop(e, displayIdx) {
        e.preventDefault();
        const items = getItems();
        if (srcIdx !== null && displayIdx !== srcIdx) {
            const [moved] = items.splice(srcIdx, 1);
            items.splice(displayIdx, 0, moved);
            onReorder(items);
        }
        srcIdx = null;
        overIdx = null;
        render();
    }

    return {
        displayItems,
        classFor,
        start,
        end,
        over,
        drop,
        get active() { return srcIdx !== null; },
    };
}

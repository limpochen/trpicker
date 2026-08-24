/**
 * trPicker — Viewport transform module
 * =====================================
 * Centralizes zooming and panning of the SVG viewBox.
 * A pure geometry engine: only considers coordinates and dimensions, unaware of dial elements.
 * Drives smooth transitions via rAF.
 */
import trPicker from './trpicker.js';

const P = trPicker.prototype;
const VB = trPicker.APPEARANCE.viewBox;
const ZOOM = trPicker.APPEARANCE.zoom;
const CX = trPicker.APPEARANCE.centerX;
const CY = trPicker.APPEARANCE.centerY;

    /**
     * Initialize the viewport state.
     * Called after the SVG element is created (_initInlineMode / _initPopupMode).
     */
    P._initZoom = function(svg) {
        this._svg = svg;
        this._cx = CX;              // Current viewport center X
        this._cy = CY;              // Current viewport center Y
        this._size = VB.fullSize;   // Current viewport size
        this._tCX = CX;             // Target center X
        this._tCY = CY;             // Target center Y
        this._tSize = VB.fullSize;  // Target size
        this._rafId = null;
        this._minSize = VB.fullSize / ZOOM.maxZoom;  // ≈ 107 (at 300%)
        this._maxSize = VB.fullSize;                  // 320 (at 100%)
        this._CX = CX;              // Container center X (shrink target)
        this._CY = CY;              // Container center Y
        // Set the initial viewBox on first render
        this._applyViewBox();

        // Unified namespace: public methods are all invoked via this.zoom.* (_zoom* are private implementations)
        this.zoom = {
            blendCenter: this._zoomBlendCenter.bind(this),
            frame:       this._zoomFrame.bind(this),
            scale:       this._zoomScale.bind(this),
            panTo:       this._zoomPanTo.bind(this),
            set:         this._zoomSet.bind(this),
            reset:       this._zoomReset.bind(this),
            getState:    this._zoomGetState.bind(this),
            sync:        this._zoomSync.bind(this),
            destroy:     this._zoomDestroy.bind(this),
        };
    };

    // ==================== Public API ====================

    /**
     * Center regression: interpolate the raw center (rawCX, rawCY) toward the container center by size ratio.
     * The closer the size is to fullSize (100%), the more the center regresses toward the container center (CX, CY).
     * All zoom operations go through this method to keep behavior consistent.
     * @param {number} rawCX      Original target center X
     * @param {number} rawCY      Original target center Y
     * @param {number} targetSize Target size
     * @returns {{ cx: number, cy: number }} Regressed center coordinates
     */
    P._zoomBlendCenter = function(rawCX, rawCY, targetSize) {
        const t = (targetSize - this._minSize) / (this._maxSize - this._minSize);
        return {
            cx: rawCX + (this._CX - rawCX) * t,
            cy: rawCY + (this._CY - rawCY) * t,
        };
    };

    /**
     * Frame a region (auto zoom / API calls).
     * Smoothly transitions to the target region.
     * @param {number} cx      Target region center X
     * @param {number} cy      Target region center Y
     * @param {number} radius  Target region radius
     */
    P._zoomFrame = function(cx, cy, radius) {
        let targetSize = Math.max(radius * 2, this._minSize);
        targetSize = Math.min(targetSize, this._maxSize);
        const bc = this._zoomBlendCenter(cx, cy, targetSize);
        this._setTarget(bc.cx, bc.cy, targetSize);
    };

    /**
     * Zoom around a point (for the wheel; takes effect immediately with no smoothing).
     * - Zoom in (factor>1): the pivot stays fixed at the same screen point, no regression.
     * - Zoom out (factor<1): based on the current center, corrected via regression.
     * @param {number} px      Zoom pivot X (viewBox coordinate)
     * @param {number} py      Zoom pivot Y
     * @param {number} factor  Zoom factor (>1 zooms in, <1 zooms out)
     */
    P._zoomScale = function(px, py, factor) {
        const rawSize = this._size / factor;
        const clampedSize = Math.max(this._minSize, Math.min(this._maxSize, rawSize));

        // Skip if the change is below the threshold
        if (Math.abs(clampedSize - this._size) < 0.5) return;

        let ncx, ncy;
        if (clampedSize < this._size) {
            // === Zoom in === pivot stays fixed at the same screen point, no regression
            const ratio = clampedSize / this._size;
            ncx = px - (px - this._cx) * ratio;
            ncy = py - (py - this._cy) * ratio;
        } else {
            // === Zoom out === current center corrected via regression
            // Reverse-engineer the pre-regression original center to avoid accumulating error
            const tCur = (this._size - this._minSize) / (this._maxSize - this._minSize);
            let rawCX, rawCY;
            if (tCur > 0.999) {
                rawCX = this._CX;
                rawCY = this._CY;
            } else {
                // cx = rawCX + (CX - rawCX) * tCur => rawCX = (cx - CX*tCur) / (1-tCur)
                rawCX = (this._cx - this._CX * tCur) / (1 - tCur);
                rawCY = (this._cy - this._CY * tCur) / (1 - tCur);
            }
            const bc = this._zoomBlendCenter(rawCX, rawCY, clampedSize);
            ncx = bc.cx;
            ncy = bc.cy;
        }

        // Take effect immediately (the wheel needs instant feedback, not via rAF)
        this._cx = ncx;
        this._cy = ncy;
        this._size = clampedSize;
        this._tCX = ncx;
        this._tCY = ncy;
        this._tSize = clampedSize;
        this._stopRAF();
        this._applyViewBox();
    };

    /**
     * Pan immediately (for dragging; no smoothing).
     * Directly modifies the current viewport and updates the SVG, while also resetting the target values.
     * @param {number} cx   New center X
     * @param {number} cy   New center Y
     */
    P._zoomPanTo = function(cx, cy) {
        cx = this._clamp(cx);
        cy = this._clamp(cy);
        this._cx = cx;
        this._cy = cy;
        this._tCX = cx;
        this._tCY = cy;
        // Don't interrupt a possibly running rAF (size is unchanged, so no extra animation occurs)
        this._applyViewBox();
    };

    /**
     * Set the viewport immediately (for pinch zoom; no smoothing).
     * Directly modifies the current state and updates the SVG.
     */
    P._zoomSet = function(cx, cy, size) {
        size = Math.max(this._minSize, Math.min(this._maxSize, size));
        const bc = this._zoomBlendCenter(cx, cy, size);
        this._cx = bc.cx;
        this._cy = bc.cy;
        this._size = size;
        this._tCX = bc.cx;
        this._tCY = bc.cy;
        this._tSize = size;
        this._stopRAF();
        this._applyViewBox();
    };

    /** Restore the default full-dial view (with a smooth transition) */
    P._zoomReset = function() {
        this._setTarget(160, 160, VB.fullSize);
    };

    /** Get the current viewport state */
    P._zoomGetState = function() {
        return {
            cx: this._cx,
            cy: this._cy,
            size: this._size,
        };
    };

    /**
     * Immediately sync the current values to the target values (interrupting rAF).
     * Used to snap to the target right after a discrete API change.
     */
    P._zoomSync = function() {
        this._cx = this._tCX;
        this._cy = this._tCY;
        this._size = this._tSize;
        this._stopRAF();
        this._applyViewBox();
    };

    /** Destroy: cancel rAF and clear references */
    P._zoomDestroy = function() {
        this._stopRAF();
        this._svg = null;
    };

    // ==================== Internal methods ====================

    /**
     * Set the target values uniformly and start the rAF smooth transition.
     * If the target is close enough to the current values, does nothing.
     */
    P._setTarget = function(cx, cy, size) {
        this._tCX = cx;
        this._tCY = cy;
        this._tSize = size;

        // Already near the target, skip
        if (this._isNearTarget()) return;

        this._startRAF();
    };

    /** Check whether the current values are already near the target */
    P._isNearTarget = function() {
        const eps = 0.5;
        return Math.abs(this._cx - this._tCX) < eps
            && Math.abs(this._cy - this._tCY) < eps
            && Math.abs(this._size - this._tSize) < eps;
    };

    /** Start the rAF loop */
    P._startRAF = function() {
        if (this._rafId) return;
        const self = this;
        this._rafId = requestAnimationFrame(function loop() {
            // Lerp one step
            self._cx += (self._tCX - self._cx) * VB.lerpSpeed;
            self._cy += (self._tCY - self._cy) * VB.lerpSpeed;
            self._size += (self._tSize - self._size) * VB.lerpSpeed;

            self._applyViewBox();

            if (self._isNearTarget()) {
                // Snap precisely to avoid sub-pixel jitter
                self._cx = self._tCX;
                self._cy = self._tCY;
                self._size = self._tSize;
                self._applyViewBox();
                self._rafId = null;
            } else {
                self._rafId = requestAnimationFrame(loop);
            }
        });
    };

    /** Stop the rAF loop */
    P._stopRAF = function() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    };

    /** Apply the viewBox to the SVG */
    P._applyViewBox = function() {
        const x = this._cx - this._size / 2;
        const y = this._cy - this._size / 2;
        this._svg.setAttribute('viewBox',
            x.toFixed(1) + ' ' + y.toFixed(1) + ' '
            + this._size.toFixed(1) + ' ' + this._size.toFixed(1));
    };

    /** Panning boundary clamp */
    P._clamp = function(v) {
        const margin = VB.panMargin * this._size / VB.fullSize;
        const halfSize = this._size / 2;
        const minC = halfSize - margin;
        const maxC = VB.fullSize - halfSize + margin;
        return Math.max(minC, Math.min(maxC, v));
    };

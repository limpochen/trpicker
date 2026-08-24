/**
 * trPicker — Circular Time Range Picker (Entry)
 * =============================================
 * @version 1.1.1
 *
 * Class skeleton + constructor + public API.
 *
 * Dependency modules (in load order):
 *   trpicker-config.js        APPEARANCE configuration
 *   trpicker-utils.js         Utility functions
 *   trpicker-svg.js           SVG construction + dial drawing + subclass registration
 *   trpicker-view.js          View updates
 *   trpicker-events.js        Event system
 *   trpicker-popup.js         Popup mode
 *   trpicker-fine-slider.js   Fine slider
 *
 * Features:
 * - SVG vector rendering with lossless scaling
 * - 24/12-hour dial with three levels of ticks (half-hour / hour / 6-hour)
 * - Smooth handle dragging, accurate to the minute via clock angle
 * - Snap precision controlled by stepMinute
 * - 12H mode: continuous two-ring rotation + AM/PM labels + free span crossing
 *
 * 24H: bottom=0 | left=6 | top=12 | right=18
 * 12H: bottom=6/18 | left=9/21 | top=12/0 | right=3/15
 */
export default class trPicker {

    /**
     * @param {HTMLElement} container  - Container element that hosts the SVG
     * @param {Object}      options    - Configuration options
     * @param {number}      options.hourCycle   - Hour cycle 12 | 24, default 24
     * @param {number}      options.startHour   - Initial start hour (0-23.999), default 0
     * @param {number}      options.endHour     - Initial end hour (0-23.999), default 6
     * @param {number}      options.stepMinute  - Snap step in minutes, default 10
     * @param {string}      options.startColor  - Start handle color, default '#4f46e5'
     * @param {string}      options.endColor    - End handle color, default '#ef4444'
     * @param {string}      options.lineColor   - Arc color; 'gradient' for a gradient
     * @param {string}      options.detailLevel  - 'simple' | 'detailed'
     * @param {Function}    options.onChange     - Callback(startMinute, endMinute)
     * @param {boolean}     options.popup        - Whether to use popup mode
     * @param {boolean}     options.enableFineSlider - Whether to show the fine slider, default true
     * @param {boolean}     options.enableModeSwitch - Whether to allow switching 12/24h in the UI, default true
     * @param {boolean}     options.enableMinStep - Whether to enforce a minimum interval, default true
     * @param {boolean}     options.enableStepAdjust - Whether to allow adjusting the step (show step pill), default true
     * @param {boolean}     options.enableDetailAdjust - Whether to allow adjusting detail (show detail toggle), default true
     * @param {number}      options.popupBorderRadius - Popup panel corner radius, default 16
     * @param {string}      options.amText        - AM text, default 'AM'
     * @param {string}      options.pmText        - PM text, default 'PM'
     */
    constructor(container, options = {}) {
        // ---- Factory dispatch ----
        if (this.constructor === trPicker) {
            const D = trPicker.APPEARANCE.defaultsOptions;
            const hourCycle = options.hourCycle ?? D.hourCycle;
            const mode = hourCycle === 12 ? '12h' : '24h';
            const Ctor = trPicker._modeRegistry[mode];
            if (!Ctor) {
                throw new Error(
                    `trPicker: hourCycle "${hourCycle}" is not registered. Import the package entry (e.g. 'trpicker') so the 12h/24h mode classes are registered.`
                );
            }
            return new Ctor(container, options);
        }

        this.container = container;
        const D = trPicker.APPEARANCE.defaultsOptions;

        // Time (startHour/endHour: float hours 0~23.999, converted to minutes internally)
        this.startMinute = options.startMinute ??
            (options.startHour !== undefined ? Math.round(options.startHour * 60) : D.startMinute);
        this.endMinute = options.endMinute ??
            (options.endHour !== undefined ? Math.round(options.endHour * 60) : D.endMinute);
        this.stepMinute = options.stepMinute ?? D.stepMinute;
        this.startColor = options.startColor || D.startColor;
        this.endColor   = options.endColor   || D.endColor;
        this.lineColor  = options.lineColor  || D.lineColor;
        this.onChange   = options.onChange   || (() => {});
        this.enableFineSlider = options.enableFineSlider ?? D.enableFineSlider;
        this.enableMinStep = options.enableMinStep ?? D.enableMinStep;
        this.enableStepAdjust = options.enableStepAdjust ?? D.enableStepAdjust;
        this.enableDetailAdjust = options.enableDetailAdjust ?? D.enableDetailAdjust;
        this.amText    = options.amText || 'AM';
        this.pmText    = options.pmText || 'PM';

        // Popup mode
        this.popup = options.popup ?? D.popup;
        this.popupAnimation = options.popupAnimation || D.popupAnimation;
        this.popupBorderRadius = options.popupBorderRadius != null
            ? options.popupBorderRadius
            : D.popupBorderRadius;

        // Step-grid dashed circle
        this._stepGridCircle = null;
        this._stepGridTimeout = null;
        this._popupVisible = false;
        this._popupPanel = null;
        this._overlayEl = null;
        this._triggerEl = null;

        // Hour cycle
        this.hourCycle = options.hourCycle || D.hourCycle;
        this.enableModeSwitch = options.enableModeSwitch ?? D.enableModeSwitch;
        this.detailLevel = options.detailLevel || D.detailLevel;
        this.dialStyle = options.dialStyle || D.dialStyle;

        // Drag state
        this._dragging  = null;
        this._selectedHandle = null;
        this._hasDragged = false;
        this._svg        = null;
        this._arcPath    = null;
        this._sectorPath = null;
        this._overlapSectorPath = null;
        this._fullCirclePath    = null;
        this._startG     = null;
        this._startOuter = null;
        this._startInner = null;
        this._startPointer = null;
        this._startShape = null;
        this._startAmPmLabel = null;
        this._endG       = null;
        this._endOuter   = null;
        this._endInner   = null;
        this._endPointer = null;
        this._endShape   = null;
        this._endAmPmLabel = null;

        // Fine slider (virtual wheel)
        this._fineSlider         = null;
        this._fineTuning         = false;
        this._fineActive         = false;
        this._fineLastY          = 0;
        this._fineAccum          = 0;
        this._fineMoveH          = null;
        this._fineUpH            = null;
        this._fineDownH          = null;
        this._fineWheelH         = null;
        this._fineTarget         = 0;
        this._fineLerpId         = null;

        // Mode-toggle button handler refs
        this._modeToggle24hH     = null;
        this._modeToggle12hH     = null;
        this._modeToggle24hG     = null;
        this._modeToggle24hRect  = null;
        this._modeToggle24hText  = null;
        this._modeToggle12hG     = null;
        this._modeToggle12hRect  = null;
        this._modeToggle12hText  = null;

        // Step-selection pill
        this._stepPillG     = null;
        this._stepPillRect  = null;
        this._stepPillText  = null;
        this._stepPillH     = null;
        this._stepPillSteps = [1, 5, 10, 15, 30, 60];

        // Zoom interaction helper state (viewport managed by trpicker-zoom.js)
        this._userZoom = 1.0;           // User zoom factor, used in auto-zoom compounding
        this._pinchStartDist = 0;
        this._pinchStartUserZoom = 1.0;
        this._pinchCX = null;
        this._pinchCY = null;
        this._pinchState = null;

        // Panning
        this._panning       = false;
        this._panStartX     = 0;
        this._panStartY     = 0;
        this._panStartCX    = 0;
        this._panStartCY    = 0;
        this._panStartScale = 1;

        // Event handler refs (for cleanup)
        this._onDownHandler   = null;
        this._onMoveHandler   = null;
        this._onUpHandler     = null;
        this._onWheelHandler  = null;
        this._touchStartHandler = null;
        this._touchMoveHandler  = null;
        this._touchEndHandler   = null;
        this._docKeyHandler   = null;
        this._resizeHandler   = null;
        this._triggerClickHandler = null;

        // ---- Initialize (all dependency modules are guaranteed loaded via ESM imports) ----
        this._initAppearance();
        this._init();
    }

    // ==================== Initialization ====================

    /** Initialize appearance parameters (depends on the APPEARANCE config; kept separate for lazy loading) */
    _initAppearance() {
        const A = trPicker.APPEARANCE;
        this.handleRadius = A.handle.innerRadius;
        this.touchPadding = A.handle.touchPadding;
        this.CX = A.centerX;
        this.CY = A.centerY;
        this.R  = A.outerRingRadius;
        this.R_ARC = this.R - A.arc.inset;
        this.popupOffset = A.popup.offset;

        const D = trPicker.APPEARANCE.defaultsOptions;
        if (this.startMinute === 0 && this.endMinute === 0) {
            this.endMinute = D.endMinute;
        }
    }

    _init() {
        if (this.popup) {
            this._initPopupMode();
        } else {
            this._initInlineMode();
        }
    }

    /** Build the clock face (shared logic for inline and popup modes) */
    _buildClock() {
        this._svg = this._createSVG();
        this._fixedSvg = this._createFixedSVG();
        this._initZoom(this._svg);
        this._buildContent();
        this._bindEvents();
        this._update();
    }

    /** Initialize inline mode */
    _initInlineMode() {
        this._buildClock();
        this.container.appendChild(this._svg);
        this.container.appendChild(this._fixedSvg);
        this._buildFixedLayer();
        this.onChange(this.startMinute, this.endMinute);
    }

    // ==================== Public API ====================

    /**
     * Change the snap step and re-snap the current range to it.
     * @param {number} minute - New snap step in minutes (1-1439)
     * @returns {void}
     */
    setStep(minute) {
        if (minute <= 0 || minute >= 1440) return;
        this.stepMinute = minute;
        this.startMinute = Math.floor(this.startMinute / minute) * minute;
        this.endMinute   = Math.floor(this.endMinute   / minute) * minute;
        const cwDist = trPicker._cwDist(this.startMinute, this.endMinute);
        // enableMinStep applies to both 24H and 12H modes
        if (this.enableMinStep && cwDist < this.stepMinute) {
            this.endMinute = (this.startMinute + this.stepMinute) % 1440;
        }
        this._update();
        this.onChange(this.startMinute, this.endMinute);
    }

    /** Set the start handle color */
    setStartColor(color) { this.startColor = color; this._update(); }
    /** Set the end handle color */
    setEndColor(color)   { this.endColor   = color; this._update(); }
    /** Set the arc color; 'gradient' for a gradient */
    setLineColor(color)  { this.lineColor  = color; this._update(); }

    /**
     * Switch the dial material style.
     * @param {'solid'|'metal'} style - Dial style
     * @returns {void}
     */
    setDialStyle(style) {
        this.dialStyle = style;
        if (!this._svg) return;
        this._rebuildContent();
    }

    /**
     * Switch the dial tick detail level.
     * @param {'simple'|'detailed'} level - Tick detail level
     * @returns {void}
     */
    setDetailLevel(level) {
        if (level !== 'simple' && level !== 'detailed') return;
        if (level === this.detailLevel) return;
        this.detailLevel = level;
        if (!this._svg) return;
        this._rebuildContent();
        this.onChange(this.startMinute, this.endMinute);
    }

    /**
     * Unified handle-move constraint check (shared by drag, fine slider, and wheel)
     * @param {string} handle - 'start' | 'end'
     * @param {number} newVal - Target minute value (0-1439)
     * @returns {boolean} true=allow move, false=block
     */
    _validateMove(handle, newVal) {
        if (this.hourCycle === 12) {
            // 12H: delegate to the existing method
            const oldDist = trPicker._cwDist(this.startMinute, this.endMinute);
            const newDist = handle === 'start'
                ? trPicker._cwDist(newVal, this.endMinute)
                : trPicker._cwDist(this.startMinute, newVal);
            return this._validate12hStep(newDist, oldDist, this.stepMinute);
        }
        // 24H mode — unified symmetric logic for start/end
        const step = this.stepMinute;
        const oldDist = trPicker._cwDist(this.startMinute, this.endMinute);
        const handleCur = handle === 'start' ? this.startMinute : this.endMinute;
        const movedCw = trPicker._cwDist(handleCur, newVal);
        const newDist = handle === 'start'
            ? trPicker._cwDist(newVal, this.endMinute)
            : trPicker._cwDist(this.startMinute, newVal);

        // Start CW or End CCW → moving toward the other handle (distance shrinks)
        const movingToward = (handle === 'start' && movedCw <= 720) || (handle === 'end' && movedCw > 720);
        // Movement direction opposite to the distance change → crossing occurred
        const crossed = movingToward ? newDist > oldDist : newDist < oldDist;

        if (crossed) return false;
        if (movingToward && newDist < step) return false;
        if (!movingToward && newDist > 1440 - step) return false;
        return true;
    }

    /**
     * Unified handle value setter (eliminates repeated if/else assignments)
     * @param {string} handle - 'start' | 'end'
     * @param {number} newVal - Target minute value (0-1439)
     */
    _setHandleValue(handle, newVal) {
        if (handle === 'start') {
            this.startMinute = newVal;
        } else {
            this.endMinute = newVal;
        }
    }

    /**
     * Get date/time information
     * @param {Date|string} [baseDate]
     * @returns {{ startDay: Date, endDay: Date, durationMin: number }}
     */
    getDateTimeValues(baseDate) {
        let refDate = baseDate ? new Date(baseDate) : new Date();
        if (isNaN(refDate.getTime())) {
            refDate = new Date();
        }

        const startDate = new Date(refDate);
        startDate.setHours(
            Math.floor(this.startMinute / 60),
            this.startMinute % 60, 0, 0
        );

        const endDate = new Date(refDate);
        endDate.setHours(
            Math.floor(this.endMinute / 60),
            this.endMinute % 60, 0, 0
        );

        if (this.startMinute >= this.endMinute) {
            endDate.setDate(endDate.getDate() + 1);
        }

        const durationMin = (endDate.getTime() - startDate.getTime()) / 60000;

        return {
            startDay: startDate,
            endDay: endDate,
            durationMin: durationMin,
        };
    }

    /** @deprecated Use setHourCycle(cycle) instead */
    setHourMode(mode) {
        const cycle = mode === 12 || mode === '12h' ? 12 : 24;
        return this.setHourCycle(cycle);
    }

    /**
     * Switch the hour cycle.
     * @param {12|24} cycle - Hour cycle
     * @returns {trPicker} This instance (chainable)
     */
    setHourCycle(cycle) {
        if (cycle !== 12 && cycle !== 24) return this;
        if (cycle === this.hourCycle) return this;
        this._switchMode(cycle);
        return this;
    }

    /**
     * Internal hour-cycle switch (does not destroy/recreate the instance)
     * Called by the mode toggle buttons built in _buildModeToggle
     */
    _switchMode(cycle) {
        if (cycle !== 12 && cycle !== 24) return;
        if (cycle === this.hourCycle) return;

        this.hourCycle = cycle;

        // Reset viewport to the full view
        this._userZoom = 1.0;
        this.zoom.reset();
        this._rebuildContent();

        // Notify via callback
        this.onChange(this.startMinute, this.endMinute);
    }

    /** Clear SVG children and rebuild all content */
    _rebuildContent() {
        this._svg.replaceChildren();
        if (this._fixedSvg) this._fixedSvg.replaceChildren();
        this._buildContent();
        this._buildFixedLayer();
        this._update();
        // Restore the fine slider display after rebuilding
        if (this._selectedHandle && this.enableFineSlider) {
            this._showFineSlider();
        }
    }

    /** Destroy the component */
    destroy() {
        // ---- Popup UI cleanup (delegated by close() or called directly) ----
        if (this.popup && this._popupVisible) {
            this._popupVisible = false;
            if (this._overlayEl && this._overlayEl.parentNode) {
                this._overlayEl.parentNode.removeChild(this._overlayEl);
            }
            this._overlayEl = null;
            if (this._popupPanel && this._popupPanel.parentNode) {
                this._popupPanel.parentNode.removeChild(this._popupPanel);
            }
            this._popupPanel = null;
            if (this._docKeyHandler) {
                document.removeEventListener('keydown', this._docKeyHandler);
                this._docKeyHandler = null;
            }
            if (this._resizeHandler) {
                window.removeEventListener('resize', this._resizeHandler);
                window.removeEventListener('scroll', this._resizeHandler, true);
                this._resizeHandler = null;
            }
        }

        // ---- Internal cleanup ----
        // Popup mode lazy-builds: this.zoom may not exist before open(), so guard against it
        if (this.zoom) this.zoom.destroy();

        // Clear the step-grid dash fade timer
        if (this._stepGridTimeout) {
            clearTimeout(this._stepGridTimeout);
            this._stepGridTimeout = null;
        }

        this._hideFineSlider();
        if (this._fineSlider) {
            if (this._fineDownH) this._fineSlider.removeEventListener('pointerdown', this._fineDownH);
            if (this._fineSlider.parentNode) {
                this._fineSlider.parentNode.removeChild(this._fineSlider);
            }
        }
        this._fineSlider = null;
        this._fineDownH = null;
        this._fineMoveH = null;
        this._fineUpH = null;
        this._fineActive = false;
        this._fineAccum = 0;
        this._wheelMovement = 0;

        if (this._modeToggle24hG && this._modeToggle24hH) {
            this._modeToggle24hG.removeEventListener('pointerdown', this._modeToggle24hH);
        }
        if (this._modeToggle12hG && this._modeToggle12hH) {
            this._modeToggle12hG.removeEventListener('pointerdown', this._modeToggle12hH);
        }

        if (this._stepPillG && this._stepPillH) {
            this._stepPillG.removeEventListener('pointerdown', this._stepPillH);
        }
        if (this._stepPillUpH) {
            window.removeEventListener('pointerup', this._stepPillUpH);
            if (this._stepPillG) {
                this._stepPillG.removeEventListener('pointerleave', this._stepPillUpH);
            }
        }

        if (this._detailBtnS && this._detailBtnSH) {
            this._detailBtnS.removeEventListener('pointerdown', this._detailBtnSH);
        }
        if (this._detailBtnD && this._detailBtnDH) {
            this._detailBtnD.removeEventListener('pointerdown', this._detailBtnDH);
        }

        if (this._svg) {
            if (this._onDownHandler)  this._svg.removeEventListener('pointerdown', this._onDownHandler);
            if (this._onWheelHandler) this._svg.removeEventListener('wheel',       this._onWheelHandler);
            if (this._touchStartHandler) this._svg.removeEventListener('touchstart', this._touchStartHandler);
            if (this._touchMoveHandler)  this._svg.removeEventListener('touchmove',  this._touchMoveHandler);
            if (this._touchEndHandler)   this._svg.removeEventListener('touchend',   this._touchEndHandler);
        }
        if (this._onMoveHandler) window.removeEventListener('pointermove', this._onMoveHandler);
        if (this._onUpHandler)   window.removeEventListener('pointerup',   this._onUpHandler);

        if (this._svg && this._svg.parentNode) {
            this._svg.parentNode.removeChild(this._svg);
        }
        if (this._fixedSvg && this._fixedSvg.parentNode) {
            this._fixedSvg.parentNode.removeChild(this._fixedSvg);
        }

        // Clear internal references
        this._svg = this._fixedSvg = null;
        this._arcPath = this._sectorPath = this._overlapSectorPath = this._fullCirclePath = null;
        this._startG = this._startOuter = this._startInner = this._startPointer = this._startShape = this._startAmPmLabel = null;
        this._endG = this._endOuter = this._endInner = this._endPointer = this._endShape = this._endAmPmLabel = null;
        this._gradient = this._gradStop0 = this._gradStop1 = null;
        this._metalBorder = this._metalBorderGrad = null;
        this._stepGridCircle = null;
        this._dragging = this._selectedHandle = null;
        this._modeToggle24hH = this._modeToggle12hH = null;
        this._modeToggle24hG = this._modeToggle12hG = null;
        this._modeToggle24hRect = this._modeToggle24hText = null;
        this._modeToggle12hRect = this._modeToggle12hText = null;
        this._stepPillG = this._stepPillH = this._stepPillUpH = null;
        this._detailBtnS = this._detailBtnD = null;
        this._detailBtnSH = this._detailBtnDH = null;
        this._detailBtnSRect = this._detailBtnSPath = null;
        this._detailBtnDRect = this._detailBtnDPath = null;
        this._onMoveHandler = this._onUpHandler = null;
        this._onDownHandler = this._onWheelHandler = null;
        this._touchStartHandler = this._touchMoveHandler = this._touchEndHandler = null;

        // ---- Permanent teardown (non-popup mode / direct destroy() call) ----
        if (!this.popup) {
            this.onChange = null;
        }
        this._popupPanel = null;
        this._overlayEl  = null;
    }
}

/** Mode-class registry */
trPicker._modeRegistry = {};

/** Register a mode class */
trPicker.registerMode = function(mode, cls) {
    trPicker._modeRegistry[mode] = cls;
};

/** Current version */
trPicker.VERSION = '1.1.1';

// ==================== Self-contained style injection (no external CSS file needed) ====================
// Injects the component styles into <head> on first load (deduplicated by id), ready before instantiation.

(function() {
    'use strict';
    if (typeof document === 'undefined') return;
    if (document.getElementById('trpicker-style')) return;

    const style = document.createElement('style');
    style.id = 'trpicker-style';
    style.textContent = `
/* ===== Time Range Picker component styles ===== */

/* ---- Circular clock canvas container ---- */
.trpicker-clock {
    position: relative;
    width: 100%;
    height: 100%;
    cursor: pointer;
}

/* ---- SVG clock-face canvas ---- */
.trpicker-clock svg {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
    user-select: none;
}

/* ---- Fixed-layer SVG (control buttons, not scaled with the view) ---- */
.trpicker-clock svg.trpicker-fixed-layer {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
}

.trpicker-clock svg.trpicker-fixed-layer .trpicker-mode-btn,
.trpicker-clock svg.trpicker-fixed-layer .trpicker-detail-btn,
.trpicker-clock svg.trpicker-fixed-layer [cursor="pointer"] {
    pointer-events: auto;
}

/* ============================================================
   Popup mode
   ============================================================ */

/* Overlay: full-screen, transparent and clickable */
.trpicker-overlay {
    position: fixed;
    inset: 0;
    z-index: 9998;
    background: transparent;
}

/* Popup panel: white container with shadow and rounded corners */
.trpicker-popup {
    position: fixed;
    z-index: 9999;
    width: 320px;
    height: 320px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    animation: trpicker-popup-in 0.18s ease-out;
}

/* Popup animation */
@keyframes trpicker-popup-in {
    from {
        opacity: 0;
        transform: translateY(-14px) scale(0.96);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* ---- Popup animation: drop ---- */
.trpicker-popup-drop {
    animation: trpicker-popup-drop 0.18s ease-out;
}

@keyframes trpicker-popup-drop {
    from {
        opacity: 0;
        transform: translateY(-24px) scale(1);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* ---- Popup animation: instant (none) ---- */
.trpicker-popup-instant {
    animation: none;
}

/* Clock container inside the popup panel */
.trpicker-popup .trpicker-clock {
    width: 320px;
    height: 320px;
}

/* ---- Small-screen adaptation ---- */
@media (max-width: 380px) {
    .trpicker-popup {
        width: 280px;
        height: 280px;
    }
    .trpicker-popup .trpicker-clock {
        width: 280px;
        height: 280px;
    }
}
@media (max-width: 340px) {
    .trpicker-popup {
        width: 250px;
        height: 250px;
    }
    .trpicker-popup .trpicker-clock {
        width: 250px;
        height: 250px;
    }
}
@media (max-width: 300px) {
    .trpicker-popup {
        width: 220px;
        height: 220px;
    }
    .trpicker-popup .trpicker-clock {
        width: 220px;
        height: 220px;
    }
}

/* ============================================================
   Fine slider (virtual wheel)
   ============================================================ */

.trpicker-fine-slider {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    cursor: ns-resize;
    touch-action: none;
    user-select: none;
    pointer-events: auto;
}
.trpicker-fine-slider.trpicker-slider-left {
    left: 6px;
    right: auto;
}
.trpicker-fine-slider.trpicker-slider-right {
    left: auto;
    right: 6px;
}

/* ---- Wheel SVG container ---- */
.trpicker-fine-slider svg {
    display: block;
    flex-shrink: 0;
}


/* ============================================================
   Mode toggle buttons (24H / 12H)
   ============================================================ */

/* Toggle button group in SVG */
.trpicker-mode-btn {
    transition: opacity 0.15s;
}
.trpicker-mode-btn:hover {
    opacity: 0.8;
}

/* ============================================================
   AM/PM label (12H mode) — defaults built-in as SVG attributes
   ============================================================ */
`;
    document.head.appendChild(style);
})();

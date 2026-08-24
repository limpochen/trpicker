/**
 * trPicker — SVG construction module + mode dial drawing
 * =======================================================
 * Responsible for SVG element creation, clock-face construction, handle construction,
 * and data-driven drawing of 12h/24h mode ticks and numbers.
 * Depends on: trpicker.js, trpicker-config.js
 */
(function() {
    'use strict';
    if (typeof trPicker === 'undefined') {
        throw new Error('trpicker-svg.js: trPicker is not defined.');
    }

    const P = trPicker.prototype;

    // ==================== SVG factory ====================

    /** Create the root SVG element */
    P._createSVG = function() {
        const VB = trPicker.APPEARANCE.viewBox;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 ' + VB.fullSize + ' ' + VB.fullSize);
        return svg;
    };

    /** Convenience helper to create an SVG element */
    P._el = function(tag, attrs = {}, text = '') {
        const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) {
            if (typeof v === 'boolean') {
                if (v) e.setAttribute(k, '');
            } else {
                e.setAttribute(k, String(v));
            }
        }
        if (text) e.textContent = text;
        return e;
    };

    // ==================== Mode configuration table (12h/24h data-driven) ====================

    const MODE_CONFIG = {
        '24h': {
            detailed: {
                tickCount: 144,       // 144 ticks (10-min interval × 24h)
                majorMod: 36,         // Major tick: every 36 steps (= 360 min = 6h)
                numbers: (function() { const a=[]; for(let i=0;i<24;i++) a.push(i); return a; })(),
                simpleNumbers: [0, 6, 12, 18],
            },
            simple: {
                tickCount: 48,        // 48 ticks (30-min interval)
                majorMod: 12,         // Major tick: every 12 steps (= 6h)
                numbers: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22],
            },
        },
        '12h': {
            detailed: {
                tickCount: 72,        // 72 ticks (10-min interval × 12h)
                majorMod: 18,         // Major tick: every 18 steps (= 180 min = 3h)
                numbers: (function() { const a=[]; for(let i=1;i<=12;i++) a.push(i); return a; })(),
                simpleNumbers: [12, 3, 6, 9],
            },
            simple: {
                tickCount: 24,        // 24 ticks (30-min interval)
                majorMod: 6,          // Major tick: every 6 steps (= 3h)
                numbers: [12, 3, 6, 9],
            },
        },
    };

    /** Tick-endpoint calculation (shared helper) */
    function tickEnds(R, tickGap, len, w, clr) {
        return {
            outer: R + tickGap + len,
            inner: R + tickGap,
            width: w, color: clr,
        };
    }

    /**
     * Data-driven drawing of mode ticks/numbers (replaces the original subclass _buildModeContent)
     * Automatically selects the configuration based on this.hourCycle and this.detailLevel.
     */
    P._buildModeContent = function() {
        const svg = this._svg;
        const A = trPicker.APPEARANCE;
        const { tickGap, tick, number } = A;
        const R = this.R;
        const is12h = this.hourCycle === 12;
        const modeKey = is12h ? '12h' : '24h';
        const cfg = MODE_CONFIG[modeKey][this.detailLevel];

        // ---- Ticks ----
        const tickInterval = this.detailLevel === 'detailed' ? 10 : 30;
        for (let step = 0; step < cfg.tickCount; step++) {
            const minute = step * tickInterval;
            const hour = minute / 60;
            const a = this._getAngle(hour);
            const cos = Math.cos(a), sin = Math.sin(a);

            let t;
            if (minute % (cfg.majorMod * tickInterval) === 0) {
                t = tickEnds(R, tickGap, tick.major.length, tick.major.width, tick.major.color);
            } else if (minute % 60 === 0) {
                t = tickEnds(R, tickGap, tick.minor.length, tick.minor.width, tick.minor.color);
            } else if (minute % 30 === 0) {
                t = tickEnds(R, tickGap, tick.half.length, tick.half.width, tick.half.color);
            } else {
                t = tickEnds(R, tickGap, tick.micro.length, tick.micro.width, tick.micro.color);
            }

            svg.appendChild(this._el('line', {
                x1: this.CX + t.outer * cos, y1: this.CY + t.outer * sin,
                x2: this.CX + t.inner * cos, y2: this.CY + t.inner * sin,
                stroke: t.color, 'stroke-width': t.width,
            }));
        }

        // ---- Numbers ----
        const nr = R + number.outerOffset;
        const nums = this.detailLevel === 'detailed'
            ? cfg.numbers
            : (cfg.simpleNumbers || cfg.numbers);

        for (const h of nums) {
            const angleH = (is12h && h === 12) ? 0 : h;
            const a = this._getAngle(angleH);
            const text = this._el('text', {
                class: 'trpicker-hour',
                'font-size': '14',
                'font-weight': '400',
                'font-family': 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fill: '#1f2937',
                'text-anchor': 'middle',
                'dominant-baseline': 'central',
            }, String(h));
            text.setAttribute('x', this.CX + nr * Math.cos(a));
            text.setAttribute('y', this.CY + nr * Math.sin(a));
            svg.appendChild(text);
        }
    };

    /** Render the metal-style dial background (Canvas pixel-level angular gradient, ported from c.html) */
    P._renderMetalDial = function() {
        const A = trPicker.APPEARANCE;
        const MD = A.metalDial;
        const svg = this._svg;
        const SIZE = A.viewBox.fullSize;   // Texture canvas size (matches viewBox)

        // Create foreignObject + canvas
        const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        fo.setAttribute('x', '0');
        fo.setAttribute('y', '0');
        fo.setAttribute('width', String(SIZE));
        fo.setAttribute('height', String(SIZE));

        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        canvas.style.display = 'block';
        fo.appendChild(canvas);
        svg.appendChild(fo);

        // === Canvas pixel rendering ===
        const ctx = canvas.getContext('2d');
        const cx = A.centerX;
        const cy = A.centerY;
        const r = A.outerRingRadius;
        const midLightGray = MD.midLightGray;
        const lightGray = MD.lightGray;
        const lightGrayRatio = MD.lightGrayRatio;
        const rotate45Rad = Math.PI / 4;

        // Compute the exponent factor
        const exponent = lightGrayRatio <= 0 ? 100000 : 3 * ((1 - lightGrayRatio) / lightGrayRatio);

        const imgData = ctx.createImageData(SIZE, SIZE);
        const data = imgData.data;

        // Clear to fully transparent
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 0; data[i+1] = 0; data[i+2] = 0; data[i+3] = 0;
        }

        // Layer 1: solid background circle (45° diagonal gradient)
        for (let y = 0; y < SIZE; y++) {
            for (let x = 0; x < SIZE; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= r) {
                    const angleRad = Math.atan2(dy, dx) - rotate45Rad;
                    const baseProgress = Math.abs(Math.sin(angleRad));
                    const tightProgress = Math.pow(baseProgress, exponent);

                    const lightness = midLightGray + (lightGray - midLightGray) * tightProgress;
                    const grayValue = Math.round((lightness / 100) * 255);

                    const idx = (y * SIZE + x) * 4;
                    data[idx]     = grayValue;
                    data[idx + 1] = grayValue;
                    data[idx + 2] = grayValue;
                    data[idx + 3] = 255;

                    if (r - distance < 1) {
                        data[idx + 3] = Math.round((r - distance) * 255);
                    }
                }
            }
        }

        ctx.putImageData(imgData, 0, 0);
        return fo;
    };

    // ==================== SVG construction ====================

    /**
     * Build all SVG child elements.
     * Gradients/base circle/arc/center dot/handles are the shared parts;
     * ticks/numbers are drawn data-driven by _buildModeContent().
     */
    P._buildContent = function() {
        const svg = this._svg;
        const A = trPicker.APPEARANCE;

        // ---- Gradient definitions ----
        const defs = this._el('defs');

        // Arc gradient (used when lineColor='gradient')
        this._gradient = this._el('linearGradient', {
            id: 'trpickerGradient',
            gradientUnits: 'userSpaceOnUse',
        });
        this._gradStop0 = this._el('stop', { offset: '0%',   'stop-color': this.startColor });
        this._gradStop1 = this._el('stop', { offset: '100%', 'stop-color': this.endColor });
        this._gradient.appendChild(this._gradStop0);
        this._gradient.appendChild(this._gradStop1);
        defs.appendChild(this._gradient);

        // Metal-style border gradient
        this._metalBorderGrad = this._el('linearGradient', {
            id: 'trpickerMetalBorder',
            x1: '0', y1: '0', x2: '1', y2: '1',
            gradientUnits: 'objectBoundingBox',
        });
        this._metalBorderGrad.appendChild(this._el('stop', { offset: '0%',   'stop-color': '#e8e8e8' }));
        this._metalBorderGrad.appendChild(this._el('stop', { offset: '50%',  'stop-color': '#888888' }));
        this._metalBorderGrad.appendChild(this._el('stop', { offset: '100%', 'stop-color': '#d0d0d0' }));
        defs.appendChild(this._metalBorderGrad);

        svg.appendChild(defs);

        // ---- Base circle (outer ring) ----
        if (this.dialStyle === 'metal') {
            this._metalFO = this._renderMetalDial();
            // SVG gradient border circle (covers the canvas edge)
            this._metalBorder = this._el('circle', {
                cx: this.CX, cy: this.CY, r: this.R,
                fill: 'none',
                stroke: 'url(#trpickerMetalBorder)',
                'stroke-width': A.metalDial.borderThickness,
                'pointer-events': 'none',
            });
            svg.appendChild(this._metalBorder);
        } else {
            svg.appendChild(this._el('circle', {
                cx: this.CX, cy: this.CY, r: this.R,
                fill: A.outerRing.fill,
                stroke: A.outerRing.strokeColor,
                'stroke-width': A.outerRing.strokeWidth,
            }));
        }

        // ---- Mode-specific content (ticks + numbers, data-driven) ----
        this._buildModeContent();

        // ---- Full-circle base (fills the whole dial when a 12H span exceeds 12h) ----
        this._fullCirclePath = this._el('circle', {
            cx: this.CX, cy: this.CY, r: this.R_ARC,
            fill: '#000',
            'fill-opacity': '0',
            'pointer-events': 'none',
        });
        svg.appendChild(this._fullCirclePath);

        // ---- Overlap sector (below the main sector; highlights the over-12h part in 12H mode) ----
        this._overlapSectorPath = this._el('path', {
            'fill': '#000',
            'fill-opacity': '0',
            'pointer-events': 'none',
        });
        svg.appendChild(this._overlapSectorPath);

        // ---- Sector fill (below the arc, 30% opacity) ----
        this._sectorPath = this._el('path', {
            'fill-opacity': String(A.arc.fillOpacity),
        });
        svg.appendChild(this._sectorPath);

        // ---- Selected-range arc ----
        this._arcPath = this._el('path', {
            fill: 'none',
            stroke: this.lineColor === 'gradient' ? 'url(#trpickerGradient)' : this.lineColor,
            'stroke-width': A.arc.width,
            'stroke-linecap': A.arc.lineCap,
        });
        svg.appendChild(this._arcPath);

        // ---- Center dot ----
        svg.appendChild(this._el('circle', {
            cx: this.CX, cy: this.CY,
            r: String(A.centerDot.radius),
            fill: A.centerDot.color,
            stroke: A.centerDot.stroke,
            'stroke-width': String(A.centerDot.strokeWidth),
        }));

        // ---- Step-grid dashed circle (shown when the step pill is clicked, fades out gradually) ----
        const stepGridCfg = trPicker.APPEARANCE.stepGrid;
        this._stepGridCircle = this._el('circle', {
            cx: this.CX, cy: this.CY, r: this.R,
            fill: 'none',
            stroke: stepGridCfg.stroke,
            'stroke-width': String(stepGridCfg.strokeWidth),
            'stroke-dasharray': '',
            'stroke-opacity': '0',
            'pointer-events': 'none',
        });
        svg.appendChild(this._stepGridCircle);

        // ---- Build handles ----
        this._buildHandle('S', this.startColor);
        this._buildHandle('E', this.endColor);

    };

    /** Create the fixed-layer SVG (layer for controls, not scaled with the view) */
    P._createFixedSVG = function() {
        const VB = trPicker.APPEARANCE.viewBox;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 ' + VB.fullSize + ' ' + VB.fullSize);
        svg.setAttribute('class', 'trpicker-fixed-layer');
        return svg;
    };

    /** Build fixed-layer content (mode toggle, step pill, detail toggle, fine slider) */
    P._buildFixedLayer = function() {
        this._createFineSlider();
        this._buildModeToggle();
        this._buildStepPill();
        this._buildDetailToggle();
    };

    /** Build a single draggable handle */
    P._buildHandle = function(label, color) {
        const A = trPicker.APPEARANCE.handle;
        const g = this._el('g');
        const or = A.outerRadius;
        const ir = A.innerRadius;

        // ---- Pointer (bottommost layer, under the handle circles) ----
        let pointer = null;
        if (A.pointer && A.pointer.show) {
            pointer = this._el('line', {
                'stroke-width': String(A.pointer.width),
                'stroke-linecap': 'round',
            });
            g.appendChild(pointer);
        }

        // Outer ring
        const outer = this._el('circle', {
            r: String(or), fill: A.outerFill,
            stroke: A.outerStroke, 'stroke-width': String(A.outerStrokeWidth),
        });
        g.appendChild(outer);

        // Inner ring
        const inner = this._el('circle', {
            r: String(ir),
            fill: A.innerFill || color,
        });
        g.appendChild(inner);

        // Shape marker
        let shape = null;
        if (A.showLabel) {
            if (label === 'S') {
                const s = ir * 1.2;
                const h = s * Math.sqrt(3) / 2;
                const pts = [
                    ( 2 * h / 3).toFixed(1) + ',0',
                    (-1 * h / 3).toFixed(1) + ',' + ( s / 2).toFixed(1),
                    (-1 * h / 3).toFixed(1) + ',' + (-s / 2).toFixed(1),
                ].join(' ');
                shape = this._el('polygon', { points: pts, fill: '#ffffff' });
            } else {
                const s = ir * 1.1;
                shape = this._el('rect', {
                    x: (-s / 2).toFixed(1), y: (-s / 2).toFixed(1),
                    width: s.toFixed(1), height: s.toFixed(1),
                    fill: '#ffffff',
                });
            }
            g.appendChild(shape);
        }

        // AM/PM label (12H mode): create the node with the configured initial value only;
        // text and visibility are maintained by the view module _updateAmPmLabels
        const ampmLabel = this._el('text', {
            class: 'trpicker-ampm-label',
            'font-size': '9',
            'font-weight': '700',
            fill: color,
            'text-anchor': 'middle',
            'dominant-baseline': 'central',
            'pointer-events': 'none',
        }, this.amText || 'AM');
        g.appendChild(ampmLabel);

        // Save references
        const prefix = label === 'S' ? '_start' : '_end';
        this[prefix + 'G'] = g;
        this[prefix + 'Outer'] = outer;
        this[prefix + 'Inner'] = inner;
        this[prefix + 'Pointer'] = pointer;
        this[prefix + 'Shape'] = shape;
        this[prefix + 'AmPmLabel'] = ampmLabel;
        this._svg.appendChild(g);
    };

    // ==================== Mode toggle buttons (24H / 12H) ====================

    /**
     * Draw two side-by-side rectangular blocks at the top-right of the picker: 24H / 12H
     * Clicking switches the hour cycle; the selected block is highlighted.
     */
    P._buildModeToggle = function() {
        if (!this.enableModeSwitch) return;

        const svg = this._fixedSvg;
        const C = trPicker.APPEARANCE.controls;
        const mt = C.modeToggle;
        const ci = C.colors.inactive;

        // Button size and position
        const btnW = mt.btnW;
        const btnH = mt.btnH;
        const topY = mt.topY;
        const leftX = mt.leftX;

        // Create both buttons uniformly
        const labels = ['24H', '12H'];
        const refs = {};

        labels.forEach(function(label, i) {
            const x = leftX + i * btnW;
            const g = this._el('g', {
                class: 'trpicker-mode-btn',
                cursor: 'pointer',
            });
            const rect = this._el('rect', {
                x: x, y: topY, width: btnW, height: btnH, rx: 0,
                fill: ci.fill, stroke: ci.stroke, 'stroke-width': String(C.strokeWidth),
            });
            const text = this._el('text', {
                x: x + btnW / 2, y: topY + btnH / 2,
                'text-anchor': 'middle', 'dominant-baseline': 'central',
                'font-size': String(C.fontSize), 'font-weight': C.fontWeight,
                'font-family': C.fontFamily,
                fill: ci.text, 'pointer-events': 'none',
            }, label);
            g.appendChild(rect);
            g.appendChild(text);
            svg.appendChild(g);

            // Save reference
            const key = label.toLowerCase(); // '24h' / '12h'
            refs[key] = { g: g, rect: rect, text: text };
        }, this);

        this._modeToggle24hG  = refs['24h'].g;
        this._modeToggle24hRect = refs['24h'].rect;
        this._modeToggle24hText = refs['24h'].text;
        this._modeToggle12hG  = refs['12h'].g;
        this._modeToggle12hRect = refs['12h'].rect;
        this._modeToggle12hText = refs['12h'].text;

        // Set initial highlight
        this._updateModeToggle();

        // Bind click events
        const self = this;
        this._modeToggle24hH = function(e) {
            e.stopPropagation();
            if (self.hourCycle !== 24) {
                self._switchMode(24);
            }
        };
        this._modeToggle12hH = function(e) {
            e.stopPropagation();
            if (self.hourCycle !== 12) {
                self._switchMode(12);
            }
        };
        this._modeToggle24hG.addEventListener('pointerdown', this._modeToggle24hH);
        this._modeToggle12hG.addEventListener('pointerdown', this._modeToggle12hH);
    };

    // ==================== Step-selection pill (top-left, cycles) ====================

    /**
     * Draw a step pill at the top-left; clicking cycles through step options.
     * Its visual style matches the inactive state of the mode toggle buttons.
     * Built only when enableStepAdjust is true.
     */
    P._buildStepPill = function() {
        if (!this.enableStepAdjust) return;

        const svg = this._fixedSvg;
        const self = this;
        const C = trPicker.APPEARANCE.controls;
        const sp = C.stepPill;
        const ci = C.colors.inactive;
        const ca = C.colors.active;

        const pillW = sp.pillW;
        const pillH = sp.pillH;
        const x = sp.leftX;
        const y = sp.topY;

        const g = this._el('g', { cursor: 'pointer' });

        const rect = this._el('rect', {
            x: x, y: y, width: pillW, height: pillH, rx: 0,
            fill: ci.fill, stroke: ci.stroke, 'stroke-width': String(C.strokeWidth),
        });

        const text = this._el('text', {
            x: x + pillW / 2, y: y + pillH / 2,
            'text-anchor': 'middle', 'dominant-baseline': 'central',
            'font-size': String(C.fontSize), 'font-weight': C.fontWeight,
            'font-family': C.fontFamily,
            fill: ci.text, 'pointer-events': 'none',
        }, this.stepMinute + 'm');

        g.appendChild(rect);
        g.appendChild(text);
        svg.appendChild(g);

        // Save references
        this._stepPillG    = g;
        this._stepPillRect = rect;
        this._stepPillText = text;

        // Press feedback: blue background, white text
        function setPressed(on) {
            rect.setAttribute('fill',   on ? ca.fill  : ci.fill);
            rect.setAttribute('stroke', on ? ca.stroke : ci.stroke);
            text.setAttribute('fill',   on ? ca.text  : ci.text);
        }

        // Click event
        this._stepPillH = function(e) {
            e.stopPropagation();
            setPressed(true);
            const steps = self._stepPillSteps;
            const idx = steps.indexOf(self.stepMinute);
            const next = idx === -1 ? steps[0] : steps[(idx + 1) % steps.length];
            self.setStep(next);
            self._showStepGrid();
        };

        // Restore on release/leave
        this._stepPillUpH = function() { setPressed(false); };

        g.addEventListener('pointerdown', this._stepPillH);
        window.addEventListener('pointerup',   this._stepPillUpH);
        g.addEventListener('pointerleave', this._stepPillUpH);
    };

    // ==================== Detail toggle buttons (S / D) ====================

    /**
     * Draw two side-by-side buttons at the bottom-left of the picker: S (simple) / D (detailed)
     * Styled like the mode toggle buttons; clicking switches the detail level.
     * The currently selected button is highlighted.
     * Built only when enableDetailAdjust is true.
     */
    P._buildDetailToggle = function() {
        if (!this.enableDetailAdjust) return;

        const svg = this._fixedSvg;
        const C = trPicker.APPEARANCE.controls;
        const dt = C.detailToggle;
        const VB = trPicker.APPEARANCE.viewBox;
        const ci = C.colors.inactive;

        const btnW = dt.btnW;
        const btnH = dt.btnH;
        const margin = dt.margin;
        const topY = VB.fullSize - margin - btnH;
        const leftX = margin;

        // Draw tick patterns with SVG lines:
        //   Simple (sparse) → "hill": bottom bar + three verticals, the middle one shorter
        //   Detailed (dense) → "double hill": bottom bar + five verticals, the 2nd and 4th shorter
        const tickPaths = [
            // Simple - sparse: "hill" shape (bar ends align with the outer edges of the verticals)
            'M 5.5,13 L 16.5,13 M 6,5 L 6,13 M 11,8 L 11,13 M 16,5 L 16,13',
            // Detailed - dense: two "hills" side by side (bar ends align with the outer edges of the verticals)
            'M 3.5,13 L 18.5,13 M 4,5 L 4,13 M 7.5,8 L 7.5,13 M 11,5 L 11,13 M 14.5,8 L 14.5,13 M 18,5 L 18,13',
        ];
        const refs = {};

        tickPaths.forEach(function(pathD, i) {
            const x = leftX + i * btnW;
            const g = this._el('g', {
                class: 'trpicker-detail-btn',
                cursor: 'pointer',
                transform: `translate(${x}, ${topY})`,
            });
            const rect = this._el('rect', {
                x: 0, y: 0, width: btnW, height: btnH, rx: 0,
                fill: ci.fill, stroke: ci.stroke, 'stroke-width': String(C.strokeWidth),
            });
            const path = this._el('path', {
                d: pathD,
                stroke: ci.text,
                'stroke-width': String(C.strokeWidth),
                'stroke-linecap': 'butt',
                'pointer-events': 'none',
            });
            g.appendChild(rect);
            g.appendChild(path);
            svg.appendChild(g);

            refs[i === 0 ? 's' : 'd'] = { g: g, rect: rect, path: path };
        }, this);

        this._detailBtnS = refs['s'].g;
        this._detailBtnSRect = refs['s'].rect;
        this._detailBtnSPath = refs['s'].path;
        this._detailBtnD = refs['d'].g;
        this._detailBtnDRect = refs['d'].rect;
        this._detailBtnDPath = refs['d'].path;

        // Set initial highlight
        this._updateDetailToggle();

        // Bind click events
        const self = this;
        this._detailBtnSH = function(e) {
            e.stopPropagation();
            if (self.detailLevel !== 'simple') {
                self.setDetailLevel('simple');
            }
        };
        this._detailBtnDH = function(e) {
            e.stopPropagation();
            if (self.detailLevel !== 'detailed') {
                self.setDetailLevel('detailed');
            }
        };
        this._detailBtnS.addEventListener('pointerdown', this._detailBtnSH);
        this._detailBtnD.addEventListener('pointerdown', this._detailBtnDH);
    };

    // ==================== Subclasses (globally exposed for factory routing + type-check) ====================
})();

// Subclasses must be defined outside the IIFE to become globals (for third-party new trPicker24h() usage)
class trPicker24h extends trPicker {
    constructor(c, o = {}) { o.hourCycle = 24; super(c, o); }
}
class trPicker12h extends trPicker {
    constructor(c, o = {}) { o.hourCycle = 12; super(c, o); }
}
trPicker.registerMode('24h', trPicker24h);
trPicker.registerMode('12h', trPicker12h);

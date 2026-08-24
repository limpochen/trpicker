/**
 * trPicker — Fine slider module (virtual wheel)
 * ==============================================
 * A flat vertical bar similar to a middle-mouse-wheel, with a 3D ribbon perspective effect.
 * Drag speed determines the step rate: fast drag = fast stepping, slow drag = slow stepping.
 * Drag up = increase, drag down = decrease.
 * Wheel operation is preserved; each step = stepMinute.
 * Colors follow the selected handle color.
 * Depends on: trpicker.js
 */
(function() {
    'use strict';
    if (typeof trPicker === 'undefined') {
        throw new Error('trpicker-fine-slider.js: trPicker is not defined.');
    }

    const P = trPicker.prototype;

    // ==================== DOM creation ====================

    /** Create the virtual wheel DOM (3D ribbon + time labels) */
    P._createFineSlider = function() {
        if (this._fineSlider && this._fineSlider.parentNode) {
            this._fineSlider.parentNode.removeChild(this._fineSlider);
        }
        this._fineSlider = null;
        this._wheelMovement = 0;

        const parent = this._svg.parentNode;
        const FS = trPicker.APPEARANCE.fineSlider;
        const TW = FS.touchWidth;
        const VW = FS.visualWidth;
        const H = FS.height;

        const wrap = document.createElement('div');
        wrap.className = 'trpicker-fine-slider';
        wrap.style.width = TW + 'px';
        wrap.style.height = H + 'px';

        // Build the wheel SVG
        const visualX = (TW - VW) / 2;
        const borderX = visualX - 0.5;
        const borderW = VW + 1;
        const pad = VW * 0.2;

        let linesHtml = '';
        const mid = H / 2;
        const radius = H / 2;
        const dens = FS.ribbonDensity;
        const sw = FS.ribbonStrokeWidth;


        for (let deg = -180; deg < 180; deg += dens) {
            const rad = (deg * Math.PI) / 180;
            const cosVal = Math.cos(rad);
            // Create all lines (including the back) so back ribbons naturally appear as they rotate to the front
            // perspective=true: back lines keep a minimum 0.5px width (thin lines visible); false: back width=0 (hidden)
            const y = mid + radius * Math.sin(rad);
            const w = Math.max(FS.enablePerspective ? 0.5 : 0, sw * cosVal);
            linesHtml += '<line data-base="' + deg + '" x1="' + (visualX + pad) + '" y1="' + y + '" x2="' + (visualX + VW - pad) + '" y2="' + y + '" stroke-width="' + w + '" stroke-linecap="round" />';
        }

        wrap.innerHTML += '<svg width="100%" height="100%" viewBox="0 0 ' + TW + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">'
            + '<defs>'
            + '<clipPath id="fp-clip">'
            + '<rect x="' + visualX + '" y="2" width="' + VW + '" height="' + (H - 4) + '" rx="' + (VW / 2) + '" ry="' + (VW / 2) + '" />'
            + '</clipPath>'
            + '<linearGradient id="fp-shadow" x1="0" y1="0" x2="0" y2="1">'
            + '<stop offset="0%" stop-color="rgba(0,0,0,' + (FS.enablePerspective ? 0.35 : 0.1) + ')" />'
            + '<stop offset="15%" stop-color="rgba(0,0,0,0)" />'
            + '<stop offset="85%" stop-color="rgba(0,0,0,0)" />'
            + '<stop offset="100%" stop-color="rgba(0,0,0,' + (FS.enablePerspective ? 0.35 : 0.1) + ')" />'
            + '</linearGradient>'
            + '</defs>'
            + '<rect x="' + borderX + '" y="1" width="' + borderW + '" height="' + (H - 2) + '" rx="' + (borderW / 2) + '" ry="' + (borderW / 2) + '" stroke-width="1" class="fp-outer" fill="none" />'
            + '<g clip-path="url(#fp-clip)">'
            + '<rect x="' + visualX + '" y="2" width="' + VW + '" height="' + (H - 4) + '" class="fp-inner" />'
            + '<g id="fp-ribbon">' + linesHtml + '</g>'
            + '<rect x="' + visualX + '" y="2" width="' + VW + '" height="' + (H - 4) + '" fill="url(#fp-shadow)" pointer-events="none" />'
            + '</g>'
            + '</svg>';

        parent.appendChild(wrap);
        this._fineSlider = wrap;
        this._fpRibbon = wrap.querySelector('#fp-ribbon');

        this._fineDownH = (e) => this._onFineDown(e);
        wrap.addEventListener('pointerdown', this._fineDownH);

        this._fineWheelH = (e) => {
            if (this._fineTuning && this._selectedHandle) {
                e.preventDefault();
                this._onWheel(e);
                this._addWheelTarget(e.deltaY * 0.1);
            }
        };
    };

    // ==================== Color updates ====================

    /** Update the wheel color scheme (called on show / when the handle color changes) */
    P._updateWheelColors = function(color) {
        if (!this._fineSlider) return;
        const svg = this._fineSlider.querySelector('svg');
        if (!svg) return;
        const FS = trPicker.APPEARANCE.fineSlider;

        // Parse the base color into HSL and cache it
        this._fineHSL = this._hexToHSL(color);

        // Ribbon color — initially set to a uniform color; _renderRibbon overrides per Y position
        const lines = svg.querySelectorAll('#fp-ribbon line');
        for (let i = 0; i < lines.length; i++) {
            lines[i].setAttribute('stroke', color);
            lines[i].setAttribute('stroke-opacity', String(FS.ribbonOpacity));
        }

        // Outer frame: stroke only, using borderOpacity
        const outer = svg.querySelector('.fp-outer');
        if (outer) {
            outer.setAttribute('stroke', color);
            outer.setAttribute('stroke-opacity', String(FS.borderOpacity));
        }

        // Inner background: create a vertical exponential gradient
        const inner = svg.querySelector('.fp-inner');
        if (inner) {
            let grad = svg.querySelector('#fp-bg-grad');
            if (!grad) {
                const defs = svg.querySelector('defs');
                grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                grad.id = 'fp-bg-grad';
                grad.setAttribute('x1', '0');
                grad.setAttribute('y1', '0');
                grad.setAttribute('x2', '0');
                grad.setAttribute('y2', '1');
                defs.appendChild(grad);
            }
            // Clear old color stops
            while (grad.firstChild) grad.removeChild(grad.firstChild);
            // Approximate the exponential curve with 13 color stops
            const nStops = 13;
            for (let i = 0; i < nStops; i++) {
                const t = i / (nStops - 1);
                const dist = Math.abs(t * 2 - 1); // 0=center, 1=edge
                const stopColor = this._gradientColor(dist);
                const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop.setAttribute('offset', Math.round(t * 100) + '%');
                stop.setAttribute('stop-color', stopColor);
                stop.setAttribute('stop-opacity', String(FS.bgOpacity));
                grad.appendChild(stop);
            }
            inner.setAttribute('fill', 'url(#fp-bg-grad)');
            inner.removeAttribute('fill-opacity');
        }

        // Refresh ribbon colors (based on the current position)
        this._renderRibbon();
    };

    /** Render the ribbon (draws all stripe positions and widths from the current _wheelMovement) */
    P._renderRibbon = function() {
        const ribbon = this._fpRibbon;
        if (!ribbon) return;
        const FS = trPicker.APPEARANCE.fineSlider;
        const lines = ribbon.children;
        if (!lines || !lines.length) return;
        const mid = FS.height / 2;
        const radius = FS.height / 2;
        for (let i = 0; i < lines.length; i++) {
            const base = parseFloat(lines[i].getAttribute('data-base'));
            const curDeg = base + this._wheelMovement;
            const rad = (curDeg * Math.PI) / 180;
            const cosVal = Math.cos(rad);
            const w = FS.enablePerspective ? Math.max(0.5, FS.ribbonStrokeWidth * cosVal)
                                           : Math.max(0, FS.ribbonStrokeWidth * cosVal);
            const y = mid + radius * Math.sin(rad);
            lines[i].setAttribute('y1', y);
            lines[i].setAttribute('y2', y);
            lines[i].setAttribute('stroke-width', w);
        }
    };

    /** For dragging: accumulate the angle directly and render (direct, no interpolation) */
    P._updateWheelVis = function(deltaY) {
        const FS = trPicker.APPEARANCE.fineSlider;
        const deltaAngle = -(deltaY / FS.height) * 180;
        this._wheelMovement += deltaAngle;
        this._fineTarget = this._wheelMovement;
        this._stopWheelLerp();
        this._wrapMovement();
        this._renderRibbon();
    };

    /** For wheel: accumulate the target value and start the lerp rAF */
    P._addWheelTarget = function(deltaY) {
        const FS = trPicker.APPEARANCE.fineSlider;
        // Wheel deltaY has the opposite sign to drag dy; take the positive sign so the ribbon direction matches dragging
        this._fineTarget += (deltaY / FS.height) * 180;
        this._wrapFineTarget();
        this._startWheelLerp();
    };

    /** Angle wrapping (_wheelMovement and _fineTarget wrapped in sync) */
    P._wrapMovement = function() {
        if (this._wheelMovement > 360) this._wheelMovement -= 360;
        if (this._wheelMovement < -360) this._wheelMovement += 360;
    };
    P._wrapFineTarget = function() {
        if (this._fineTarget > 360) this._fineTarget -= 360;
        if (this._fineTarget < -360) this._fineTarget += 360;
    };

    /** Start the lerp rAF */
    P._startWheelLerp = function() {
        if (this._fineLerpId) return;
        const self = this;
        const FS = trPicker.APPEARANCE.fineSlider;
        const factor = FS.wheelLerpFactor;
        const threshold = FS.wheelLerpThreshold;
        (function loop() {
            // Wrap both before computing the diff to avoid _fineTarget going out of range and never stopping
            self._wrapMovement();
            self._wrapFineTarget();
            const diff = self._fineTarget - self._wheelMovement;
            if (Math.abs(diff) < threshold) {
                self._wheelMovement = self._fineTarget;
                self._fineLerpId = null;
                self._renderRibbon();
                return;
            }
            self._wheelMovement += diff * factor;
            self._renderRibbon();
            self._fineLerpId = requestAnimationFrame(loop);
        })();
    };

    /** Stop the lerp rAF */
    P._stopWheelLerp = function() {
        if (this._fineLerpId) {
            cancelAnimationFrame(this._fineLerpId);
            this._fineLerpId = null;
        }
    };

    // ==================== Show / hide ====================

    /** Show the virtual wheel */
    P._showFineSlider = function() {
        if (!this._fineSlider || !this._selectedHandle) return;
        const isStart = this._selectedHandle === 'start';
        const color = isStart ? this.startColor : this.endColor;

        this._fineSlider.classList.remove('trpicker-slider-left', 'trpicker-slider-right');
        this._fineSlider.classList.add(isStart ? 'trpicker-slider-left' : 'trpicker-slider-right');
        // Clear the opposite side's inline style to avoid stale positioning after switching
        this._fineSlider.style.left = '';
        this._fineSlider.style.right = '';
        this._fineSlider.style[isStart ? 'left' : 'right'] = trPicker.APPEARANCE.fineSlider.offset + 'px';
        this._fineSlider.style.display = 'flex';

        this._wheelMovement = 0;
        this._updateWheelColors(color);
        this._fineTuning = true;

        const parent = this._svg.parentNode;
        parent.addEventListener('wheel', this._fineWheelH, { passive: false });
    };

    /** Hide the virtual wheel */
    P._hideFineSlider = function() {
        if (!this._fineSlider) return;
        this._stopWheelLerp();
        this._fineSlider.style.display = 'none';
        this._fineTuning = false;
        this._fineActive = false;
        this._fineAccum = 0;
        this._wheelMovement = 0;
        this._fineTarget = 0;
        if (this._fineWheelH && this._svg && this._svg.parentNode) {
            this._svg.parentNode.removeEventListener('wheel', this._fineWheelH);
        }
        if (this._fineMoveH) {
            window.removeEventListener('pointermove', this._fineMoveH);
            this._fineMoveH = null;
        }
        if (this._fineUpH) {
            window.removeEventListener('pointerup', this._fineUpH);
            this._fineUpH = null;
        }
    };

    // ==================== Single-step ====================

    /** Perform a single step */
    P._fineStep = function(dir) {
        if (!this._selectedHandle) return;
        const step = dir * this.stepMinute;
        const v = (this._selectedHandle === 'start' ? this.startMinute : this.endMinute) + step;
        const newVal = ((v % 1440) + 1440) % 1440;
        if (this._validateMove(this._selectedHandle, newVal)) {
            this._setHandleValue(this._selectedHandle, newVal);
            this._update();
            this._updateViewBox(this.startMinute / 60, this.endMinute / 60);
            this.onChange(this.startMinute, this.endMinute);
        }
    };

    // ==================== Drag events ====================

    /**
     * pointerdown starts drag tracking
     * Accumulates movement → triggers stepping + wheel visual animation when a threshold is reached
     */
    P._onFineDown = function(e) {
        e.preventDefault();
        this._stopWheelLerp();
        this._fineActive = true;
        this._fineLastY = e.clientY;
        this._fineAccum = 0;
        this._wheelMovement = 0;
        this._fineTarget = 0;
        this._fineSlider.setPointerCapture(e.pointerId);
        this._fineSlider.classList.add('trpicker-active');

        this._fineMoveH = (ev) => this._onFineMove(ev);
        this._fineUpH   = (ev) => this._onFineUp(ev);
        window.addEventListener('pointermove', this._fineMoveH);
        window.addEventListener('pointerup',   this._fineUpH);
    };

    /** pointermove: accumulate movement + visual animation */
    P._onFineMove = function(e) {
        e.preventDefault();
        if (!this._fineActive || !this._selectedHandle) return;

        const dy = this._fineLastY - e.clientY;  // positive when moving up
        this._fineLastY = e.clientY;
        const sens = trPicker.APPEARANCE.fineSlider.sensitivity;

        // Step logic
        this._fineAccum += dy;
        const thr = 1 / sens;
        while (this._fineAccum >= thr) { this._fineStep(1);  this._fineAccum -= thr; }
        while (this._fineAccum <= -thr) { this._fineStep(-1); this._fineAccum += thr; }

        // Wheel visual animation
        this._updateWheelVis(dy);
    };

    /** pointerup: stop tracking */
    P._onFineUp = function(e) {
        this._fineActive = false;
        this._fineAccum = 0;
        this._fineSlider.classList.remove('trpicker-active');
        window.removeEventListener('pointermove', this._fineMoveH);
        window.removeEventListener('pointerup',   this._fineUpH);
        this._fineMoveH = null;
        this._fineUpH   = null;
    };

    // ==================== HSL color utilities ====================

    /** Hex → HSL (returns { h, s, l }, h: 0-360, s: 0-100, l: 0-100) */
    P._hexToHSL = function(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return { h: h * 360, s: s * 100, l: l * 100 };
    };

    /** HSL → Hex color */
    P._HSLToHex = function(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        const a = s * Math.min(l, 1 - l);
        const f = function(n) {
            const k = (n + h * 12) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return '#' + f(0) + f(8) + f(4);
    };

    /**
     * Exponential gradient color calculation
     * @param {number} dist - Normalized distance from the center (0=center, 1=edge)
     * @returns {string} hex color
     */
    P._gradientColor = function(dist) {
        const { h, s, l } = this._fineHSL;
        const FS = trPicker.APPEARANCE.fineSlider;
        const lightUp = FS.gradientLighten;
        const darkDown = FS.gradientDarken;
        const exp = FS.gradientExponent;
        const newL = l + lightUp - (lightUp + darkDown) * Math.pow(dist, exp);
        return this._HSLToHex(h, s, Math.max(0, Math.min(100, newL)));
    };
})();

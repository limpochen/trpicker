/**
 * trPicker — View update module
 * ==============================
 * Handles arc rendering, handle updates, AM/PM labels, and smooth viewBox zoom.
 */
import trPicker from './trpicker.js';

const P = trPicker.prototype;

    // ==================== Main update ====================

    P._update = function() {
        if (!this._svg) return;

        const startH = this.startMinute / 60;
        const endH   = this.endMinute   / 60;
        const sp = this._hourToPoint(startH);
        const ep = this._hourToPoint(endH);

        // --- Arc path + overlap rendering ---
        this._renderArcs(startH, endH, sp, ep);

        // --- Handle colors & pointer positions ---
        this._startInner.setAttribute('fill', this.startColor);
        this._endInner.setAttribute('fill', this.endColor);
        this._updatePointer(this._startPointer, startH, this.startColor);
        this._updatePointer(this._endPointer,   endH,   this.endColor);

        // --- Arc color and opacity ---
        const A = trPicker.APPEARANCE;
        const is12hLong = this.hourCycle === 12 && (this.endMinute - this.startMinute + 1440) % 1440 >= 720;
        const arcStroke = (this.lineColor === 'gradient')
            ? 'url(#trpickerGradient)' : this.lineColor;
        this._arcPath.setAttribute('stroke', arcStroke);
        this._arcPath.setAttribute('stroke-opacity',
            String(is12hLong ? A.arc.overlapStrokeOpacity : A.arc.strokeOpacity));

        // --- Gradient stop colors ---
        this._gradStop0.setAttribute('stop-color', this.startColor);
        this._gradStop1.setAttribute('stop-color', this.endColor);

        // --- Handle positions ---
        this._startG.setAttribute('transform', `translate(${sp.x}, ${sp.y})`);
        this._endG.setAttribute('transform',   `translate(${ep.x}, ${ep.y})`);

        // --- Shape rotation ---
        if (this._startShape) {
            const stDeg = (this._getAngle(startH) + Math.PI / 2) * 180 / Math.PI;
            this._startShape.setAttribute('transform', `rotate(${stDeg.toFixed(1)})`);
        }
        if (this._endShape) {
            const etDeg = (this._getAngle(endH) + Math.PI / 2) * 180 / Math.PI;
            this._endShape.setAttribute('transform', `rotate(${etDeg.toFixed(1)})`);
        }

        // --- AM/PM label update (12H mode) ---
        this._updateAmPmLabels(startH, endH);

        // --- Mode toggle highlight ---
        this._updateModeToggle();

        // --- Step pill text ---
        this._updateStepPill();

        // --- Detail toggle highlight ---
        this._updateDetailToggle();
    };

    // ==================== Arc + overlap rendering ====================

    /** Render the arc, sector, and the 12H overlap region */
    P._renderArcs = function(startH, endH, sp, ep) {
        if (this.startMinute === this.endMinute) {
            this._sectorPath.setAttribute('visibility', 'hidden');
            this._arcPath.setAttribute('visibility', 'hidden');
            if (this._overlapSectorPath) this._overlapSectorPath.setAttribute('visibility', 'hidden');
            if (this._fullCirclePath)    this._fullCirclePath.setAttribute('visibility', 'hidden');
            return;
        }

        const arcR = this.R_ARC;
        const A = trPicker.APPEARANCE;
        const cwDist = (this.endMinute - this.startMinute + 1440) % 1440;
        const isLongRange = this.hourCycle === 12 && cwDist >= 720;
        const sa = this._getAngle(startH);
        const ea = this._getAngle(endH);
        let da = ea - sa;
        if (da < 0) da += 2 * Math.PI;
        const large = da > Math.PI ? 1 : 0;

        // Sector path (always the small arc = the part beyond 360°)
        const sectorD = `M ${this.CX} ${this.CY} L ${sp.x} ${sp.y} A ${arcR} ${arcR} 0 ${large} 1 ${ep.x} ${ep.y} Z`;

        // Arc path: always matches the sector arc (normal = range boundary, overlap = beyond-boundary part)
        const arcD = `M ${sp.x} ${sp.y} A ${arcR} ${arcR} 0 ${large} 1 ${ep.x} ${ep.y}`;

        const fillColor = this.lineColor === 'gradient'
            ? 'url(#trpickerGradient)' : this.lineColor;

        // Set gradient: span the diameter through the center along the chord direction to simulate an arc gradient
        if (this.lineColor === 'gradient') {
            let gAngle;
            const gradDx = ep.x - sp.x, gradDy = ep.y - sp.y;
            const gradDist = Math.sqrt(gradDx * gradDx + gradDy * gradDy);
            if (gradDist < 1) {
                // When sp/ep coincide, use the arc midpoint direction
                const midA = sa + da / 2;
                gAngle = midA;
            } else {
                // Along the chord (sp→ep) through the center, so the color transitions along the arc
                // Add π to reverse: arc start → startColor, arc end → endColor
                gAngle = Math.atan2(gradDy, gradDx) + Math.PI;
            }
            const gx1 = this.CX + arcR * Math.cos(gAngle);
            const gy1 = this.CY + arcR * Math.sin(gAngle);
            const gx2 = this.CX + arcR * Math.cos(gAngle + Math.PI);
            const gy2 = this.CY + arcR * Math.sin(gAngle + Math.PI);
            this._gradient.setAttribute('x1', gx1);
            this._gradient.setAttribute('y1', gy1);
            this._gradient.setAttribute('x2', gx2);
            this._gradient.setAttribute('y2', gy2);
        }

        const arcStroke2 = this.lineColor === 'gradient'
            ? 'url(#trpickerGradient)' : this.lineColor;

        // ---- 12H mode: when the range exceeds 12 hours, full-circle fill + overlap highlight for the over-12h part ----
        if (isLongRange) {
            // Full-circle base + outline: covers the first 12 hours (360°), outline opacity 80%
            this._fullCirclePath.setAttribute('fill', fillColor);
            this._fullCirclePath.setAttribute('fill-opacity', String(A.arc.fillOpacity));
            this._fullCirclePath.setAttribute('stroke', arcStroke2);
            this._fullCirclePath.setAttribute('stroke-width', String(A.arc.width));
            this._fullCirclePath.setAttribute('stroke-opacity', String(A.arc.strokeOpacity));
            this._fullCirclePath.removeAttribute('visibility');

            // Main sector: only the part beyond 360° (e.g. 60° for 7→9)
            this._sectorPath.setAttribute('fill', fillColor);
            this._sectorPath.setAttribute('d', sectorD);
            this._sectorPath.setAttribute('fill-opacity', String(A.arc.fillOpacity));
            this._sectorPath.removeAttribute('visibility');

            // Overlap sector: higher opacity over the same region
            this._overlapSectorPath.setAttribute('fill', fillColor);
            this._overlapSectorPath.setAttribute('d', sectorD);
            this._overlapSectorPath.setAttribute('fill-opacity', String(A.arc.overlapFillOpacity));
            this._overlapSectorPath.removeAttribute('visibility');
        } else {
            // Normal rendering
            if (this._fullCirclePath) {
                this._fullCirclePath.setAttribute('visibility', 'hidden');
                this._fullCirclePath.removeAttribute('stroke');
                this._fullCirclePath.removeAttribute('stroke-width');
                this._fullCirclePath.removeAttribute('stroke-opacity');
            }
            if (this._overlapSectorPath) this._overlapSectorPath.setAttribute('visibility', 'hidden');

            this._sectorPath.setAttribute('fill', fillColor);
            this._sectorPath.setAttribute('d', sectorD);
            this._sectorPath.setAttribute('fill-opacity', String(A.arc.fillOpacity));
            this._sectorPath.removeAttribute('visibility');
        }

        // Arc: normal = range boundary; overlap = beyond-boundary part (100% opacity, on top of the full-circle outline)
        this._arcPath.setAttribute('d', arcD);
        this._arcPath.removeAttribute('visibility');
        this._arcPath.setAttribute('stroke-opacity',
            String(isLongRange ? A.arc.overlapStrokeOpacity : A.arc.strokeOpacity));
    };

    // ==================== AM/PM labels ====================

    /**
     * Update the AM/PM labels in 12H mode.
     * Responsibility boundary: the label nodes are created by the svg module _buildHandle; this method only handles text and visibility;
     * text is configured via this.amText / this.pmText.
     */
    P._updateAmPmLabels = function(startH, endH) {
        const is12h = this.hourCycle === 12;
        const amText = this.amText || 'AM';
        const pmText = this.pmText || 'PM';
        const y = String(-(trPicker.APPEARANCE.handle.innerRadius + 14));

        function updateLabel(label, hour) {
            if (!label) return;
            if (is12h) {
                label.textContent = hour < 12 ? amText : pmText;
                label.setAttribute('x', '0');
                label.setAttribute('y', y);
                label.removeAttribute('visibility');
            } else {
                label.setAttribute('visibility', 'hidden');
            }
        }
        updateLabel(this._startAmPmLabel, startH);
        updateLabel(this._endAmPmLabel, endH);
    };

    // ==================== Mode toggle highlight ====================

    /** Generic two-state toggle highlight update (shared by _updateModeToggle / _updateDetailToggle) */
    P._updateToggle = function(activeStyle, inactiveStyle, items) {
        items.forEach(function(item) {
            const s = item.active ? activeStyle : inactiveStyle;
            if (item.rect) {
                item.rect.setAttribute('fill', s.fill);
                item.rect.setAttribute('stroke', s.stroke);
            }
            if (item.text) item.text.setAttribute('fill', s.text);
            if (item.path) item.path.setAttribute('stroke', s.path);
        });
    };

    /** Update the highlight state of the 24H / 12H toggle buttons */
    P._updateModeToggle = function() {
        const C = trPicker.APPEARANCE.controls.colors;
        this._updateToggle(
            { fill: C.active.fill, text: C.active.text, stroke: C.active.stroke },
            { fill: C.inactive.fill, text: C.inactive.text, stroke: C.inactive.stroke },
            [
                { rect: this._modeToggle24hRect, text: this._modeToggle24hText, active: this.hourCycle === 24 },
                { rect: this._modeToggle12hRect, text: this._modeToggle12hText, active: this.hourCycle !== 24 },
            ]
        );
    };

    // ==================== Step pill text update ====================

    P._updateStepPill = function() {
        if (this._stepPillText) {
            this._stepPillText.textContent = this.stepMinute + 'm';
        }
    };

    // ==================== Step-grid dashed circle display ====================

    /**
     * Draw a dashed grid on the dial's outer ring after clicking the step pill.
     * Each dash = the arc length of stepMinute minutes; the gap = the same arc length.
     * Fades out smoothly via CSS transition (config stepGrid.fadeDuration).
     * Repeated clicks immediately reset the display and restart the fade-out.
     */
    P._showStepGrid = function() {
        const grid = this._stepGridCircle;
        if (!grid) return;

        // Clear the previous fade-out timer
        if (this._stepGridTimeout) {
            clearTimeout(this._stepGridTimeout);
            this._stepGridTimeout = null;
        }

        const cfg = trPicker.APPEARANCE.stepGrid;
        const step = this.stepMinute;
        const totalMin = this.hourCycle === 12 ? 720 : 1440;
        const circ = 2 * Math.PI * this.R;

        // Compute stroke-dasharray: each dash = step-minute arc length, gap equal
        const dashLen = (step / totalMin) * circ;
        grid.setAttribute('stroke-dasharray', dashLen.toFixed(2) + ' ' + dashLen.toFixed(2));

        // ---- Show immediately (remove transition to avoid old-animation interference) ----
        grid.style.transition = 'none';
        grid.setAttribute('stroke-opacity', String(cfg.opacity));

        // ---- Start the fade-out transition on the next frame ----
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                grid.style.transition = 'stroke-opacity ' + cfg.fadeDuration + 'ms ease-out';
                grid.setAttribute('stroke-opacity', '0');
            });
        });

        // Clear the transition style after the animation to avoid residue affecting later runs
        this._stepGridTimeout = setTimeout(function() {
            grid.style.transition = '';
            this._stepGridTimeout = null;
        }.bind(this), cfg.fadeDuration + 50);
    };

    // ==================== Detail toggle highlight ====================

    /** Update the highlight state of the detail toggle buttons */
    P._updateDetailToggle = function() {
        const C = trPicker.APPEARANCE.controls.colors;
        this._updateToggle(
            { fill: C.active.fill, stroke: C.active.stroke, path: C.active.text },
            { fill: C.inactive.fill, stroke: C.inactive.stroke, path: C.inactive.text },
            [
                { rect: this._detailBtnSRect, path: this._detailBtnSPath, active: this.detailLevel === 'simple' },
                { rect: this._detailBtnDRect, path: this._detailBtnDPath, active: this.detailLevel !== 'simple' },
            ]
        );
    };

    // ==================== Pointer update ====================

    P._updatePointer = function(pointer, hour, color) {
        if (!pointer) return;
        const A = trPicker.APPEARANCE.handle.pointer;
        const angle = this._getAngle(hour);
        const len = A.length;
        const stroke = A.color || color;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x1 = (-this.R_ARC * cos).toFixed(2);
        const y1 = (-this.R_ARC * sin).toFixed(2);
        const x2 = (len * cos).toFixed(2);
        const y2 = (len * sin).toFixed(2);
        pointer.setAttribute('x1', x1);
        pointer.setAttribute('y1', y1);
        pointer.setAttribute('x2', x2);
        pointer.setAttribute('y2', y2);
        pointer.setAttribute('stroke', stroke);
    };

    // ==================== Handle highlight ====================

    P._updateHandleHighlights = function() {
        const target = this._dragging || this._selectedHandle;
        this._setHandleHighlight('start', target === 'start');
        this._setHandleHighlight('end',   target === 'end');
    };

    P._setHandleHighlight = function(which, on) {
        const sel = trPicker.APPEARANCE.handle.selected;
        const outer = which === 'start' ? this._startOuter : this._endOuter;
        if (!outer) return;
        if (on) {
            outer.setAttribute('stroke', sel.outerStroke);
            outer.setAttribute('stroke-width', String(sel.outerStrokeWidth));
            outer.setAttribute('fill', sel.outerFill);
        } else {
            const A = trPicker.APPEARANCE.handle;
            outer.setAttribute('stroke', A.outerStroke);
            outer.setAttribute('stroke-width', String(A.outerStrokeWidth));
            outer.setAttribute('fill', A.outerFill);
        }
    };

    // ==================== Auto zoom (delegated to the zoom module) ====================

    /**
     * Compute the optimal viewport from the start/end angle span, then delegate the smooth transition to the zoom module (this.zoom.frame).
     * Responsibility boundary: this method only does geometric calculation; viewport state and animation are fully managed by the zoom module.
     */
    P._updateViewBox = function(startH, endH) {
        // Compute the start/end angle span
        let diff;
        if (this.hourCycle === 12) {
            const cwDist = (this.endMinute - this.startMinute + 1440) % 1440;
            diff = (cwDist / 1440) * 2 * Math.PI;
        } else {
            const sa = this._getAngle(startH);
            const ea = this._getAngle(endH);
            diff = ea - sa;
            if (diff < 0) diff += 2 * Math.PI;
        }
        const cappedDiff = Math.min(diff, Math.PI);

        const VB = trPicker.APPEARANCE.viewBox;
        const Z  = trPicker.APPEARANCE.zoom;
        const fullSize = VB.fullSize;
        const minSize  = VB.minSize;

        // Derive the auto-zoom size from the angle span
        const ratio    = Math.pow(cappedDiff / Math.PI, VB.autoZoomExponent);
        const autoSize = minSize + (fullSize - minSize) * ratio;

        // auto-zoom is not affected by _userZoom; always computes the optimal view
        const size = autoSize;

        // Use the arc midpoint as the viewport center
        const sp = this._hourToPoint(startH);
        const ep = this._hourToPoint(endH);
        const arcCX = (sp.x + ep.x) / 2;
        const arcCY = (sp.y + ep.y) / 2;

        // Delegate the smooth transition to the zoom module
        this.zoom.frame(arcCX, arcCY, size / 2);
    };

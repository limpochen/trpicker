/**
 * trPicker — Event system module
 * ===============================
 * Pointer events, touch events, wheel events.
 * 12H mode: continuous two-ring rotation + free span crossing (no constraints).
 * 24H mode: original span-crossing constraints preserved.
 */
import trPicker from './trpicker.js';

const P = trPicker.prototype;

    // ==================== Event binding ====================

    P._bindEvents = function() {
        this._onDownHandler = e => this._onDown(e);
        this._onMoveHandler = e => this._onMove(e);
        this._onUpHandler   = e => this._onUp(e);
        this._onWheelHandler = e => this._onWheel(e);
        this._svg.addEventListener('pointerdown', this._onDownHandler);
        window.addEventListener('pointermove',   this._onMoveHandler);
        window.addEventListener('pointerup',     this._onUpHandler);
        this._svg.addEventListener('wheel',       this._onWheelHandler, { passive: false });

        this._touchStartHandler = e => this._onTouchStart(e);
        this._touchMoveHandler  = e => this._onTouchMove(e);
        this._touchEndHandler   = e => this._onTouchEnd(e);
        this._svg.addEventListener('touchstart', this._touchStartHandler, { passive: false });
        this._svg.addEventListener('touchmove',  this._touchMoveHandler,  { passive: false });
        this._svg.addEventListener('touchend',   this._touchEndHandler);
    };

    // ==================== Coordinate conversion ====================

    /** Screen coords → SVG viewBox coords */
    P._toSVGPoint = function(clientX, clientY) {
        const pt = this._svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const ctm = this._svg.getScreenCTM();
        if (!ctm) return { x: this.CX, y: this.CY };
        const svgPt = pt.matrixTransform(ctm.inverse());
        return { x: svgPt.x, y: svgPt.y };
    };

    /** Hit test: returns 'start' | 'end' | null */
    P._hitTest = function(sx, sy) {
        const sp = this._hourToPoint(this.startMinute / 60);
        const ep = this._hourToPoint(this.endMinute   / 60);
        const th  = this.handleRadius + this.touchPadding;
        const th2 = th * th;

        const ds = (sx - sp.x) ** 2 + (sy - sp.y) ** 2;
        const de = (sx - ep.x) ** 2 + (sy - ep.y) ** 2;

        const hitS = ds <= th2;
        const hitE = de <= th2;

        if (!hitS && !hitE) return null;
        if (hitS && !hitE) return 'start';
        if (!hitS && hitE) return 'end';

        // Both handles hit → distinguish precisely by angle
        const ptrAngle = Math.atan2(sy - this.CY, sx - this.CX);
        const sAngle = this._getAngle(this.startMinute / 60);
        const eAngle = this._getAngle(this.endMinute   / 60);
        const diffS = Math.abs(trPicker._angleDiff(ptrAngle, sAngle));
        const diffE = Math.abs(trPicker._angleDiff(ptrAngle, eAngle));
        return diffS <= diffE ? 'start' : 'end';
    };

    // ==================== Pointer events ====================

    P._onDown = function(e) {
        const pt = this._toSVGPoint(e.clientX, e.clientY);
        const hit = this._hitTest(pt.x, pt.y);
        if (hit) {
            e.preventDefault();
            this._dragging = hit;
            this._selectedHandle = hit;
            this._hasDragged = false;
            this._svg.setPointerCapture(e.pointerId);
            this._updateHandleHighlights();
        } else if (this._size < trPicker.APPEARANCE.viewBox.fullSize) {
            if (this._fineTuning || this._selectedHandle) {
                this._selectedHandle = null;
                this._hideFineSlider();
                this._updateHandleHighlights();
            }
            e.preventDefault();
            this._panning       = true;
            this._panStartX     = e.clientX;
            this._panStartY     = e.clientY;
            const _ps = this.zoom.getState();
            this._panStartCX    = _ps.cx;
            this._panStartCY    = _ps.cy;
            const rect = this._svg.getBoundingClientRect();
            this._panStartScale = _ps.size / (rect.width || 1);
            this._svg.setPointerCapture(e.pointerId);
        } else {
            this._selectedHandle = null;
            this._hideFineSlider();
            this._updateHandleHighlights();
        }
    };

    P._onMove = function(e) {
        if (this._panning) {
            e.preventDefault();
            const dx = e.clientX - this._panStartX;
            const dy = e.clientY - this._panStartY;
            const ncx = this._panStartCX - dx * this._panStartScale;
            const ncy = this._panStartCY - dy * this._panStartScale;
            this.zoom.panTo(ncx, ncy);
            return;
        }
        if (!this._dragging) return;
        e.preventDefault();

        if (!this._hasDragged) {
            this._hideFineSlider();
        }
        this._hasDragged = true;

        const pt       = this._toSVGPoint(e.clientX, e.clientY);
        const rawAngle = Math.atan2(pt.y - this.CY, pt.x - this.CX);

        let hourF;
        if (this.hourCycle === 12) {
            // === 12H continuous two-ring rotation ===
            const curMinutes = this._dragging === 'start' ? this.startMinute : this.endMinute;
            hourF = this._get12hHourFromAngle(rawAngle, curMinutes);
        } else {
            hourF = this._angleToHour(rawAngle);
        }

        const raw      = Math.round(hourF * 60) % 1440;
        const minute   = Math.round(raw / this.stepMinute) * this.stepMinute % 1440;

        if (this._validateMove(this._dragging, minute)) {
            this._setHandleValue(this._dragging, minute);
        }

        this._update();
        this._updateViewBox(this.startMinute / 60, this.endMinute / 60);
        this.onChange(this.startMinute, this.endMinute);
    };

    P._onUp = function(e) {
        if (this._panning) {
            if (e.pointerId !== undefined) {
                this._svg.releasePointerCapture(e.pointerId);
            }
            this._panning = false;
            return;
        }
        if (this._dragging && e.pointerId !== undefined) {
            this._svg.releasePointerCapture(e.pointerId);
        }
        if (this._hasDragged) {
            this._selectedHandle = null;
            this._hideFineSlider();
        } else if (this._selectedHandle && this.enableFineSlider) {
            this._showFineSlider();
        }
        this._dragging = null;
        this._hasDragged = false;
        this._updateHandleHighlights();
    };

    // ==================== Wheel events ====================

    P._onWheel = function(e) {
        if (this._selectedHandle) {
            e.preventDefault();
            const step = (e.deltaY || e.deltaX) < 0 ? this.stepMinute : -this.stepMinute;
            const v = (this._selectedHandle === 'start'
                ? this.startMinute : this.endMinute) + step;
            const newVal = ((v % 1440) + 1440) % 1440;

            if (this._validateMove(this._selectedHandle, newVal)) {
                this._setHandleValue(this._selectedHandle, newVal);
            }
            this._update();
            this._updateViewBox(this.startMinute / 60, this.endMinute / 60);
            this.onChange(this.startMinute, this.endMinute);
            return;
        }

        e.preventDefault();

        const Z = trPicker.APPEARANCE.zoom;
        const factor = 1 - e.deltaY * Z.wheelSensitivity;
        this._userZoom = Math.max(Z.minZoom, Math.min(Z.maxZoom, this._userZoom * factor));
        const pt = this._toSVGPoint(e.clientX, e.clientY);
        this.zoom.scale(pt.x, pt.y, factor);
    };

    // ==================== Pinch zoom ====================

    P._onTouchStart = function(e) {
        if (e.touches.length === 2) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            this._pinchStartDist = Math.sqrt(dx * dx + dy * dy);
            this._pinchState = this.zoom.getState();
            this._pinchStartUserZoom = this._userZoom;
            const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const pt = this._toSVGPoint(cx, cy);
            this._pinchCX = pt.x;
            this._pinchCY = pt.y;
        } else {
            this._pinchStartDist = 0;
        }
    };

    P._onTouchMove = function(e) {
        if (e.touches.length === 2 && this._pinchStartDist > 0) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const scale = dist / this._pinchStartDist;
            const Z = trPicker.APPEARANCE.zoom;
            this._userZoom = Math.max(Z.minZoom, Math.min(Z.maxZoom, this._pinchStartUserZoom * scale));
            const start = this._pinchState;
            const targetSize = start.size / scale;
            // Keep the pinch center fixed
            const ratio = targetSize / start.size;
            const ncx = this._pinchCX - (this._pinchCX - start.cx) * ratio;
            const ncy = this._pinchCY - (this._pinchCY - start.cy) * ratio;
            this.zoom.set(ncx, ncy, targetSize);
        }
    };

    P._onTouchEnd = function(e) {
        if (e.touches.length < 2) {
            this._pinchStartDist = 0;
            this._pinchCX = null;
            this._pinchCY = null;
            this._pinchState = null;
        }
    };

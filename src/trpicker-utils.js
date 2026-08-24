/**
 * trPicker — Utility functions module
 * ====================================
 * Pure functions such as angle/hour conversion and coordinate math.
 * Depends on: trpicker.js, trpicker-config.js
 */
(function() {
    'use strict';
    if (typeof trPicker === 'undefined') {
        throw new Error('trpicker-utils.js: trPicker is not defined.');
    }

    const P = trPicker.prototype;

    // ==================== Angle / hour conversion ====================

    /**
     * Hour → radian (coordinate system with the Y-axis pointing down)
     * 0=bottom(PI/2)  6=left(PI)  12=top(3PI/2)  18=right(0)
     */
    P._hourToAngle = function(hour) {
        return Math.PI / 2 + (hour / 24) * Math.PI * 2;
    };

    /**
     * 12-hour cycle angle mapping: like a real clock
     * 6/18→bottom  9/21→left  12/0→top  15/3→right
     */
    P._hourToAngle12h = function(hour) {
        return 3 * Math.PI / 2 + (hour % 12) * Math.PI / 6;
    };

    /** Return the angle mapping for the current hour cycle */
    P._getAngle = function(hour) {
        return this.hourCycle === 12
            ? this._hourToAngle12h(hour)
            : this._hourToAngle(hour);
    };

    /** Radians → hour (float 0-23, normalized automatically; 24H mode only) */
    P._angleToHour = function(angle) {
        const h = ((angle - Math.PI / 2) / (Math.PI * 2)) * 24;
        return ((h % 24) + 24) % 24;
    };

    /** Hour → SVG viewBox coordinate */
    P._hourToPoint = function(hour) {
        const a = this._getAngle(hour);
        return {
            x: this.CX + this.R_ARC * Math.cos(a),
            y: this.CY + this.R_ARC * Math.sin(a),
        };
    };

    /** Compute the minimum angle between two radians (handles the 0/2π wraparound) */
    trPicker._angleDiff = function(a, b) {
        let d = b - a;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        return d;
    };

    // ==================== 12H step validation (shared by three call sites) ====================

    /**
     * Validate whether the handle's distance after movement is legal in 12H mode.
     * @param {number} newDist - Clockwise distance after movement (minutes)
     * @param {number} oldDist - Clockwise distance before movement (minutes)
     * @param {number} stepMinute - Minimum step size
     * @returns {boolean} Whether this movement is allowed
     */
    P._validate12hStep = function(newDist, oldDist, stepMinute) {
        const cwChange = (newDist - oldDist + 1440) % 1440;
        const crossedFB = (cwChange <= 720 && oldDist > 720 && newDist < 720) ||
                        (cwChange > 720 && oldDist < 720 && newDist > 720);
        return !crossedFB && newDist >= stepMinute && newDist <= 1440 - stepMinute;
    };

    // ==================== 12H double-circle helpers ====================

    /**
     * 12H mode: compute the new 0~23 hour value from the raw angle and the current minutes.
     * Supports continuous double-circle rotation, auto-switching AM/PM when crossing the 12 o'clock position.
     */
    P._get12hHourFromAngle = function(rawAngle, currentMinutes) {
        const clockPos = ((rawAngle - 3 * Math.PI / 2) / (Math.PI / 6) + 12) % 12;
        const currentHour = currentMinutes / 60;
        const currentClockPos = currentHour % 12;

        // Detect whether the 12 o'clock position is crossed
        let delta = clockPos - currentClockPos;
        if (delta > 6) delta -= 12;
        else if (delta < -6) delta += 12;

        let newHour = currentHour + delta;
        // Clamp to the 0~23.999 range
        newHour = ((newHour % 24) + 24) % 24;
        return newHour;
    };
})();

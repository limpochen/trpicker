/**
 * trPicker — Appearance configuration module
 * ===========================================
 * All dial visual parameters are centralized here for easy overall tuning.
 * Loaded as a standalone file; must be loaded after trpicker.js.
 */
(function() {
    'use strict';
    if (typeof trPicker === 'undefined') {
        throw new Error('trpicker-config.js: trPicker is not defined. Make sure trpicker.js is loaded first.');
    }

    trPicker.APPEARANCE = {
        // ---- Dial geometry ----
        centerX: 160,                     // Center X (viewBox 320×320)
        centerY: 160,                     // Center Y
        outerRingRadius: 108,             // Outer ring radius

        // ---- Outer ring ----  
        outerRing: {
            strokeWidth: 2,               // Outer ring stroke width
            strokeColor: '#d3d3d3',       // Outer ring stroke color
            fill: '#ececec',              // Outer ring fill color
        },

        // ---- Ticks (uniform gap to the ring via tickGap) ----
        tickGap: 6,                       // Distance from the tick's inner/outer ends to the ring
        tick: {
            major: {
                length: 10,               // Tick length
                width: 2,                 // Tick width
                color: '#6b7280',         // Tick color
            },
            minor: {
                length: 8,                // Tick length
                width: 1.5,               // Tick width
                color: '#9ca3af',         // Tick color
            },
            half: {
                length: 6,                // Tick length
                width: 1.5,               // Tick width
                color: '#c4c9d0',         // Tick color
            },
            micro: {
                length: 4,                // Tick length
                width: 1,                 // Tick width
                color: '#d1d5db',         // Tick color
            },
        },

        // ---- Numbers ----
        number: {
            outerOffset: 28,              // Distance from the numbers to the outer ring
            fontSize: 14,                 // CSS default font size
            color: '#1f2937',             // Number color
        },

        // ---- Drag handles ----
        handle: {
            outerRadius: 10,               // Outer ring radius
            innerRadius: 8,               // Inner ring radius
            outerFill: '#fff',            // Outer ring fill color
            outerStroke: '#d1d5db',       // Outer ring stroke color
            outerStrokeWidth: 1.5,        // Outer ring stroke width
            innerFill: null,              // Inner fill color (null = use startColor/endColor)
            showLabel: true,              // Whether to show the shape marker
            touchPadding: 8,              // Extra touch hit tolerance area
            pointer: {
                show: true,               // Whether to show the pointer
                length: 14,               // Pointer length (extends outward from the handle center)
                width: 2,                 // Pointer width
                color: null,              // Pointer color (null = use startColor/endColor)
            },
            selected: {
                outerStroke: '#0ca156',   // Outer stroke color when selected
                outerStrokeWidth: 1.5,    // Outer stroke width when selected
                outerFill: '#eef2ff',     // Outer fill color when selected
            },
        },

        // ---- Time range arc ----
        arc: {
            width: 5,                     // Arc stroke width
            lineCap: 'round',             // Arc line cap style
            inset: 12,                    // Inset distance of the arc/handles from the ring line
            fillOpacity: 0.3,             // Sector fill opacity (normal)
            overlapFillOpacity: 0.5,      // Sector fill opacity (overlap sector)
            strokeOpacity: 0.8,           // Arc opacity (normal)
            overlapStrokeOpacity: 1.0,    // Arc opacity (overlap sector)
        },

        // ---- Zoom & view ----
        zoom: {
            minZoom: 1.0,             // Minimum zoom factor (100%)
            maxZoom: 3.0,             // Maximum zoom factor (300%)
            wheelSensitivity: 0.0008, // Wheel zoom sensitivity; higher values zoom faster, recommended 0.0005-0.0015
        },
        viewBox: {
            fullSize: 320,            // Full viewBox size (SVG coordinate space)
            minSize: 100,             // Minimum size for auto zoom
            autoZoomExponent: 0.35,   // Auto zoom curve exponent
            lerpSpeed: 0.28,          // viewBox animation interpolation speed
            panMargin: 48,            // Extra distance by which the panning bounds are expanded
        },

        // ---- Defaults ----
        defaults: {
            endMinute: 360,           // Default end minute (initial range when start and end are both 0)
        },

        // ---- Options defaults (used to initialize the constructor) ----
        defaultsOptions: {
            hourCycle:         24,
            startMinute:       0,
            endMinute:         360,
            stepMinute:        10,
            startColor:        '#4f46e5',
            endColor:          '#ef4444',
            lineColor:         '#28a050',
            detailLevel:       'simple',
            enableModeSwitch:   true,
            enableStepAdjust:   true,
            enableDetailAdjust: true,
            enableFineSlider:   true,
            enableMinStep:      true,
            dialStyle:         'solid',
            popup:             true,
            popupAnimation:    'fade',
            popupBorderRadius: 16,
        },

        // ---- Control buttons (mode toggle / step pill / detail toggle) ----
        controls: {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            strokeWidth: 1,
            fontSize: 10,
            fontWeight: '600',
            modeToggle: {
                btnW: 28, btnH: 18,
                topY: 16, leftX: 248,
            },
            stepPill: {
                pillW: 36, pillH: 18,
                topY: 16, leftX: 16,
            },
            detailToggle: {
                btnW: 22, btnH: 18,
                margin: 16,
            },
            colors: {
                // Primary color (selected item)
                active:   { fill: '#4f46e5', stroke: '#4f46e5', text: '#ffffff' },
                // Secondary color (unselected)
                inactive: { fill: '#e5e7eb', stroke: '#d1d5db', text: '#6b7280' },
            },
        },

        // ---- Popup panel ----
        popup: {
            margin: 8,                // Safe margin between the popup and the screen edge
            offset: 4,                // Gap between the popup and its trigger
            defaultWidth: 320,        // Default popup width (used when offset is unavailable)
            defaultHeight: 320,       // Default popup height
            borderRadius: 16,         // Popup corner radius
            animationDuration: 180,   // Popup animation duration (ms)
        },

        // ---- Fine slider (virtual wheel) ----
        fineSlider: {
            touchWidth: 30,           // Touch hit area width (px)
            visualWidth: 14,          // Wheel visual width (px)
            height: 150,              // Wheel height (px)
            offset: 6,                // Distance from the clock face edge (px)
            enablePerspective: false,  // Whether to enable the perspective effect
            ribbonDensity: 13,        // Ribbon density (angle interval; smaller = denser)
            ribbonStrokeWidth: 1.5,     // Base ribbon stroke width (px)
            sensitivity: 0.1,         // Sensitivity (px per step); smaller = more sensitive
            wheelLerpFactor: 0.33,   // Wheel interpolation factor (0-1; higher catches up faster)
            wheelLerpThreshold: 0.5, // Interpolation close-enough threshold (degrees)
            borderOpacity: 0.7,       // Border opacity
            ribbonOpacity: 0.8,       // Ribbon opacity
            bgOpacity: 0.4,           // Background fill opacity
            gradientExponent: 3,    // Gradient exponent (>0; higher = darker edges)
            gradientLighten: 30,      // Midpoint is brighter than the base color (percent)
            gradientDarken: 20,       // Edges are darker than the base color (percent)
        },

        // ---- Center dot ----
        centerDot: {
            radius: 4,                    // Center dot radius
            color: '#000000',             // Center dot fill color
            stroke: '#8b8b8b',            // Center dot stroke color
            strokeWidth: 3,             // Center dot stroke width
        },

        // ---- Step grid dashed lines ----
        stepGrid: {
            stroke: '#4f46e5',            // Dashed line color
            opacity: 0.5,                 // Opacity while visible
            strokeWidth: 2,               // Dashed line width
            fadeDuration: 3000,           // Fade-out animation duration (ms)
        },

        // ---- Metal-style dial ----
        metalDial: {
            midLightGray: 70,      // Mid-gray lightness %
            lightGray: 94,         // Light-gray lightness %
            lightGrayRatio: 0.4,   // Light-gray ratio (0~1; smaller = sharper transition)
            borderThickness: 2,    // Ring edge border width (px)
        },

    };
})();

/**
 * trPicker — Popup mode module
 * =============================
 * Opening/closing/positioning of the popup panel and trigger updates.
 */
import trPicker from './trpicker.js';

const P = trPicker.prototype;

    /** Initialize popup mode */
    P._initPopupMode = function() {
        this._triggerEl = this.container;

        // Remove the click handler left on the trigger by a previous picker
        if (this._triggerEl._trpickerClickHandler) {
            this._triggerEl.removeEventListener('click', this._triggerEl._trpickerClickHandler);
            this._triggerEl._trpickerClickHandler = null;
        }

        // Save the original user callback (avoids being wrapped multiple times when setHourMode passes through)
        if (!this._userOnChange) {
            this._userOnChange = this.onChange;
        }
        this.onChange = (start, end) => {
            // Pass through plain data only, no DOM manipulation; display is handled by the consumer via onChange
            if (this._userOnChange) this._userOnChange(start, end);
        };

        this._triggerClickHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
        };
        this._triggerEl.addEventListener('click', this._triggerClickHandler);
        // Save the reference on the trigger so the next _initPopupMode can remove it
        this._triggerEl._trpickerClickHandler = this._triggerClickHandler;
        // Cursor styling is controlled by the consumer's CSS; the component does not intrude
    };

    /**
     * Open the popup panel.
     * @returns {void}
     */
    P.open = function() {
        if (this._popupVisible) return;
        this._popupVisible = true;

        this._overlayEl = document.createElement('div');
        this._overlayEl.className = 'trpicker-overlay';
        this._overlayEl.addEventListener('click', () => this.close());

        this._popupPanel = document.createElement('div');
        let animClass = 'trpicker-popup';
        if (this.popupAnimation === 'drop') animClass += ' trpicker-popup-drop';
        else if (this.popupAnimation === 'instant') animClass += ' trpicker-popup-instant';
        this._popupPanel.className = animClass;
        this._popupPanel.style.borderRadius = this.popupBorderRadius + 'px';
        this._popupPanel.style.animationDuration = trPicker.APPEARANCE.popup.animationDuration + 'ms';

        const clockWrap = document.createElement('div');
        clockWrap.className = 'trpicker-clock';

        document.body.appendChild(this._overlayEl);
        document.body.appendChild(this._popupPanel);

        this._buildClock();
        clockWrap.appendChild(this._svg);
        clockWrap.appendChild(this._fixedSvg);
        this._popupPanel.appendChild(clockWrap);
        this._buildFixedLayer();

        this._positionPopup();

        this._docKeyHandler = (e) => {
            if (e.key === 'Escape') this.close();
        };
        document.addEventListener('keydown', this._docKeyHandler);

        this._resizeHandler = () => {
            if (this._popupVisible) this._positionPopup();
        };
        window.addEventListener('resize', this._resizeHandler);
        window.addEventListener('scroll', this._resizeHandler, true);

        this.onChange(this.startMinute, this.endMinute);
    };

    /**
     * Close the popup panel and release its resources.
     * @returns {void}
     */
    P.close = function() {
        if (!this._popupVisible) return;
        this.destroy();
    };

    /**
     * Toggle the popup panel open/closed.
     * @returns {void}
     */
    P.toggle = function() {
        if (this._popupVisible) {
            this.close();
        } else {
            this.open();
        }
    };

    /** Position the popup panel */
    P._positionPopup = function() {
        if (!this._popupPanel || !this._triggerEl) return;

        const triggerRect = this._triggerEl.getBoundingClientRect();
        const P = trPicker.APPEARANCE.popup;
        const popupW = this._popupPanel.offsetWidth || P.defaultWidth;
        const popupH = this._popupPanel.offsetHeight || P.defaultHeight;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const margin = P.margin;

        let top, left;

        top = triggerRect.bottom + this.popupOffset;
        left = triggerRect.left;

        if (top + popupH > vh - margin) {
            top = triggerRect.top - popupH - this.popupOffset;
        }

        if (left + popupW > vw - margin) {
            left = vw - popupW - margin;
        }

        if (left < margin) left = margin;
        if (top < margin) top = margin;

        // Round to whole pixels to avoid sub-pixel offsets turning a 1px SVG stroke into 2px
        this._popupPanel.style.top = Math.round(top) + 'px';
        this._popupPanel.style.left = Math.round(left) + 'px';
    };



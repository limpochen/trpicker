/**
 * trPicker — ESM aggregate entry
 * ===============================
 * Loads the core class plus all helper modules in dependency order,
 * then re-exports the default export for `import trPicker from 'trpicker'`.
 */
import './trpicker-config.js';
import './trpicker-utils.js';
import './trpicker-svg.js';
import './trpicker-zoom.js';
import './trpicker-view.js';
import './trpicker-events.js';
import './trpicker-popup.js';
import './trpicker-fine-slider.js';
import trPicker from './trpicker.js';

export default trPicker;

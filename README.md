# trPicker — Circular Time Range Picker

**English** | [简体中文](docs/README_cn.md)

**Version: 1.0.0**

An SVG-based circular time-range picker supporting **24-hour** / **12-hour** modes. Select a time range by dragging the handles.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-2ea44f)](https://limpochen.github.io/trpicker/) [![npm version](https://img.shields.io/npm/v/trpicker)](https://www.npmjs.com/package/trpicker) [![npm downloads](https://img.shields.io/npm/dm/trpicker)](https://www.npmjs.com/package/trpicker) [![License: MIT](https://img.shields.io/npm/l/trpicker)](https://github.com/limpochen/trpicker/blob/main/LICENSE)

![Picker popup](docs/screenshots/picker.png)

---

## Quick start

### 1. Include the script

```bash
# npm
npm install trpicker
```

```html
<!-- CDN (unpkg / jsdelivr) -->
<script src="https://unpkg.com/trpicker/dist/trpicker.js"></script>
<!-- or -->
<script src="https://cdn.jsdelivr.net/npm/trpicker/dist/trpicker.js"></script>
```

> trPicker is a browser component. The single-file bundle (`dist/trpicker.js`) exposes the global `trPicker` when loaded via `<script>`. After `npm install`, you can also reference it locally with `<script src="node_modules/trpicker/dist/trpicker.js">`.

```html
<!-- 2. Container -->
<div id="picker" style="width:320px;height:320px;"></div>

<script>
const picker = new trPicker(document.getElementById('picker'), {
    hourCycle: 24,
    startMinute: 0,
    endMinute: 360,          // 06:00
    stepMinute: 10,
    onChange: (start, end) => {
        const fmt = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
        console.log(fmt(start), '-', fmt(end));
    },
});
</script>
```

### Popup mode

```html
<input type="text" id="trigger" readonly placeholder="Select a time range">

<script>
const picker = new trPicker(document.getElementById('trigger'), {
    hourCycle: 24,
    popup: true,
    onChange: (start, end) => {
        const fmt = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
        document.getElementById('trigger').value = `${fmt(start)} - ${fmt(end)}`;
    },
});
</script>
```

---

## Configuration options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `hourCycle` | `12 \| 24` | `24` | Hour cycle |
| `startMinute` | `number` | `0` | Initial start minute 0–1439 |
| `endMinute` | `number` | `360` | Initial end minute 0–1439 |
| `startHour` | `number` | — | Initial start hour (float, replaces startMinute) |
| `endHour` | `number` | — | Initial end hour (float, replaces endMinute) |
| `stepMinute` | `number` | `10` | Snap step (minutes) |
| `startColor` | `string` | `'#4f46e5'` | Start handle color |
| `endColor` | `string` | `'#ef4444'` | End handle color |
| `lineColor` | `string` | `'#28a050'` | Arc color; `'gradient'` for a gradient |
| `detailLevel` | `'simple' \| 'detailed'` | `'simple'` | Dial tick detail level |
| `dialStyle` | `'solid' \| 'metal'` | `'solid'` | Dial material style |
| `popup` | `boolean` | `false` | Use popup mode |
| `popupAnimation` | `'fade' \| 'drop' \| 'instant'` | `'fade'` | Popup animation |
| `popupBorderRadius` | `number` | `16` | Popup panel corner radius (px) |
| `enableFineSlider` | `boolean` | `true` | Show the fine slider |
| `enableModeSwitch` | `boolean` | `true` | Show the 12/24H toggle in the UI |
| `enableStepAdjust` | `boolean` | `true` | Show the step selector in the UI |
| `enableDetailAdjust` | `boolean` | `true` | Show the detail toggle in the UI |
| `enableMinStep` | `boolean` | `true` | Enforce a minimum interval >= stepMinute |
| `amText` | `string` | `'AM'` | AM label (12H) |
| `pmText` | `string` | `'PM'` | PM label (12H) |
| `onChange` | `fn(start, end)` | — | Time change callback |

---

## API

### Methods

| Method | Description |
|--------|-------------|
| `setStep(minute)` | Change the snap step |
| `setStartColor(color)` | Set the start color |
| `setEndColor(color)` | Set the end color |
| `setLineColor(color)` | Set the arc color; `'gradient'` for a gradient |
| `setDetailLevel('simple'\|'detailed')` | Switch the tick detail level |
| `setDialStyle('solid'\|'metal')` | Switch the dial style |
| `setHourCycle(12\|24)` | Switch the hour cycle |
| `getDateTimeValues(baseDate?)` | Returns `{ startDay, endDay, durationMin }` |
| `open()` | Open the popup panel |
| `close()` | Close the popup panel |
| `toggle()` | Toggle the popup panel |
| `destroy()` | Destroy the component and release resources |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `startMinute` | `number` | Current start minute 0–1439 |
| `endMinute` | `number` | Current end minute 0–1439 |
| `hourCycle` | `number` | Current cycle `12` / `24` |

---

## Styling

CSS class names are prefixed with `trpicker-`; override them to customize the appearance.

| Class | Purpose |
|-------|---------|
| `.trpicker-popup` | Popup panel container |
| `.trpicker-overlay` | Popup overlay |
| `.trpicker-fine-slider` | Fine slider |
| `.trpicker-hour` | Dial numbers (defaults built-in as SVG attributes; override if needed) |
| `.trigger-input` | Trigger input (defined by the consumer) |

The component does not touch the consumer's display styles. Format and update the UI yourself in the `onChange` callback.
| `.trpicker-fine-slider` | Fine slider container |
| `.trpicker-fine-track` | Slider track |
| `.trpicker-fine-thumb` | Slider thumb |
| `.trpicker-fine-label` | Slider time label |

---

## Browser support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires SVG, Pointer Events, and Touch Events
- IE 11 and below are not supported

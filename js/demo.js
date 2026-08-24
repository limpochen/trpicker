/* ===== Read current values from the settings panel DOM ===== */
function readParamsFromPanel() {
    currentHourMode = document.querySelector('#hourModeGroup input:checked').value;
    currentDetailLevel = document.querySelector('#detailLevelGroup input:checked').value;
    currentStep = parseInt(document.getElementById('stepSelect').value);
    currentStartColor = document.getElementById('startColor').value;
    currentEndColor = document.getElementById('endColor').value;
    currentGradient = document.getElementById('gradientChk').checked;
    currentLineColor = currentGradient ? 'gradient' : document.getElementById('lineColor').value;
    currentEnableSwitch = document.getElementById('enableSwitchChk').checked;
    currentPopupAnim = document.getElementById('popupAnimSelect').value;
    currentEnableStepAdjust = document.getElementById('enableStepAdjustChk').checked;
    currentEnableDetailAdjust = document.getElementById('enableDetailAdjustChk').checked;
    currentPopupBorderRadius = parseInt(document.getElementById('popupBorderRadius').value);
    currentDialStyle = document.getElementById('dialStyleSelect').value;
}

/* ===== Current parameter state (filled by readParamsFromPanel after init) ===== */
let currentHourMode, currentDetailLevel, currentStep,
    currentStartColor, currentEndColor, currentLineColor, currentGradient,
    currentEnableSwitch, currentPopupAnim,
    currentEnableStepAdjust, currentEnableDetailAdjust,
    currentPopupBorderRadius, currentDialStyle;

const trigger = document.getElementById('triggerInput');

// 顶部栏版本号（单一来源：读取组件 VERSION）
document.getElementById('demoVersion').textContent = 'v' + trPicker.VERSION;

/* ===== Formatting helpers ===== */
const fmt24 = (m) => {
    const hh = String(Math.floor(m / 60) % 24).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    return hh + ':' + mm;
};
const fmt12 = (m) => {
    const totalMin = Math.floor(m) % 1440;
    const hh24 = Math.floor(totalMin / 60) % 24;
    const mm = String(totalMin % 60).padStart(2, '0');
    const period = hh24 < 12 ? 'AM' : 'PM';
    const hh12 = hh24 % 12 || 12;
    return hh12 + ':' + mm + ' ' + period;
};
const fmt = (m) => currentHourMode === '12h' ? fmt12(m) : fmt24(m);

/* ===== Generate call code ===== */
function updateCallCode(sm, em) {
    const hc = currentHourMode === '12h' ? 12 : 24;
    const lcStr = currentLineColor === 'gradient' ? "'gradient'" : `'${currentLineColor}'`;
    const dv = picker ? picker.getDateTimeValues() : null;
    const ds = dv ? dv.startDay : null;
    const de = dv ? dv.endDay : null;
    const dm = dv ? dv.durationMin : '—';
    const fmtDate = (d) => {
        if (!d) return '—';
        const y = d.getFullYear();
        const M = String(d.getMonth()+1).padStart(2,'0');
        const D = String(d.getDate()).padStart(2,'0');
        const hh24 = d.getHours();
        const m = String(d.getMinutes()).padStart(2,'0');
        if (currentHourMode === '12h') {
            const period = hh24 < 12 ? 'AM' : 'PM';
            const hh12 = hh24 % 12 || 12;
            return `${y}-${M}-${D} ${hh12}:${m} ${period}`;
        }
        const h = String(hh24).padStart(2, '0');
        return `${y}-${M}-${D} ${h}:${m}`;
    };
    const as = currentEnableSwitch ? '' : '\n    enableModeSwitch: false,';
    const ast = currentEnableStepAdjust ? '' : '\n    enableStepAdjust: false,';
    const adt = currentEnableDetailAdjust ? '' : '\n    enableDetailAdjust: false,';
    const br = currentPopupBorderRadius !== 16 ? `\n    popupBorderRadius: ${currentPopupBorderRadius},` : '';
    const code =
`const picker = new trPicker(trigger, {
    hourCycle:    ${hc},
    startMinute:  ${sm},
    endMinute:    ${em},
    stepMinute:   ${currentStep},
    startColor:   '${currentStartColor}',
    endColor:     '${currentEndColor}',
    lineColor:    ${lcStr},
    detailLevel:  '${currentDetailLevel}',${as}${ast}${adt}
    dialStyle:    '${currentDialStyle}',
    popupAnimation: '${currentPopupAnim}',${br}
    popup:        true,
    onChange(startMinute, endMinute) {
        const v = picker.getDateTimeValues();
        // v.startDay     → ${fmtDate(ds)}
        // v.endDay       → ${fmtDate(de)}
        // v.durationMin  → ${dm}
    }
});`;
    document.getElementById('callCodeBlock').value = code;
}

/* ===== Generate returned data (uses getDateTimeValues for cross-midnight spans) ===== */
function updateOutputData(sm, em) {
    const dv = picker ? picker.getDateTimeValues() : null;

    const fmt2 = (d) => {
        if (!d) return '—';
        const y = d.getFullYear();
        const M = String(d.getMonth()+1).padStart(2,'0');
        const D = String(d.getDate()).padStart(2,'0');
        const hh24 = d.getHours();
        const m = String(d.getMinutes()).padStart(2,'0');
        if (currentHourMode === '12h') {
            const period = hh24 < 12 ? 'AM' : 'PM';
            const hh12 = hh24 % 12 || 12;
            return `${y}-${M}-${D} ${hh12}:${m} ${period}`;
        }
        const h = String(hh24).padStart(2, '0');
        return `${y}-${M}-${D} ${h}:${m}`;
    };

    const data =
`// getDateTimeValues() return value
{
    startDay:      ${dv ? fmt2(dv.startDay) : '—'},
    endDay:        ${dv ? fmt2(dv.endDay) : '—'},
    durationMin:   ${dv ? dv.durationMin : '—'},
}`;
    document.getElementById('outputBlock').value = data;
}

/* ===== Generate options text ===== */
function updateParamsCode(sm, em) {
    const hc = currentHourMode === '12h' ? 12 : 24;
    const lcStr = currentLineColor === 'gradient' ? '"gradient"' : `'${currentLineColor}'`;
    const code =
`{
    "hourCycle":         ${hc},              // hour cycle 12 | 24
    "startMinute":       ${sm},              // start time (minutes 0-1439)
    "endMinute":         ${em},              // end time (minutes 0-1439)
    "stepMinute":        ${currentStep},     // snap step (minutes)
    "startColor":        '${currentStartColor}',  // start handle color
    "endColor":          '${currentEndColor}',    // end handle color
    "lineColor":         ${lcStr},           // arc color; 'gradient' for gradient
    "detailLevel":       "${currentDetailLevel}", // dial tick detail level: simple | detailed
    "dialStyle":         "${currentDialStyle}",   // dial style: solid | metal
    "enableModeSwitch":   ${currentEnableSwitch},   // show 12/24H mode toggle button
    "enableStepAdjust":   ${currentEnableStepAdjust}, // show step selection pill
    "enableDetailAdjust": ${currentEnableDetailAdjust}, // show detail toggle button
    "enableFineSlider":   ${!!(picker && picker.enableFineSlider)}, // show fine slider
    "enableMinStep":      ${!!(picker && picker.enableMinStep)}, // enforce minimum interval
    "popup":             true,               // popup mode
    "popupAnimation":    "${currentPopupAnim}", // popup animation: fade | drop | instant
    "popupBorderRadius": ${currentPopupBorderRadius} // popup panel corner radius
}`;
    document.getElementById('codeBlock').value = code;
}

/* ===== Refresh all display areas ===== */
function refreshAll(sm, em) {
    updateCallCode(sm, em);
    updateOutputData(sm, em);
    updateParamsCode(sm, em);
    // Trigger display: formatted by the consumer; the component does not intervene
    const trigger = document.getElementById('triggerInput');
    if (trigger) {
        const endLabel = (sm >= em) ? 'D+' + fmt(em) : fmt(em);
        trigger.value = fmt(sm) + ' - ' + endLabel;
    }
}

/* ===== Read options from the settings panel and build the picker config ===== */
function getPickerOptions(sm, em) {
    return {
        hourCycle: currentHourMode === '12h' ? 12 : 24,
        startMinute: sm,
        endMinute: em,
        stepMinute: currentStep,
        startColor: currentStartColor,
        endColor: currentEndColor,
        lineColor: currentLineColor,
        detailLevel: currentDetailLevel,
        dialStyle: currentDialStyle,
        enableModeSwitch: currentEnableSwitch,
        enableStepAdjust: currentEnableStepAdjust,
        enableDetailAdjust: currentEnableDetailAdjust,
        popupAnimation: currentPopupAnim,
        popupBorderRadius: currentPopupBorderRadius,
        popup: true,
        onChange: (start, end) => refreshAll(start, end),
    };
}

/* ===== Create / rebuild the picker ===== */
let picker = null;

function createPicker() {
    let sm = 0, em = 360;
    if (picker) {
        sm = picker.startMinute;
        em = picker.endMinute;
        picker.destroy();
    }
    picker = new trPicker(trigger, getPickerOptions(sm, em));
    // Initial display is controlled by the consumer
    refreshAll(picker.startMinute, picker.endMinute);
}

// Read initial parameters from the panel, then create the picker
readParamsFromPanel();

// Sync radio group visuals: ensure label.active matches input:checked
document.querySelectorAll('.param-radio-group').forEach(function(group) {
    group.querySelectorAll('label').forEach(function(lbl) {
        lbl.classList.toggle('active', lbl.querySelector('input')?.checked);
    });
});

createPicker();

    // 下拉提示按钮：点击同触发输入框（打开/关闭弹层）；箭头随开合翻转
    function updateTriggerArrow() {
        document.getElementById('triggerBtn').classList.toggle('open',
            document.querySelector('.trpicker-popup') !== null);
    }
    document.getElementById('triggerBtn').addEventListener('click', function() {
        trigger.click();
    });
    // 监听弹层 DOM 增删，覆盖 trigger/按钮/遮罩/Escape 等所有开关路径
    new MutationObserver(updateTriggerArrow).observe(document.body, { childList: true });

// Hour-cycle switch
document.querySelectorAll('#hourModeGroup input').forEach(radio => {
    radio.addEventListener('change', function () {
        document.querySelectorAll('#hourModeGroup label').forEach(l => l.classList.remove('active'));
        this.parentElement.classList.add('active');
        currentHourMode = this.value;

        const sm = picker.startMinute;
        const em = picker.endMinute;
        picker.destroy();
        picker = new trPicker(trigger, getPickerOptions(sm, em));
        refreshAll(picker.startMinute, picker.endMinute);
    });
});

// Dial style switch
document.getElementById('dialStyleSelect').addEventListener('change', function () {
    currentDialStyle = this.value;
    picker.setDialStyle(currentDialStyle);
    refreshAll(picker.startMinute, picker.endMinute);
});

// Detail level switch
document.querySelectorAll('#detailLevelGroup input').forEach(radio => {
    radio.addEventListener('change', function () {
        document.querySelectorAll('#detailLevelGroup label').forEach(l => l.classList.remove('active'));
        this.parentElement.classList.add('active');
        currentDetailLevel = this.value;
        picker.setDetailLevel(currentDetailLevel);
        refreshAll(picker.startMinute, picker.endMinute);
    });
});

// Step
document.getElementById('stepSelect').addEventListener('change', function () {
    currentStep = parseInt(this.value);
    picker.setStep(currentStep);
    refreshAll(picker.startMinute, picker.endMinute);
});

// Start color
document.getElementById('startColor').addEventListener('input', function () {
    currentStartColor = this.value;
    picker.setStartColor(currentStartColor);
    if (!currentGradient) {
        currentLineColor = currentStartColor;
        picker.setLineColor(currentStartColor);
        document.getElementById('lineColor').value = currentStartColor;
    }
    refreshAll(picker.startMinute, picker.endMinute);
});

// End color
document.getElementById('endColor').addEventListener('input', function () {
    currentEndColor = this.value;
    picker.setEndColor(currentEndColor);
    refreshAll(picker.startMinute, picker.endMinute);
});

// Gradient toggle
document.getElementById('gradientChk').addEventListener('change', function () {
    currentGradient = this.checked;
    const lcRow = document.getElementById('lineColorRow');
    if (currentGradient) {
        currentLineColor = 'gradient';
        lcRow.style.opacity = '0.4';
        lcRow.style.pointerEvents = 'none';
    } else {
        currentLineColor = document.getElementById('lineColor').value;
        lcRow.style.opacity = '1';
        lcRow.style.pointerEvents = 'auto';
    }
    picker.setLineColor(currentLineColor);
    refreshAll(picker.startMinute, picker.endMinute);
});

// Allow hour-cycle switch
document.getElementById('enableSwitchChk').addEventListener('change', function () {
    currentEnableSwitch = this.checked;
    const sm = picker.startMinute;
    const em = picker.endMinute;
    picker.destroy();
    picker = new trPicker(trigger, getPickerOptions(sm, em));
    refreshAll(picker.startMinute, picker.endMinute);
});

// Popup animation switch
document.getElementById('popupAnimSelect').addEventListener('change', function () {
    currentPopupAnim = this.value;
    const sm = picker.startMinute;
    const em = picker.endMinute;
    picker.destroy();
    picker = new trPicker(trigger, getPickerOptions(sm, em));
    refreshAll(picker.startMinute, picker.endMinute);
});

// Update the line-color row styling based on the gradient checkbox state
(function syncGradientUI() {
    const checked = document.getElementById('gradientChk').checked;
    const lcRow = document.getElementById('lineColorRow');
    lcRow.style.opacity = checked ? '0.4' : '1';
    lcRow.style.pointerEvents = checked ? 'none' : 'auto';
})();

// Line color (only applies when not using gradient)
document.getElementById('lineColor').addEventListener('input', function () {
    if (!currentGradient) {
        currentLineColor = this.value;
        picker.setLineColor(currentLineColor);
        refreshAll(picker.startMinute, picker.endMinute);
    }
});

// Allow step adjustment
document.getElementById('enableStepAdjustChk').addEventListener('change', function () {
    currentEnableStepAdjust = this.checked;
    const sm = picker.startMinute;
    const em = picker.endMinute;
    picker.destroy();
    picker = new trPicker(trigger, getPickerOptions(sm, em));
    refreshAll(picker.startMinute, picker.endMinute);
});

// Popup radius
document.getElementById('popupBorderRadius').addEventListener('input', function () {
    currentPopupBorderRadius = parseInt(this.value);
    document.getElementById('popupRadiusVal').textContent = this.value + 'px';
    const sm = picker.startMinute;
    const em = picker.endMinute;
    picker.destroy();
    picker = new trPicker(trigger, getPickerOptions(sm, em));
    refreshAll(picker.startMinute, picker.endMinute);
});

// Allow detail adjustment
document.getElementById('enableDetailAdjustChk').addEventListener('change', function () {
    currentEnableDetailAdjust = this.checked;
    const sm = picker.startMinute;
    const em = picker.endMinute;
    picker.destroy();
    picker = new trPicker(trigger, getPickerOptions(sm, em));
    refreshAll(picker.startMinute, picker.endMinute);
});

// Generic utils

function isObject(variable) {
  if (typeof variable !== 'object' || variable === null)
    return false;
  if (Array.isArray(variable))
    return false;
  if (Object.getPrototypeOf(variable) !== Object.prototype)
    return false;
  return true;
}

function extendToArray(val, len, split) {
  if (!len) len = 0;
  if (!split) split = true;
  if (val && !Array.isArray(val) && split && val.split && /,/.test(val)) {
    val = val.split(',');
  }
  if (Array.isArray(val)) {
    if (val.length >= len) return val;
    if (val.length > 0) {
      while (val.length < len) {
        val.push(val[val.length - 1])
      }
      return val
    } else {
      return new Array(len).fill(undefined)
    }
  }
  return new Array(len).fill(val)
}

function getLuminance(hexColor) {
  if (!hexColor) return 1;
  if (!hexColor[0] === '#') hexColor = '#' + hexColor;
  if (hexColor.length === 4) {
    hexColor = "#" + hexColor[1] + hexColor[1] + hexColor[2] + hexColor[2] + hexColor[3] + hexColor[3];
  }
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}

function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

//Fix for sharing Tailwind styles with all component Shadow DOMs

function getTailwindSs() {
  const sss = Array.from(document.styleSheets).filter(ss => ss && ss.href && ss.href.includes('tailwind'));
  const ss = sss.length > 0 ? sss[0] : null;
  return ss;
}

function adoptTailwindSs(component) {
  const ss = new CSSStyleSheet();
  Array.from(getTailwindSs().cssRules).forEach(rule => ss.insertRule(rule.cssText))
  component.shadowRoot.adoptedStyleSheets = [ss];
}

// Util to parse component attributes

const attrsToIgnore = ['id', 'class', 'alt', 'role'];
function parseValue(val, def) {
  if (val === '') return '';
  if (!val) return undefined;
  if ('undefined' === val) return undefined;
  if ('false' === val) return false;
  if ('true' === val) return true;
  if ('null' === val) return null;

  let result = val;
  if (/^-?\d+(\.\d*)?$|^-?\.\d+?$/.test(val)) {
    result = parseFloat(val)
  } else if (['[', '{'].includes(val[0])) {
    try {
      result = JSON.parse(val)
    } catch (e) { }
  }
  if (isObject(def) && def.default) {
    def = def.default
  } else if (typeof def === 'function') {
    def = def({})
  }
  if (Array.isArray(def) && !Array.isArray(result)) {
    if (result.split) result = result.split(',');
    result = result.map((v, i) => parseValue(v, def.length > 0 ? def[Math.min(i, def.length - 1)] : undefined))
  }
  return result;
}
function parseAttributes(el, defaults) {
  const namesUsed = Array.from(el.attributes).map(a => a.name).filter(a => !attrsToIgnore.includes(a));
  const names = Array.from(new Set([...Array.from(Object.keys(defaults)), ...namesUsed]));
  const attrs = {}, setDefaults = []
  names.forEach(n => {
    const value = parseValue(el.hasAttributes(n) ? el.getAttribute(n) : undefined, defaults[n]);
    if (value === undefined && defaults[n] !== undefined) {
      if (typeof defaults[n] === 'function') {
        setDefaults.push([n, Math.infity]);
      } else if (isObject(defaults[n])) {
        if (defaults[n].default !== undefined) attrs[n] = defaults[n].default;
        else attrs[n] = defaults[n];
        if (defaults[n].fn && typeof defaults[n].fn === 'function') {
          setDefaults.push([n, defaults[n].order || defaults[n].order === 0 ? defaults[n].order : Math.infity]);
        }
      } else {
        attrs[n] = defaults[n];
      }
    } else {
      attrs[n] = value;
    }
  })
  setDefaults.sort((a, b) => a[1] - b[1]).forEach(i => {
    const n = i[0];
    if (isObject(defaults[n]) && defaults[n].fn && typeof defaults[n].fn === 'function') {
      attrs[n] = defaults[n].fn(attrs, el)
    } else if (typeof defaults[n] === 'function') {
      attrs[n] = defaults[n](attrs, el)
    }
    if (!attrs.hasOwnProperty(n)) attrs[n] = undefined;
  })
  return { ...defaults, ...attrs };
}

class Component extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.defaults = {};
    this.renderDebounced = debounce(this.render, 50);
    this.rendering = false;
    this.observer = new MutationObserver(this.handleMutations.bind(this));
  }

  render() {
    //this.shadowRoot.innerHTML = `<pre><code>Example component</code></pre>`;
  }

  renderStart() {
    this.rendering = true;
  }

  renderEnd() {
    this.rendering = false;
  }

  get attrs() {
    return parseAttributes(this, this.defaults ? this.defaults : {});
  }

  connectedCallback(event) {
    adoptTailwindSs(this);
    const slots = Array.from(this.shadowRoot.querySelectorAll('slot'));
    slots.forEach((function (slot) { slot.addEventListener('slotchange', e => this.slotChanged(e)) }).bind(this));
    this.observer.observe(this, { childList: true, subtree: true, attributes: true, characterData: true });
    this.render();
    this.classList.remove('hidden');
  }

  // Called when the element is disconnected from the DOM
  disconnectedCallback() {
    // Stop observing mutations
    this.observer.disconnect();
  }

  attributeChangedCallback(event) {
    this.renderDebounced();
  }

  slotChanged(event) {
    this.renderDebounced();
  }

  handleMutations(mutationsList, observer) {
    console.log('handleMutations',mutationsList);
    this.renderDebounced();
  }

}
class BarChart extends Component {

  observedAttributes = ["fills", "total", "prefix", "suffix", "currency", "locale", "decimals"];

  constructor() {
    this.defaults = {
      fills: ['#000230', '#2D0C8C', '#5967A5', '#879AD0', '#C0CCF0', '#000000'],
      total: undefined,
      prefix: undefined,
      suffix: undefined,
      currency: undefined,
      locale: undefined,
      decimals: undefined
    }
    this.slotDefaults = {
      icon: undefined,
      title: {
        default: ['Item'],
        fn: (attrs, el) => {
          return el.parentNode ? 'Item ' + Array.prototype.indexOf.call(el.parentNode.children, el) : this.default;
        }
      },
      bold: false,
      value: 0,
      fill: undefined,
      label: undefined,
      prefix: undefined,
      suffix: undefined,
      currency: undefined,
      locale: undefined,
      decimals: undefined,
    }
  }

  get values(){
    const slots = Array.from(this.querySelectorAll('[slot="bar"]'));
    return slots.map(slot => parseAttributes(slot,this.slotDefaults).value);
  }

  get maxValue(){
    return Math.max.apply(Math,this.values.map(v => Math.abs(v)));
  }

  get total(){
    const attrs = this.attrs;
    if(attrs.total) return attrs.total;
    return this.maxValue;
  }

  get fills(){
    const componentFills = this.attrs.fills;
    const slotFills = Array.from(this.querySelectorAll('[slot="bar"]')).map(slot => parseAttributes(slot,this.slotDefaults).fill);
    let result = [];
    for(let i=0; i<slotFills.length; i++){
      if(slotFills[i]) result.push(slotFills[i])
      else {
        let componentFillsLeft = componentFills.filter(fill => !result.includes(fill))
        if(componentFillsLeft.length) result.push(componentFillsLeft[0])
        else result.push(componentFills[componentFills.length-1])
      }
    }
    return result;
  }

  render() {

    // Get bars from innerHTML
    const attrs = this.attrs,
      slots = Array.from(this.querySelectorAll('[slot="bar"]')),
      titleTemplate = this.shadowRoot.getElementById('template-title'),
      barLineTemplate = this.shadowRoot.getElementById('template-bar-line'),
      shadow = this.shadowRoot.getElementById('bar-chart');
    
    const existingTitles = Array.from(shadow.querySelectorAll(':scope > .bar-title-container')),
      existingLines = Array.from(shadow.querySelectorAll(':scope > .bar-line-container'));
    existingTitles.forEach(el => el.remove());
    existingLines.forEach(el => el.remove());
    while(shadow.children.length){
      shadow.children[shadow.children.length-1].remove()
    }
    while(existingTitles.length>slots.length) existingTitles.pop()
    while(existingLines.length>slots.length) existingLines.pop()

    const toAppend = [];

    for (let i = 0; i < slots.length; i++) {

      // Get slot
      const slot = slots[i],
        slotAttrs = parseAttributes(slot,this.slotDefaults)
      if(!slot.hasAttribute('title') && slot.textContent.trim().length) slotAttrs.title = slot.innerHTML;
      
      // Get title
      const title = i < existingTitles.length ? existingTitles[i] : titleTemplate.content.cloneNode(true);

      // Set icon
      title.querySelector('slot[name="icon"]').querySelector('i').innerHTML = slotAttrs.icon ? slotAttrs.icon : '&nbsp;';

      // Set title text
      title.querySelector('slot[name="title"]').innerHTML = slotAttrs.title;
      if (slotAttrs.bold) title.querySelector('slot[name="title"]').parentNode.classList.add('font-bold');
      else title.querySelector('slot[name="title"]').parentNode.classList.remove('font-bold');

      // Get attrs
      const fills = this.fills, values = this.values, total = this.total;

      // Get bar line
      const barLine = i < existingLines.length ? existingLines[i] : barLineTemplate.content.cloneNode(true);

      // Set bar line
      barLine.querySelector('bar-line').setAttribute('fill', fills[i]);
      barLine.querySelector('bar-line').setAttribute('value', values[i]);
      barLine.querySelector('bar-line').setAttribute('total', total);

      ['prefix','suffix','currency','locale','decimals'].forEach(key => {
        if (slotAttrs[key] !== undefined) barLine.querySelector('bar-line').setAttribute(key, slotAttrs[key]);
        else if (attrs[key] !== undefined) barLine.querySelector('bar-line').setAttribute(key, attrs[key]);
        else barLine.querySelector('bar-line').removeAttribute(key);
      })

      if (slotAttrs.label !== undefined) barLine.querySelector('bar-line').setAttribute('label', slotAttrs.label);
      else barLine.querySelector('bar-line').removeAttribute('label');

      // Save
      toAppend.push(title, barLine)

    }

    // Append in one go
    toAppend.forEach(el => this.shadowRoot.getElementById('bar-chart').appendChild(el))

  }

}
import { cur2iso, iso2lang } from '/scripts/modules/currency.js';

class BarLine extends Component {

    observedAttributes = ["fill","total","value","label","prefix","suffix","currency","locale","decimals"];

    constructor(){
        super();
        this.defaults = {
            fill: '#000000',
            total: {
                default: 100,
                fn: (attrs) => {
                    return attrs.value ? Math.max(attrs.value,this.default) : this.default;
                },
                order: 2
            },
            value: {
                default: 0,
                fn: (attrs) => {
                    return attrs.total ? attrs.total / 2 : this.default;
                },
                order: 1
            },
            label: undefined,
            prefix: undefined,
            suffix: undefined,
            currency: undefined,
            locale: undefined,
            decimals: undefined,
        }
    }

    render(){

        // Get parsed attributes
        const attrs = this.attrs;
        
        // Set bar colour
        this.shadowRoot.querySelector('#hatch rect').setAttribute('fill', attrs.fill);
        this.shadowRoot.getElementById('bar').setAttribute('fill', attrs.value >= 0 ? attrs.fill : "url('#hatch')");
        
        // Set clip width
        if(getLuminance(attrs.fill) < (attrs.value > 0 ? 0.5 : 0.4))
            this.shadowRoot.querySelector('#clip rect').style.width = `calc(max(1.5rem, 100% * (${Math.min(Math.abs(attrs.value), Math.abs(attrs.total))} / ${Math.abs(attrs.total)})))`;
        else
            this.shadowRoot.querySelector('#clip rect').style.width = '0';

        // Set bar width
        this.shadowRoot.getElementById('bar').style.width = `calc(max(1.5rem, 100% * (${Math.min(Math.abs(attrs.value), Math.abs(attrs.total))} / ${Math.abs(attrs.total)})))`;

        // Set value label
        if(attrs.currency && !attrs.locale){
            const cur = attrs.currency.toUpperCase().trim();
            if(cur in cur2iso){
                const iso = cur2iso[cur];
                const lang = iso2lang[iso][0];
                attrs.locale = lang+'-'+iso;
            } else {
                if(!attrs.suffix) attrs.suffix = attrs.currency;
                attrs.currency = undefined;
                attrs.locale = undefined;
            }
        }
        //.replace(/£-(\d)/g,(m,g)=>'-£'+g).replace(/£\u{2013}(\d)/g,(m,g)=>'\u{2013}£'+g)+attrs.suffix
        Array.from(this.shadowRoot.querySelectorAll('text')).forEach(txt => {
            if(!attrs.label){
                const opts = attrs.decimals ? {minimumFractionDigits: attrs.decimals, maximumFractionDigits: attrs.decimals} : {minimumFractionDigits: 0, maximumFractionDigits: 0};
                if(attrs.currency){
                    opts.style = 'currency';
                    opts.currency = attrs.currency;
                }
                try { attrs.label = attrs.value.toLocaleString(attrs.locale,opts); } catch(e){
                    try { attrs.label = attrs.value.toLocaleString(undefined,opts); } catch(e){
                        try { attrs.label = attrs.value.toLocaleString(undefined, attrs.decimals || attrs.decimals === 0 ? {minimumFractionDigits: attrs.decimals, maximumFractionDigits: attrs.decimals} : {}); } catch(e){
                            attrs.label = attrs.value.toLocaleString();
                        }
                    }
                }
            }
            attrs.label = (attrs.prefix ? attrs.prefix : '')+attrs.label+(attrs.suffix ? attrs.suffix : '');
            attrs.label = attrs.label.replace(/([$€£¥₣₹د.كد.إ﷼₻₽₾₺₼₸₴₷฿원₫₮₯₱₳₵₲₪₰])-(\d)/g,(m,g1,g2)=>'-'+g1+g2).replace(/([$€£¥₣₹د.كد.إ﷼₻₽₾₺₼₸₴₷฿원₫₮₯₱₳₵₲₪₰])\u{2013}(\d)/g,(m,g1,g2)=>'\u{2013}'+g1+g2)
            if(/^\s*-.?\d+/.test(attrs.label.toString())){
                attrs.label = attrs.label.replace('-','\u{2013}')
            }
            txt.textContent = attrs.label;
        })

    }

}
const patterns = require('./patterns');

class Converter {
    static getInstance(css = '') {
        if (!Converter._instance) {
            Converter._instance = new Converter(css);
        }
        return Converter._instance;
    }

    static killInstance() {
        Converter._instance = null;
    }

    constructor(css) {
        this.css = css;
        this.xpath = ['//', '*'];
        this.xpathResult = {};
        this.index = 1;
        this.hasSibling = false;
        this.hasPrecedingSibling = false;
    }

    trimCss() {
        this.css = this.css.trim();
    }


    joinXPathParts() {
        this.xpathResult.xpath = this.xpath.join('');
    }

    parseAsterisk() { // *
        const asterisk = patterns.asterisk(this.css);
        if (asterisk) {
            this.xpath[this.index] = '*';
            this.css = this.css.substr(asterisk.fullGroup.length);
        }
    }


    parsePseudo() { // :not(), :nth-child()
        const index = this.index;
        const getPosition = (n) => require('./nthArgFunc').getPosition(n);
        const getPositionFS = (n) => require('./nthArgFunc').getPositionFS(n);
        const getPositionFsOne = (n) => require('./nthArgFunc').getPositionFsOne(n);
        const getPositionAsterisk = (n) => require('./nthArgFunc').getPositionAsterisk(n);
        const pseudo = patterns.pseudo(this.css);
        if (pseudo) {
            if (!pseudo.argument && !pseudo.brackets) this.xpathResult.error = `Unsupported pseudo ${pseudo.fullGroup}`;
            else if (!pseudo.argument && pseudo.brackets) this.xpathResult.error = `Unsupported pseudo ${pseudo.fullGroup} with undefined argument`;
            else {
                if (pseudo.type === ':not') {
                    let notArg = `[not(${parsePseudoNotArg(pseudo.argument)})]`;
                    if (this.xpath[index] === '*') this.xpath[index] = `*${notArg}`;
                    else this.xpath.push(notArg);
                }
                else if (pseudo.type.indexOf(':nth-') === 0) {
                    const nthArgument = patterns.nthArgument(pseudo.argument);
                    if (nthArgument) {

                        if (pseudo.type === ':nth-child') {
                            // If XPath does not contain /following-siblings::
                            if (!this.xpath.includes('/following-sibling::')) {
                                let position = getPosition(nthArgument);
                                if (this.xpath[index] === '*') this.xpath[index] = `*${position}`; // Fix for //*/self::[1]
                                else {
                                    if (position) this.xpath[index] = `*${position}/self::${this.xpath[index]}`; // add self:: if node name is defined
                                    // in case of :nth-child(1n) position is empty; Therefore //*/self::element can be simplified to //element
                                }
                            }
                            // If XPath contains /following-sibling:: - use 'count(preceding-siblings::*)' to define node position
                            if (this.xpath.includes('/following-sibling::')) {
                                this.xpath.push(getPositionFS(nthArgument))
                            }
                        }

                        else if (pseudo.type === ':nth-of-type') {
                            if (fsFirstExists(this.xpath)) { // following-sibling::<...>[1][position() > 1]
                                this.xpath.push(getPositionFsOne(nthArgument));
                            }
                            if (!fsFirstExists(this.xpath)) {
                                if (this.xpath[index] === '*') { // *:nth-of-type()
                                    this.xpath.push(getPositionAsterisk(nthArgument));
                                }
                                if (this.xpath[index] !== '*') { // <element>:nth-of-type()
                                    this.xpath.push(getPosition(nthArgument));
                                }
                            }
                        } else this.xpathResult.error = `Unsupported pseudo ${pseudo.fullGroup}`;
                    } else this.xpathResult.error = `Unable to parse :nth- argument '${pseudo.argument}'`;
                } else this.xpathResult.error = `Unsupported pseudo ${pseudo.fullGroup}`;
            }
            this.css = this.css.substr(pseudo.fullGroup.length);
        }
    }

    parseElement(isPseudoNotArg = false) { // #id, .class, nodeElement
        const index = this.index;
        const element = patterns.element(this.css);
        if (element) {
            if (element.specialSelectorType) this.xpath.push(`[${parseSpecialSelector(element)}]`);
            else if (element.namespace) this.xpath[index] = element.namespace; // fixme: is not used now
            else isPseudoNotArg ? this.xpath[index] = `${element.elementName}` : this.xpath[index] = element.elementName;
            if (this.hasSibling) addSiblingIndex();
            this.css = this.css.substr(element.fullGroup.length);
        }
    }


    parseAttribute() {
        const attribute = patterns.attributeValue(this.css);
        const attributePresence = patterns.attributePresence(this.css);
        let attributeXpath = '';
        if (attribute) { // [attribute=value]

            // replace single quotes in attribute value
            if (attribute.value.indexOf('\"') !== -1) {
                attribute.value = attribute.value.replace(new RegExp('\"', 'g'), '\'');
            }

            // matches this.css like [class=value]
            switch (true) {
                case (attribute.isContains):
                    attributeXpath = (`contains(@${attribute.field}, "${attribute.value}")`);
                    break;
                case (attribute.isStartsWith):
                    attributeXpath = (`starts-with(@${attribute.field}, "${attribute.value}")`);
                    break;
                case (attribute.isEndsWith):
                    attributeXpath = (`(substring(@${attribute.field}, string-length(@${attribute.field}) - string-length("${attribute.value}") + 1)) = "${attribute.value}"`);
                    break;
                case (attribute.isNotEqual):
                    attributeXpath = (`@${attribute.field}!="${attribute.value}"`);
                    break;
                default:
                    attributeXpath = (`@${attribute.field}="${attribute.value}"`);
                    break;
            }
            this.xpath.push(`[${attributeXpath}]`);
            if (this.hasSibling) addSiblingIndex();
            this.css = this.css.substr(attribute.fullGroup.length);
        }

        else { // [attribute]
            if (attributePresence) {
                this.xpath.push(`[@${attributePresence.attributeName}]`);
                if (this.hasSibling) addSiblingIndex();
                this.css = this.css.substr(attributePresence.fullGroup.length);
            }
        }
    }


    parseCombinators() { // html > body or html + body
        const combinator = patterns.combinator(this.css);
        if (combinator && combinator.fullGroup.length) {

            switch (combinator.type) {
                case '>':
                    this.xpath.push('/');
                    break;
                case '+':
                    this.xpath.push('/following-sibling::');
                    this.hasSibling = true;
                    break;
                case '~':
                    this.xpath.push('/following-sibling::');
                    break;
                default :
                    this.xpath.push('//');
                    break;
            }

            this.index = this.xpath.length; //todo return this.index or make it global Object
            this.xpath.push('*');
            if (this.hasSibling) addSiblingIndex();

            this.css = this.css.substr(combinator.fullGroup.length);
        }
    }


    parseDisjunction() {
        const disjunction = patterns.comma(this.css);
        if (disjunction) {
            this.xpath.push(' | ', '//', '*');
            this.index = this.xpath.length - 1; //todo return or make global
            this.css = this.css.substr(disjunction.fullGroup.length);
        }
    }

    parseNotCombinators() { // for pseudo :not parsing
        const index = this.index;
        const combinator = patterns.combinator(this.css);
        if (combinator && combinator.fullGroup.length) {

            switch (combinator.type) {
                case '>':
                    this.xpath[index - 1] = ('parent::');
                    this.xpath.push(' and ');
                    break;
                case '+':
                    this.xpath[index - 1] = ('preceding-sibling::');
                    this.xpath.push(' and ');
                    this.hasPrecedingSibling = true;
                    break;
                case '~':
                    this.xpath[index - 1] = ('preceding-sibling::');
                    this.xpath.push(' and ');
                    break;
                default :
                    this.xpath[index - 1] = ('ancestor::');
                    this.xpath.push(' and ');
                    break;
            }

            this.index = this.xpath.length + 1; //todo return this.index or make it global Object
            this.xpath.push('self::');
            this.xpath.push('*');

            this.css = this.css.substr(combinator.fullGroup.length);
        }
    }


}


// private functions:

function parsePseudoNotArg(css) {
    const converterNot = new Converter(css);
    const converter = Converter.getInstance();
    let countOfParents = css.match(new RegExp('>', 'g')) ? css.match(new RegExp('>', 'g')).length : 0; //todo in next versions: a>b[attr]>d ==> self::d[parent::b[@attr][parent::a]]
    if (countOfParents > 1) converter.xpathResult.error = `This version supports only single nesting level for '>' argument in :not(). You have used it ${countOfParents} times: '${css}'`; // todo: Existing logic for :not(a>b>c) will parse it as :not(a>c and b>c). Need to avoid this

    converterNot.xpath = ['self::', '*']; // get rid of '//*'
    converterNot.index = 1; // get rid of '//*'
    let previousCss = '';
    while (converterNot.css !== previousCss) { // todo test1: not(a b) test2: not(a[b]c) test3: not(a...c) test4: a+b[c]:not[d]
        converterNot.trimCss();
        if (!converterNot.css) {
            if (converterNot.hasPrecedingSibling) addPrecedingSiblingIndex();
            break;
        }
        previousCss = converterNot.css;

        converterNot.parseElement(true);
        if (converterNot.hasPrecedingSibling) addPrecedingSiblingIndex();
        converterNot.parseAttribute();
        converterNot.parseNotCombinators();
    }
    if (converterNot.xpathResult.error || converterNot.css === previousCss) { // write error to converter instance
        converter.xpathResult.error = `Unable to parse :not argument '${css}'`;
    }
    return converterNot.xpath.join('');

    function addPrecedingSiblingIndex() {
        converterNot.xpath.push('[name(preceding-sibling::*[1]) != name()]');
        converterNot.hasPrecedingSibling = false;
    }
}

function fsFirstExists(xpath) {
    let index = xpath.indexOf('/following-sibling::');
    return (index >= 0 && xpath[index + 2] === '[1]'); // Returns true if `/following-sibling::<element>[1]` exists
}

function addSiblingIndex() {
    const converter = Converter.getInstance();
    converter.xpath.push('[1]');
    converter.hasSibling = false;
}


function parseSpecialSelector(element) {
    if (element.specialSelectorType === '#') return `@id="${element.specialSelectorValue}"`;
    if (element.specialSelectorType === '.') return `contains(@class, "${element.specialSelectorValue}")`;
}

module.exports = Converter;
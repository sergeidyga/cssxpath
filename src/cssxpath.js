const patterns = require('./patterns');

function parseSpecialSelector(element, hasPseudoNot = false) {
    switch (element.specialSelectorType) {
        case '#':
            return `@id="${element.specialSelectorValue}"`;
        case '.': // class
            return `contains(@class, "${element.specialSelectorValue}")`;
    }
}

function cssXPath(rule) {
    const xpathResult = {};
    let index = 1;
    let hasPseudoNot = false;
    let hasSibling = false;
    let lastRule = null;
    const parts = ['//', '*'];

    if (rule.trim() === '') {
        xpathResult.error = 'Empty CSS selector.';
    }

    while (rule !== lastRule) {

        // Function checks that pseudo has one single argument (e.g. `:not(a b)` ==> cause error)
        function isPseudoClosed(pattern) {
            const isPseudoClosed = patterns.pseudoClosing(rule.substr(pattern.fullGroup.length));
            if (!isPseudoClosed) {
                xpathResult.error = 'Wrong pseudo selector argument.';
            }
        }

        function validateArgument(nthArgument) {

            let modnpos = {
                mod: 0,
                pos: 0
            };
            if (nthArgument.mod) {
                modnpos.mod = Number(nthArgument.mod);
            }
            if (nthArgument.number) {
                modnpos.mod = 0;
                modnpos.pos = Number(nthArgument.number);
            }
            if (nthArgument.pos) {
                if (!nthArgument.mod) modnpos.mod = 1;
                modnpos.pos = Number(nthArgument.pos);
            }
            if (nthArgument.odd) {
                modnpos.mod = 2;
                modnpos.pos = 1;
            }
            if (nthArgument.even) {
                modnpos.mod = 2;
            }
            if (nthArgument.fullGroup === 'n') { // (n)
                modnpos.mod = 1;
                modnpos.pos = 1;
            }

            return modnpos;
        }


        function calculatePosition(modnpos) {
            let xpathNthArgument;

            // Define sign:
            let sign = '=';
            if (modnpos.mod < 0) sign = '<=';
            if (modnpos.mod === 0) sign = '=';
            if (modnpos.mod > 0) sign = '>=';

            if (modnpos.mod === 1) {
                if (modnpos.pos <= 1) {
                    xpathNthArgument = ``;
                    xpathResult.warning = `XPath condition [position() ${sign} ${modnpos.pos}] was omitted`; // (n+1), (n), (n-100)
                }
                if (modnpos.pos > 1) xpathNthArgument = `[position() ${sign} ${modnpos.pos}]`; // (n+2)
            }
            if (modnpos.mod === -1) {
                if (modnpos.pos <= 0) xpathResult.error = 'This locator will always return null'; // (-1n), (-1n-1)
                if (modnpos.pos === 1) {
                    xpathNthArgument = `[1]`; // (-1n+1)
                    xpathResult.warning = `XPath condition [position() ${sign} ${modnpos.pos}] was omitted`;
                }
                if (modnpos.pos > 1) xpathNthArgument = `[position() ${sign} ${modnpos.pos}]`; // (-1n+2)
            }
            if (modnpos.mod === 0) {
                if (modnpos.pos <= 0) xpathResult.error = 'This locator will always return null'; // (0), (-1) // todo change to WARN?
                if (modnpos.pos > 0) xpathNthArgument = `[${modnpos.pos}]`; // (1)
            }
            if (modnpos.mod > 0 && Math.abs(modnpos.mod) !== 1) {
                if (modnpos.pos === 0) {
                    xpathNthArgument = `[position() mod ${modnpos.mod} = 0]`; // (2n)
                    xpathResult.warning = `XPath condition [position() ${sign} ${modnpos.pos}] was omitted`;
                }
                if (modnpos.pos === 1) {
                    xpathNthArgument = `[(position() - ${modnpos.pos}) mod ${modnpos.mod} = 0]`; // (2n+1)
                    xpathResult.warning = `XPath condition [position() ${sign} ${modnpos.pos}] was omitted`;
                }
                if (modnpos.pos > 1) xpathNthArgument = `[(position() - ${modnpos.pos}) mod ${modnpos.mod} = 0 and position() ${sign} ${modnpos.pos}]`; // (5n+2)
                if (modnpos.pos < 0) xpathNthArgument = `[(position() + ${-modnpos.pos}) mod ${modnpos.mod} = 0]`; // (5n-5)
            }
            if (modnpos.mod < 0 && Math.abs(modnpos.mod) !== 1) {
                if (modnpos.pos === 0) xpathNthArgument = `[(position() mod ${Math.abs(modnpos.mod)} = 0]`; // (-2n)
                if (modnpos.pos > 0) xpathNthArgument = `[(position() - ${modnpos.pos}) mod ${Math.abs(modnpos.mod)} = 0 and position() ${sign} ${modnpos.pos}]`; //(-2n+1)
                if (modnpos.pos <= 0) xpathResult.error = 'This locator will always return null'; // (-2n-1), (-2n) // todo change to WARN?
            }
            if (typeof xpathNthArgument === 'undefined' && typeof xpathResult.error === 'undefined') throw new SyntaxError('Unable to parse nth argument');
            return xpathNthArgument;
        }

        function calculatePositionNthOfChildWithFollowingSibling(modnpos) { // Used for following-sibling ONLY!!! in case of :nth-child
            let xpathNthArgumentFS; // for following-sibling;

            // Define sign:
            let sign = '=';
            if (modnpos.mod < 0) sign = '<=';
            if (modnpos.mod === 0) sign = '=';
            if (modnpos.mod > 0) sign = '>=';

            if (modnpos.mod === 1) {
                if (modnpos.pos <= 2) {
                    xpathNthArgumentFS = ``;
                    xpathResult.warning = `XPath condition [count(preceding-sibling::*) ${sign} ${modnpos.pos - 1}] was omitted`; // (n+2), (n), (n-100)
                }
                if (modnpos.pos > 2) xpathNthArgumentFS = `[count(preceding-sibling::*) ${sign} ${modnpos.pos - 1}]`; // (n+3)
            }
            if (modnpos.mod === -1) {
                if (modnpos.pos <= 1) xpathResult.error = 'This locator will always return null'; // (-1n), (-1n-1)
                if (modnpos.pos === 2) {
                    xpathNthArgumentFS = ``; // (-1n+2)
                    xpathResult.warning = `XPath condition [count(preceding-sibling::*) ${sign} ${modnpos.pos - 1}] was omitted`;
                }
                if (modnpos.pos > 2) xpathNthArgumentFS = `[count(preceding-sibling::*) ${sign} ${modnpos.pos - 1}]`; // (-1n+3)
            }
            if (modnpos.mod === 0) {
                if (modnpos.pos <= 1) xpathResult.error = 'This locator will always return null'; // (1), (0), (-1) // todo change to WARN?
                if (modnpos.pos > 1) xpathNthArgumentFS = `[count(preceding-sibling::*) ${sign} ${modnpos.pos - 1}]`; // (2)
            }
            if (modnpos.mod > 0 && Math.abs(modnpos.mod) !== 1) {
                if (modnpos.pos === 1) {
                    xpathNthArgumentFS = `[position() mod ${modnpos.mod} = 0]`; // (2n+1)
                    xpathResult.warning = `XPath condition [count(preceding-sibling::*) ${sign} ${modnpos.pos - 1}] was omitted`;
                }
                if (modnpos.pos === 2) {
                    xpathNthArgumentFS = `[(position() - ${modnpos.pos - 1}) mod ${modnpos.mod} = 0]`; // (2n+2)
                    xpathResult.warning = `XPath condition [count(preceding-sibling::*) ${sign} ${modnpos.pos - 1}] was omitted`;
                }
                if (modnpos.pos > 2) xpathNthArgumentFS = `[count(preceding-sibling::*) ${sign} ${modnpos.pos - 1} and (position() - ${modnpos.pos - 1}) mod ${modnpos.mod} = 0]`; // (5n+3)
                if (modnpos.pos < 1) {
                    xpathNthArgumentFS = `[(position() + ${-(modnpos.pos - 1)}) mod ${Math.abs(modnpos.mod)} = 0]`; // (2n), (2n-1)
                    xpathResult.warning = `XPath condition [count(preceding-sibling::*) ${sign} ${modnpos.pos - 1}] was omitted`;
                }
            }
            if (modnpos.mod < 0 && Math.abs(modnpos.mod) !== 1) {
                if (modnpos.pos === 1) {
                    xpathNthArgumentFS = `[position() mod ${Math.abs(modnpos.mod)} = 0]`; // (2n+1)
                    xpathResult.warning = `XPath condition [count(preceding-sibling::*) ${sign} ${modnpos.pos - 1}] was omitted`;
                }
                if (modnpos.pos === 2) {
                    xpathNthArgumentFS = `[(position() - ${modnpos.pos - 1}) mod ${Math.abs(modnpos.mod)} = 0]`; // (2n+2)
                    xpathResult.warning = `XPath condition [count(preceding-sibling::*) ${sign} ${modnpos.pos - 1}] was omitted`;
                }
                if (modnpos.pos > 2) xpathNthArgumentFS = `[count(preceding-sibling::*) ${sign} ${modnpos.pos - 1} and (position() - ${modnpos.pos - 1}) mod ${Math.abs(modnpos.mod)} = 0]`; // (5n+3)
                if (modnpos.pos < 1) xpathResult.error = 'This locator will always return null'; // (-2n-1), (-2n) // todo change to WARN?
            }
            if (typeof xpathNthArgumentFS === 'undefined' && typeof xpathResult.error === 'undefined') throw new SyntaxError('Unable to parse nth argument');
            return xpathNthArgumentFS
        }

        function getPosition(nthArgument) {
            let modnpos = validateArgument(nthArgument);
            return calculatePosition(modnpos);
        }

        function getPositionFS(nthArgument) {
            let modnpos = validateArgument(nthArgument);
            return calculatePositionNthOfChildWithFollowingSibling(modnpos);
        }


        // Trim leading whitespace
        rule = rule.trim();
        if (!rule.length) break;

        lastRule = rule;

        // Match '*'
        const asterisk = patterns.asterisk(rule);
        if (asterisk) {
            parts[index] = '*';
            rule = rule.substr(asterisk.fullGroup.length);
        }

        // Match pseudos
        const pseudo = patterns.pseudo(rule);
        if (pseudo) {

            const nthArgument = patterns.nthArgument(pseudo.argument);

            switch (pseudo.type) {
                case ':not':
                    hasPseudoNot = true;
                    index = index + 1;
                    rule = rule.substr(pseudo.firstGroup.length);
                    break;
                case ':nth-child':
                    if (!nthArgument) {
                        xpathResult.error = 'Unable to parse pseudo argument';
                    } else {
                        let tempRemovedPart = '';
                        if (parts.indexOf('/following-sibling::') === -1) { //TODO refactor
                            while (parts[parts.length - 1].indexOf(']') !== -1) { // cut attributes to past them in the end of function
                                tempRemovedPart += parts[parts.length - 1];
                                parts.splice([parts.length - 1]);
                                index = parts.length - 1;
                            }
                        }

                        if (parts.indexOf('/following-sibling::') > -1) { // change syntax of defining node position in case of following-sibling
                            parts.push(getPositionFS(nthArgument));
                        } else if (parts[index] === '*') {
                            parts[index] = `*${getPosition(nthArgument)}`;
                        } else {
                            let position = getPosition(nthArgument);
                            if (position) parts[index] = `*${position}/self::${parts[index]}`; // add self:: if node name defined
                            // in case of :nth-child(1n) position is empty
                            // and //*/self::element can be simplified to //element
                        }

                        tempRemovedPart && parts.push(tempRemovedPart);
                    }
                    rule = rule.substr(pseudo.fullGroup.length);

                    break;
                case ':nth-of-type':
                    if (!nthArgument) {
                        xpathResult.error = 'Unable to parse pseudo argument';
                    } else {
                        let tempRemovedPart2 = '';
                        if (parts.indexOf('/following-sibling::') === -1) { //TODO refactor
                            while (parts[parts.length - 1].indexOf(']') !== -1) { // cut attributes to past them in the end of function
                                tempRemovedPart2 += parts[parts.length - 1];
                                parts.splice([parts.length - 1]);
                                index = parts.length - 1;
                            }
                        } // todo wrap and store validate argument
                        // find following-siblings index:
                        let followingSiblingsIndex = parts.indexOf('/following-sibling::');
                        if (followingSiblingsIndex > -1 && parts[followingSiblingsIndex + 2] === '[1]') { // `catch case a+b:nth-of-type(n)` with n > 1 // todo fix duplication
                            if (validateArgument(nthArgument).pos > 1 && validateArgument(nthArgument).mod >= 0) {
                                xpathResult.error = 'This locator will always return null'
                            }
                        }
                        if (parts[index] === '*') { //todo check here!
                            switch (true) {
                                case (Number(pseudo.argument) === 1):
                                    parts.push(`[name(preceding-sibling::*[${Number(pseudo.argument)}]) != name()]`);
                                    break;
                                case (Number(pseudo.argument) > 1):
                                    parts.push(`[name(preceding-sibling::*[${Number(pseudo.argument)}]) != name() and name(preceding-sibling::*[${Number(pseudo.argument) - 1}]) = name()]`);
                                    break;
                                default:
                                    xpathResult.error = `Argument '${pseudo.argument}' is not supported for *:nth-of-type in this version. \nUse {element}:nth-of-type(${pseudo.argument}) or *:nth-of-type({number}) instead`; // (1n+1)-based formulas
                                    break;
                            }

                        } else if (followingSiblingsIndex > -1 && parts[followingSiblingsIndex + 2] === '[1]') { // `catch case a+b:nth-of-type(n)` with n > 1 // todo fix duplication
                            if (validateArgument(nthArgument).pos > 1 && validateArgument(nthArgument).mod >= 0) {
                                xpathResult.error = 'This locator will always return null'
                            } else if (validateArgument(nthArgument).pos === 1) {
                                // push nothing
                            } else {
                                parts.push(`${getPosition(nthArgument)}`);
                            }
                        } else parts.push(`${getPosition(nthArgument)}`);

                        tempRemovedPart2 && parts.push(tempRemovedPart2);
                    }
                    rule = rule.substr(pseudo.fullGroup.length);


                    break;
                default:
                    xpathResult.error = `Unsupported pseudo ${pseudo.type}.`;
                    break;
            }
        }


        // Handle unsupported pseudos
        const unsupportedPseudo = patterns.unsupportedPseudo(rule);
        if (unsupportedPseudo) {
            xpathResult.error = `Unsupported pseudo "${unsupportedPseudo.fullGroup}".`;
            break;
        }

        // Match element, ".class" or "#id"
        const element = patterns.element(rule);
        if (element) {

            switch (true) {

                case (!!element.specialSelectorType):
                    hasPseudoNot ? parts.push(`[not(${parseSpecialSelector(element)})`) : parts.push(`[${parseSpecialSelector(element)}]`);
                    hasPseudoNot && isPseudoClosed(element);
                    break;

                case (!!element.namespace):
                    parts[index] = element.namespace; // TODO: implement namespaces functionality
                    break;

                default:
                    if (hasPseudoNot) {
                        parts[index] = `[not(self::${element.elementName})`;
                        hasPseudoNot && isPseudoClosed(element);
                    } else parts[index] = element.elementName;

            }

            if (hasSibling) {
                parts.push('[1]');
                hasSibling = false;
            }

            rule = rule.substr(element.fullGroup.length);
        }

        // Match attribute selectors
        const attribute = patterns.attributeValue(rule);
        if (attribute) {

            // replace single quotes in attribute value
            if (attribute.value.indexOf('\"') !== -1) {
                attribute.value = attribute.value.replace(new RegExp('\"', 'g'), '\'');
            }

            let attributeXpath = '';

            // matches rules like [class=value]
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

            if (hasPseudoNot) {
                parts.push(`[not(${attributeXpath})`);
                hasPseudoNot && isPseudoClosed(attribute);
            } else parts.push(`[${attributeXpath}]`);

            rule = rule.substr(attribute.fullGroup.length);
        }

        else {
            // matches attributes like [mustExist], e.g., [disabled].
            const attributePresence = patterns.attributePresence(rule);
            if (attributePresence) {
                if (hasPseudoNot) {
                    parts.push(`[not(@${attributePresence.attributeName})`);
                    hasPseudoNot && isPseudoClosed(attributePresence);
                } else parts.push(`[@${attributePresence.attributeName}]`);
                rule = rule.substr(attributePresence.fullGroup.length);
            }
            if (hasSibling) {
                parts.push('[1]');
                hasSibling = false;
            }
        }

        const pseudoClosing = patterns.pseudoClosing(rule);
        if (hasPseudoNot && pseudoClosing) {
            parts.push(']');
            rule = rule.substr(pseudoClosing.fullGroup.length);
            hasPseudoNot = false;
        }

        // Match combinators, e.g. html > body or html + body.
        const combinator = patterns.combinator(rule);
        if (combinator && combinator.fullGroup.length) {

            switch (combinator.type) {
                case '>':
                    parts.push('/');
                    break;
                case '+':
                    parts.push('/following-sibling::');
                    hasSibling = true;
                    break;
                case '~':
                    parts.push('/following-sibling::');
                    break;
                default :
                    parts.push('//');
                    break;
            }

            index = parts.length;
            parts.push('*');

            if (hasSibling) {
                parts.push('[1]');
                hasSibling = false;
            }

            rule = rule.substr(combinator.fullGroup.length);
        }

        // Match comma delimited disjunctions ("or" rules), e.g., html, body
        const disjunction = patterns.comma(rule);
        if (disjunction) {
            parts.push(' | ', '//', '*');
            index = parts.length - 1;
            rule = rule.substr(disjunction.fullGroup.length);
        }
    }

    xpathResult.xpath = parts.join('');

// Handle parsing errors:
    if (rule.length && rule === lastRule) {
        if (!xpathResult.error) xpathResult.error = 'Unsupported CSS selector.';
    }
// if (xpathResult.xpath === '//*') {
//     if (!xpathResult.error) xpathResult.error = 'Empty CSS selector.';
// }
    if (xpathResult.error) {
        xpathResult.xpath = '';
    }

    return xpathResult
}


// Wrap result object and return only xPath string;
function cssXPathToString(rule) {
    const xpathResult = cssXPath(rule);
    xpathResult.error && console.error('ERROR!', xpathResult.error);
    if (xpathResult.warning) console.warn('WARN!', xpathResult.warning);
    return xpathResult.xpath;
    // todo in dev mod return {xpath: ''} or {error: ''} (but never null)
}

module.exports.cssXpath = cssXPath;
module.exports.cssXPathToString = cssXPathToString;
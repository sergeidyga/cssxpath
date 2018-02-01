const patterns = require('./patterns');

function specialSelectorToXPathPiece(element, hasPseudoNot = false) {
    switch (element.specialSelectorType) {
        case '#': // ID
            if (hasPseudoNot) {
                return `[not(@id="${element.specialSelectorValue}")`
            }
            else {
                return `[@id="${element.specialSelectorValue}"]`
            }
        case '.': // class
            if (hasPseudoNot) {
                return `[not(contains(@class, "${element.specialSelectorValue}"))`;
            } else {
                return `[contains(@class, "${element.specialSelectorValue}")]`;
            }
        default:
            throw new SyntaxError(
                `Invalid special selector type: ${element.specialSelectorType}.`
            );
    }
}

function cssXPath(rule) {
    const xpathResult = {};
    let index = 1;
    let hasPseudoNot = false;
    let hasSibling = false;
    let lastRule = null;
    const parts = ['//', '*'];

    while (rule !== lastRule) {

        // Function checks that pseudo has one single argument (e.g. `:not(a b)` ==> cause error)
        function isPseudoClosed(pattern) {
            const isPseudoClosed = patterns.pseudoClosing(rule.substr(pattern.fullGroup.length));
            if (!isPseudoClosed) {
                xpathResult.error = 'Wrong pseudo selector argument.';
            }
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

            //TODO add validation
            if (pseudo.argument /* matches \dn+\d syntax */) {
                // modify argument:
                // case: \d
                // case: \d n
                // case: n + \d or n \d
                // case: \d n + \d or n \d
            }

            switch (pseudo.type) {
                case ':not':
                    hasPseudoNot = true;
                    index = index + 1;
                    rule = rule.substr(pseudo.firstGroup.length);
                    break;
                case ':nth-child':
                    if (isNaN(Number(pseudo.argument))) { // todo this is temp, until implementing CSS `n` formulas support
                        xpathResult.error = 'Unable to parse pseudo argument';
                    }
                    let tempRemovedPart = '';
                    if (parts.indexOf('/following-sibling::') === -1) { //TODO refactor
                        while (parts[parts.length - 1].indexOf(']') !== -1) { // cut attributes to past them in the end of function
                            tempRemovedPart += parts[parts.length - 1];
                            parts.splice([parts.length - 1]);
                            index = parts.length - 1;
                        }
                    }

                    if (parts.indexOf('/following-sibling::') > -1) { // change syntax of defining node position in case of following-sibling
                        if (pseudo.argument > 1) {
                            parts.push(`[count(preceding-sibling::*) = ${Number(pseudo.argument) - 1}]`);
                        } else {
                            xpathResult.error = 'This locator will always return null'
                        }
                    } else if (parts[index] === '*') {
                        parts[index] = `*[${pseudo.argument}]`;
                    } else parts[index] = `*[${pseudo.argument}]/self::${parts[index]}`; // add self:: if node name defined

                    tempRemovedPart && parts.push(tempRemovedPart);
                    rule = rule.substr(pseudo.fullGroup.length);
                    break;
                case ':nth-of-type':
                    if (isNaN(Number(pseudo.argument))) { // todo this is temp, until implementing CSS `n` formulas support
                        xpathResult.error = 'Unable to parse pseudo argument';
                    }
                    let tempRemovedPart2 = '';
                    if (parts.indexOf('/following-sibling::') === -1) { //TODO refactor
                        while (parts[parts.length - 1].indexOf(']') !== -1) { // cut attributes to past them in the end of function
                            tempRemovedPart2 += parts[parts.length - 1];
                            parts.splice([parts.length - 1]);
                            index = parts.length - 1;
                        }
                    }
                    // find following-siblings index:
                    let followingSiblingsIndex = parts.indexOf('/following-sibling::');
                    if (followingSiblingsIndex > -1 && parts[followingSiblingsIndex + 2] === '[1]') { // `catch case a+b:nth-of-type(n)` with n > 1 // todo fix duplication
                        if (pseudo.argument > 1) {
                            xpathResult.error = 'This locator will always return null'
                        }
                    }
                    if (parts[index] === '*') { //todo check here!
                        switch (Number(pseudo.argument)) {
                            case 1:
                                parts.push(`[name(preceding-sibling::*[${pseudo.argument}]) != name()]`);
                                break;
                            default:
                                parts.push(`[name(preceding-sibling::*[${pseudo.argument}]) != name() and name(preceding-sibling::*[${Number(pseudo.argument) - 1}]) = name()]`);
                        }

                    } else if (followingSiblingsIndex > -1 && parts[followingSiblingsIndex + 2] === '[1]') { // `catch case a+b:nth-of-type(n)` with n > 1 // todo fix duplication
                        if (pseudo.argument > 1) {
                            xpathResult.error = 'This locator will always return null'
                        } else if (Number(pseudo.argument) === 1) {
                            // push nothing
                        }
                    } else parts.push(`[${pseudo.argument}]`);

                    tempRemovedPart2 && parts.push(tempRemovedPart2);
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
                    parts.push(specialSelectorToXPathPiece(element, hasPseudoNot));
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
    if (xpathResult.xpath === '//*') {
        if (!xpathResult.error) xpathResult.error = 'Empty CSS selector.';
    }
    if (xpathResult.error) {
        xpathResult.xpath = '';
    }

    return xpathResult
}

// Wrap result object and return only xPath string;
function cssXPathToString(rule) {
    const xpathResult = cssXPath(rule);
    if (xpathResult.error) {
        console.error(xpathResult.error)
    }
    return xpathResult.xpath;
}

module.exports.cssXpath = cssXPath;
module.exports.cssXPathToString = cssXPathToString;
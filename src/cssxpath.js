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
            switch (pseudo.type) {
                case ':not':
                    hasPseudoNot = true;
                    index = index + 1;
                    rule = rule.substr(pseudo.fullGroup.length);
                    break;
                default:
                    xpathResult.error = `Unsupported pseudo ${pseudo.type} \tOnly ":not(selector)" is supported in current version.`;
                    break;
            }
        }

        // Handle unsupported pseudos
        const unsupportedPseudo = patterns.unsupportedPseudo(rule);
        if (unsupportedPseudo) {
            xpathResult.error = `Unsupported pseudo "${unsupportedPseudo.fullGroup}". \tOnly ":not(selector)" is supported in current version.`;
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

            rule = rule.substr(element.fullGroup.length);

            if (hasSibling) {
                parts.push('[1]');
                hasSibling = false;
            }
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
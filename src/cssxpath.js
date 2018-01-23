const patterns = require('./patterns');

function specialSelectorToXPathPiece(element) {
    switch (element.specialSelectorType) {
        case '#': // ID
            return `[@id="${element.specialSelectorValue}"]`;
        case '.': // class
            return `[contains(@class, "${element.specialSelectorValue}")]`;
        default:
            throw new SyntaxError(
                `Invalid special selector type: ${element.specialSelectorType}.`
            );
    }
}

function cssXPath(rule) {
    let index = 1;
    let hasSibling = false;
    const parts = ['//', '*'];
    let lastRule = null;

    while (rule !== lastRule) {

        // Trim leading whitespace
        rule = rule.trim();
        if (!rule.length) break;

        lastRule = rule;

        const asterisk = patterns.asterisk(rule);
        if (asterisk) {
            parts[index] = '*';
            rule = rule.substr(asterisk.fullGroup.length);
        }

        // Match the element identifier, matches rules of the form "body", ".class" and "#id"
        const element = patterns.element(rule);
        if (element) {
            if (element.specialSelectorType) {
                parts.push(specialSelectorToXPathPiece(element));
            } else if (element.namespace) {
                // TODO: implement namespaces functionality
                parts[index] = element.namespace;
            } else {
                parts[index] = element.elementName;
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

            // matched a rule like [field~='thing'] or [name='Title']
            switch (true) {
                case (attribute.isContains):
                    parts.push(`[contains(@${attribute.field}, "${attribute.value}")]`);
                    break;
                case (attribute.isStartsWith):
                    parts.push(`[starts-with(@${attribute.field}, "${attribute.value}")]`);
                    break;
                case (attribute.isEndsWith):
                    parts.push(`[(substring(@${attribute.field}, string-length(@${attribute.field}) - string-length("${attribute.value}") + 1)) = "${attribute.value}"]`);
                    break;
                case (attribute.isNotEqual):
                    parts.push(`[@${attribute.field}!="${attribute.value}"]`);
                    break;
                default:
                    parts.push(`[@${attribute.field}="${attribute.value}"]`);
                    break;
            }

            rule = rule.substr(attribute.fullGroup.length);
        }
        else {
            // matches rules like [mustExist], e.g., [disabled].
            const attributePresence = patterns.attributePresence(rule);
            if (attributePresence) {
                parts.push(`[@${attributePresence.attributeName}]`);

                rule = rule.substr(attributePresence.fullGroup.length);
            }
        }

        // Skip over pseudo-classes and pseudo-elements, which are of no use to us
        // e.g., :nth-child and :visited.
        let pseudoGroups = patterns.pseudo(rule);
        while (pseudoGroups) {
            rule = rule.substr(pseudoGroups.fullGroup.length);

            // if there are many, just skip them all right now.
            pseudoGroups = patterns.pseudo(rule);
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

    const xPath = parts.join('');

    // Log error if any part of string was not parsed or string is empty
    if ((xPath === '//*') || (rule.length && rule === lastRule)) {
        console.log('Unsupported CSS selector');
        return;
        // TODO: need to handle wrong CSS selectors in better way
    }

    return xPath;
}

module.exports = cssXPath;
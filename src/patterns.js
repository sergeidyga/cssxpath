/**
 * This file's primary purpose is to turn a bunch of hard-to-read regular expressions
 * in to self-documenting functions with appropriate named capture groups and minimal
 * meaning parsing.
 */

function asterisk(string) {
    const CSS_ASTERISK_PATTERN = /^\*(?![a-z0-9_\-*\\.#])/i;
    const matches = CSS_ASTERISK_PATTERN.exec(string);
    if (!matches) return matches;

    return {
        fullGroup: matches[0]
    }
}


/**
 * `element(string)` matches the pieces of an initial CSS selector and returns a parsed set of fields.
 * e.g., #id, .class or body
 *
 * It also parses out the piped namespace piece: https://www.w3.org/TR/css3-selectors/#univnmsp
 */
function element(string) {
    const CSS_ELEMENT_PATTERN = /^([#.]?)((_{1,2}|-{1,2})?[a-z]+[a-z0-9\\*_-]*)((\|)([a-z0-9\\*_-]*))?/i;
    const matches = CSS_ELEMENT_PATTERN.exec(string);
    if (!matches) return matches;

    const retVal = {
        fullGroup: matches[0],
        fullNamespaceGroup: matches[4],
        namespace: matches[6], // TODO: this is backwards, handle namespace standardization here.
    };

    // either "#" or "." to indicate id or class selector
    if (matches[1] === '#' || matches[1] === '.') {
        retVal.specialSelectorType = matches[1];
        retVal.specialSelectorValue = matches[2];
    } else if (matches[1] === '') {
        retVal.elementName = matches[2];
    }

    return retVal;
}

/**
 * `attributePresence(string)` matches the pieces of a CSS selector that represent a attribute presence requirement.
 *  e.g., [disabled], [x-anything-here]
 */
function attributePresence(string) {
    const CSS_ATTRIBUTE_PRESENCE_PATTERN = /^\[\s*([^=\]\s]+)\s*\]/i;
    const matches = CSS_ATTRIBUTE_PRESENCE_PATTERN.exec(string);
    if (!matches) return matches;

    return {
        fullGroup: matches[0],
        attributeName: matches[1],
    };
}

/**
 * `attributeValue(string)` matches the pieces of a CSS selector that represent a attribute selector.
 *  e.g., [disabled='disabled'], [class~='alphaghettis'], [type != 'number']
 */
function attributeValue(string) {
    const CSS_ATTRIBUTE_VALUE_PATTERNS = {
        UNQUOTED_VALUE_PATTERN: /^\[\s*([^^$!*<>'"`|~=\s]+)\s*([$^!*|~]?=)\s*([^"'=\s<>`]+)\s*\]/i,
        SINGLE_QUOTED_VALUE_PATTERN: /^\[\s*([^^$!*<>'"`|~=\s]+)\s*([$^!*|~]?=)\s*'([^']+)'\s*\]/i,
        DOUBLE_QUOTED_VALUE_PATTERN: /^\[\s*([^^$!*<>'"`|~=\s]+)\s*([$^!*|~]?=)\s*"([^"]+)"\s*\]/i
    };

    function findMatches(string, obj) {
        for (let key of Object.keys(obj)) {
            let matches = obj[key].exec(string);
            if (matches)
                return {
                    pattern: key, // Currently is not in use
                    matches: matches
                }
        }
    }

    if (typeof(findMatches(string, CSS_ATTRIBUTE_VALUE_PATTERNS)) === "undefined") return false;

    const matches = findMatches(string, CSS_ATTRIBUTE_VALUE_PATTERNS).matches;
    const pattern = findMatches(string, CSS_ATTRIBUTE_VALUE_PATTERNS).pattern;


    return {
        fullGroup: matches[0],
        field: matches[1],
        value: matches[3],
        isContains: (matches[2] === '~=' || matches[2] === '*='),
        isStartsWith: (matches[2] === '|=' || matches[2] === '^='),
        isEndsWith: (matches[2] === '$='),
        isNotEqual: matches[2] === '!=' // It is from jQuery but still kept as useful
    };
}

/**
 * `pseudo(string)` matches the pieces of a CSS selector that represent a pseudo selector.
 *  TODO: supports only with number params (parentheses) i.e. :nth-child(1)
 *  TODO: need other types params for example $text or [attribute='adsfsfa']
 */
function pseudo(string) {
    const CSS_PSEUDO_PATTERN = /^:([a-z-]+)\(([0-9]+)\)/i;
    const matches = CSS_PSEUDO_PATTERN.exec(string);
    if (!matches) return matches;

    return {
        fullGroup: matches[0],
        selector: matches[1],
        value: matches[2]
    };
}

/**
 * `combinator(string)` matches the pieces of a CSS selector that represent a combinator.
 *  e.g., +, ~ or >
 */
function combinator(string) {
    const CSS_COMBINATOR_PATTERN = /(^[\s*]*(([>+~\s]){1}?\s*))[\[*a-z0-9#._-]+/i;
    const matches = CSS_COMBINATOR_PATTERN.exec(string);
    if (!matches) return matches;

    return {
        fullGroup: matches[1],
        type: matches[3]
    };
}

/**
 * `comma(string)` matches commas in a CSS selector; used for disjunction.
 */
function comma(string) {
    const COMMA_PATTERN = /(^\s*(([,]){1}?\s*))[\[*a-z0-9#._-]+/i;
    const matches = COMMA_PATTERN.exec(string);
    if (!matches) return matches;

    return {
        fullGroup: matches[1],
        type: matches[3]
    };
}


module.exports = {
    asterisk,
    element,
    attributePresence,
    attributeValue,
    pseudo,
    combinator,
    comma,
};

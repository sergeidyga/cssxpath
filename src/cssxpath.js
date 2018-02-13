const Converter = require("./converter");
const clc = require('cli-color');

/**
 * @param {string} css - CSS input;
 * @returns {string | {xpath, warning, error}} - object with xPath and logs;
 */
function convertCssToXpath(css) {

    const converter = Converter.getInstance(css);
    let previousCss = '';
    if (!css.trim()) converter.xpathResult.error = 'Empty CSS selector.';
    while (converter.css !== previousCss) {
        converter.trimCss();
        if (!converter.css) break;
        previousCss = converter.css;

        converter.parseAsterisk();
        converter.parsePseudo();
        converter.parseElement();
        converter.parseAttribute();
        converter.parseCombinators();
        converter.parseDisjunction();
    }

    converter.joinXPathParts();
    handleErrors(converter.css, previousCss);
    Converter.killInstance();
    return converter.xpathResult;

}

function handleErrors(css, previousCss) {
    const converter = Converter.getInstance();
    if (css === previousCss && !converter.xpathResult.error) converter.xpathResult.error = 'Invalid CSS selector.'; // True if css has something left not parsed
    if (converter.xpathResult.error) converter.xpathResult.xpath = '';
}

/**
 * @param {string} css - The CSS string, tha will be parsed to xPath
 * @param {boolean} [returnObject=false] - Type of returned object. If `true`: object containing {xpath, error, warning} is returned. If false (default): single xPath string is returned.
 * Note: if returnObject = true - no errors or warnings will be printed in console.
 * @returns {string | {xpath, warning, error}} - xpath output;
 */
function publicConvertCssToXpath(css, returnObject = false) {
    const xpathResult = convertCssToXpath(css);
    if (returnObject === false) {
        if (xpathResult.error) console.error(clc.red('ERROR!'), xpathResult.error);
        if (xpathResult.warning) console.warn(clc.yellow('WARN!', xpathResult.warning));
        return xpathResult.xpath;
    }
    else if (returnObject === true) {
        return {
            xpath: xpathResult.xpath,
            warning: xpathResult.warning,
            error: xpathResult.error
        };
    }
    else throw new SyntaxError(`expected returnObject argument type is boolean`);
}

module.exports.cssXPathToString = publicConvertCssToXpath;
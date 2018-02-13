/**
 * @description Calls console interface, that asks to enter CSS to be converted to xPath.
 * @returns {*} Returns nothing. All errors/warning logs and xPath output are printed directly in the console.
 * @example
 * .ask();
 */
module.exports.ask = function() { return require('./src/prompt') };

/**
 * @param {string} css - The CSS string, tha will be parsed to xPath
 * @param {boolean} [returnObject=false] - Type of returned object. If `true`: object containing {xpath, error, warning} is returned. If false (default): single xPath string is returned.
 * Note: if returnObject = true - no errors or warnings will be printed in console.
 * @returns {string | {xpath, warning, error}} xPath output with warning and error logs.
 * @example
 * .convert('a.myClass b');
 **/
module.exports.convert = function(css, returnObject) { return require('./src/cssxpath.js').cssXPathToString(css, returnObject) };
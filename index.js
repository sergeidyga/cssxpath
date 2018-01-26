module.exports.ask = function() { return require('./src/prompt') };
// module.exports.forTestsObject = function(rule) { return require('./src/cssxpath').cssXpath(rule) };
module.exports.convert = function(rule) { return require('./src/cssxpath.js').cssXPathToString(rule) };
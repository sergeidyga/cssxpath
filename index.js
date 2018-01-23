module.exports.ask = function() { return require('./src/prompt') };
module.exports.convert = function(rule) { return require('./src/cssxpath')(rule) };
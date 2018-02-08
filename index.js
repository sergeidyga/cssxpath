module.exports.ask = function() { return require('./src/prompt') };
// module.exports.forTestsObject = function(rule) { return require('./src/cssxpath').cssXpath(rule) };
module.exports.convert = function(rule) { return require('./src/cssxpath.js').cssXPathToString(rule) };

// const {Command} = require('commander');
// const {handleErrors, handleUncaughtExceptions} = handleUncaughtExceptions;
//
// exports.run = () => {
//     const program = new Command();
//
//     program.command('update [paths...]')
//         .allowUnknownOption()
//         .option('--diff', 'update only screenshots with diff')
//         .option('--new', 'save only new screenshots')
//         .description('update the changed screenshots or gather if they doesn\'t exist')
//         .action((paths, options) => mkRunFn('update', program)(paths, options).done());
// };
//
// function mkRunFn(method, globalOpts) {
//     return (paths, opts = {}) => {
//         handleUncaughtExceptions();
//
//         return gemini[method](paths, {
//             sets: opts.set,
//             reporters: parseReporterOptions(opts),
//             grep: globalOpts.grep,
//             browsers: globalOpts.browser,
//             diff: opts.diff,
//             new: opts.new
//         })
//             .then((stats) => stats.failed > 0 ? 2 : 0)
//             .catch(handleErrors)
//             .then(exit);
//     };
// }
//
// function handleUncaughtExceptions() {
//     process.on('uncaughtException', function(error) {
//         process.exit(handleErrors(error));
//     });
// }
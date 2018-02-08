const readline = require("readline");
const cssxpath = require('../index');


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let promptCall = () => {
    rl.question('CSS> ', css => {
        if (css === typeof("undefined")) {
            rl.close();
        } else {
            let result = cssxpath.convert(css);
            result && console.log('xPath:', result);
            promptCall();
        }
    })
};

module.exports = promptCall();
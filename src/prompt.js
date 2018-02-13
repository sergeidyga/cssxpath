const readline = require("readline");
const clc = require('cli-color');
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
            result && console.log(clc.green('>>'), result);
            promptCall();
        }
    })
};

module.exports = promptCall();
const readline = require("readline");
const csstoxpath = require('./cssxpath');


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let promptCall = () => {
    rl.question('CSS> ', css => {
        if (css === typeof("undefined")) {
            rl.close();
        } else {
            if (csstoxpath(css)) console.log('xPath:', csstoxpath(css));
            promptCall();
        }
    })
};

module.exports = promptCall();
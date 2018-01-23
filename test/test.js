const assert = require('assert');
const cssxpath = require('../index');

let testPairs = [

    // Elements and special selectors
    ['div', '//div'],
    ['#value', '//*[@id="value"]'],
    ['.value', '//*[contains(@class, "value")]'],

    // Special symbols for namespaces support
    ['._value', '//*[contains(@class, "_value")]'],
    ['.__value', '//*[contains(@class, "__value")]'],
    ['.-value', '//*[contains(@class, "-value")]'],
    ['.--value', '//*[contains(@class, "--value")]'],

    // Attributes:
    ['[attrName]', '//*[@attrName]'],
    ['[attrName=value]', '//*[@attrName="value"]'],
    ['[attrName=\'value\']', '//*[@attrName="value"]'],
    ['[attrName="value"]', '//*[@attrName="value"]'],
    ['.className[attrName="value"]', '//*[contains(@class, "className")][@attrName="value"]'],
    ['[class=className][attr=attrValue]', '//*[@class="className"][@attr="attrValue"]'],

    // Attribute sign types
    ['[attrName~=value]', '//*[contains(@attrName, "value")]'],
    ['[attrName*=\'value\']', '//*[contains(@attrName, "value")]'],
    ['[attrName|=value]', '//*[starts-with(@attrName, "value")]'],
    ['[attrName^="value"]', '//*[starts-with(@attrName, "value")]'],
    ['[attrName$="value"]', '//*[(substring(@attrName, string-length(@attrName) - string-length("value") + 1)) = "value"]'],
    ['[attrName!=value]', '//*[@attrName!="value"]'], // Missing in CSS3. Kept from jQuery

    // Attribute quotes replacement
    ['[attrName="va\'l\'ue va\'l\'ue"]', '//*[@attrName="va\'l\'ue va\'l\'ue"]'],
    ['[attrName=\'va"l"ue va"l"ue\']', '//*[@attrName="va\'l\'ue va\'l\'ue"]'],

    // Combinator types:
    ['a b c', '//a//b//c'],
    ['a + b', '//a/following-sibling::b[1]'],
    ['a ~ b', '//a/following-sibling::b'],
    ['a > b', '//a/b'],
    ['* > b', '//*/b'],

    ['a >b', '//a/b'],
    ['a>b', '//a/b'],
    ['a> b', '//a/b'],
    ['a> .b + #c', '//a/*[contains(@class, "b")]/following-sibling::*[@id="c"][1]'],

    // Comma
    ['a, b', '//a | //b'],
    ['a , b', '//a | //b'],
    ['a ,b', '//a | //b'],
    ['[attrName], [attrName]', '//*[@attrName] | //*[@attrName]'],
    ['.value, .value', '//*[contains(@class, "value")] | //*[contains(@class, "value")]'],
    ['#value, #value', '//*[@id="value"] | //*[@id="value"]'],

    // Asterisk
    ['a > *', '//a/*'],
    ['a > * > b', '//a/*/b'],
    ['a > *> b', '//a/*/b'],
    ['a > * *', '//a/*//*'],

];

describe('Unit tests', function () {
    for(let i = 0; i < testPairs.length; i++) {
        it(`${testPairs[i][0]} is expected as ${testPairs[i][1]}`, function () {
            assert.equal(cssxpath.convert(testPairs[i][0]), testPairs[i][1]);
        });
    }
});


const assert = require('assert');
const cssxpath = require('../index');
const cssxpathObject = require('../src/cssxpath').cssXpath;

let testPairs = [

    // Elements and special selectors
    ['* *', '//*//*'],
    ['div', '//div'],
    ['a123', '//a123'],
    ['--div', '//--div'],
    ['__div', '//__div'],
    ['#value', '//*[@id="value"]'],
    // ['.1', ...], // TODO this must work. But since lookbehind is not supported need to divide element pattern
    ['.value', '//*[contains(@class, "value")]'],

    // Special symbols for namespaces support
    ['._value', '//*[contains(@class, "_value")]'],
    ['.__value', '//*[contains(@class, "__value")]'],
    ['.-value', '//*[contains(@class, "-value")]'],
    ['.--value', '//*[contains(@class, "--value")]'],

    // Attributes:
    ['[attrName]', '//*[@attrName]'],
    ['[ attrName ]', '//*[@attrName]'],
    ['[attrName=value]', '//*[@attrName="value"]'],
    ['[attrName=\'value\']', '//*[@attrName="value"]'],
    ['[attrName="value"]', '//*[@attrName="value"]'],
    ['[ attrName = "value" ]', '//*[@attrName="value"]'],
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

    // Pseudo :not(selector)
    [':not(a)', '//*[not(self::a)]'],
    [':not( a )', '//*[not(self::a)]'],
    [':not(#idValue)', '//*[not(@id="idValue")]'],
    [':not( #idValue )', '//*[not(@id="idValue")]'],
    [':not(.className)', '//*[not(contains(@class, "className"))]'],
    [':not( .className )', '//*[not(contains(@class, "className"))]'],
    [':not([attr])', '//*[not(@attr)]'],
    [':not( [attr] )', '//*[not(@attr)]'],
    [':not( [ attr ] )', '//*[not(@attr)]'],
    [':not([attr="value"])', '//*[not(@attr="value")]'],
    [':not([ attr = "value" ])', '//*[not(@attr="value")]'],
    ['a:not([attr])', '//a[not(@attr)]'],
    ['a b:not([attr])', '//a//b[not(@attr)]'],
    ['.className a:not([attr])', '//*[contains(@class, "className")]//a[not(@attr)]'],
    ['.className :not([attr])', '//*[contains(@class, "className")]//*[not(@attr)]'],
    ['.className :not([attr]):not(#idValue)', '//*[contains(@class, "className")]//*[not(@attr)][not(@id="idValue")]']

];

describe('Unit tests', function () {
    for(let i = 0; i < testPairs.length; i++) {
        it(`${testPairs[i][0]} is expected as ${testPairs[i][1]}`, function () {
            assert.equal(cssxpath.convert(testPairs[i][0]), testPairs[i][1]);
        });
    }
});


let negativeTestPairs = [

    ['', 'Empty CSS selector.'],
    [' ', 'Empty CSS selector.'],
    ['*', 'Empty CSS selector.'],

    ['123', 'Unsupported CSS selector.'],
    ['a 123', 'Unsupported CSS selector.'],
    ['a[*]', 'Unsupported CSS selector.'],
    ['a b )', 'Unsupported CSS selector.'],
    ['---a', 'Unsupported CSS selector.'],
    ['___a', 'Unsupported CSS selector.'],
    ['___a', 'Unsupported CSS selector.'],
    ['[]', 'Unsupported CSS selector.'],
    ['a[]', 'Unsupported CSS selector.'],
    ['a[123]', 'Unsupported CSS selector.'],
    ['[a=b=c]', 'Unsupported CSS selector.'],
    ['[.a]', 'Unsupported CSS selector.'],
    ['[#a]', 'Unsupported CSS selector.'],
    ['[:not(a)]', 'Unsupported CSS selector.'],
    ['[a:not(b)]', 'Unsupported CSS selector.'],
    ['[a==b]', 'Unsupported CSS selector.'],
    ['.', 'Unsupported CSS selector.'],
    ['.:not(a)', 'Unsupported CSS selector.'],
    ['#', 'Unsupported CSS selector.'],
    ['[a="b"d"]', 'Unsupported CSS selector.'],
    ['[a=\'b\'d\']', 'Unsupported CSS selector.'],
    ['[a=b"d]', 'Unsupported CSS selector.'],
    ['a>>b', 'Unsupported CSS selector.'],
    ['a>', 'Unsupported CSS selector.'],
    ['a,,b', 'Unsupported CSS selector.'],
    ['a,', 'Unsupported CSS selector.'],
    ['a,', 'Unsupported CSS selector.'],
    ['a++', 'Unsupported CSS selector.'],
    ['a+', 'Unsupported CSS selector.'],
    ['a + +', 'Unsupported CSS selector.'],
    ['a[b=c', 'Unsupported CSS selector.'],
    ['**', 'Unsupported CSS selector.'],

    [':not(a b)', 'Wrong pseudo selector argument.'],
    [':not(a[b])', 'Wrong pseudo selector argument.'],
    [':not(a[b=2])', 'Wrong pseudo selector argument.'],
    [':not(a.b)', 'Wrong pseudo selector argument.'],
    [':not(a#b)', 'Wrong pseudo selector argument.'],
    [':not(.a[b])', 'Wrong pseudo selector argument.'],
    [':not(#a[b])', 'Wrong pseudo selector argument.'],
    [':not([a=b][b=c])', 'Wrong pseudo selector argument.'],

    [':not()', 'Unsupported pseudo'],
    [':not', 'Unsupported pseudo'],
    ['::checked', 'Unsupported pseudo'],
    [':checked', 'Unsupported pseudo'],
    [':nth-child(1)', 'Unsupported pseudo']

];


describe('Negative unit tests', function () {
    for(let i = 0; i < negativeTestPairs.length; i++) {
        it(`"${negativeTestPairs[i][0]}" is expected to cause log: "${negativeTestPairs[i][1]}"`, function () {
            assert((cssxpathObject(negativeTestPairs[i][0]).error).startsWith(negativeTestPairs[i][1]), `Actual: ${cssxpathObject(negativeTestPairs[i][0]).error}`);
        });
    }
});
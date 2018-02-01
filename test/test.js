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
    ['a+c[b]', '//a/following-sibling::c[1][@b]'],
    ['a+[b]', '//a/following-sibling::*[1][@b]'],
    ['a+[b=1]', '//a/following-sibling::*[1][@b="1"]'],
    ['a~[b]', '//a/following-sibling::*[@b]'],

    ['a >b', '//a/b'],
    ['a>b', '//a/b'],
    ['a> b', '//a/b'],
    ['a> .b + #c', '//a/*[contains(@class, "b")]/following-sibling::*[1][@id="c"]'],

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
    ['.className :not([attr]):not(#idValue)', '//*[contains(@class, "className")]//*[not(@attr)][not(@id="idValue")]'],

    // Pseudo :nth-child(n)
    [':nth-child(1)', '//*[1]'],
    [':nth-child(199)', '//*[199]'],
    ['*:nth-child(199)', '//*[199]'],
    ['a :nth-child( 2 )', '//a//*[2]'],
    ['#idValue:nth-child(2)', '//*[2][@id="idValue"]'],
    ['.className:nth-child(2)', '//*[2][contains(@class, "className")]'],
    ['#idValue.className:nth-child(2)', '//*[2][contains(@class, "className")][@id="idValue"]'],
    ['a:nth-child(2)', '//*[2]/self::a'],
    ['a b:nth-child(2)', '//a//*[2]/self::b'],
    ['a b#idValue.className:nth-child(2)', '//a//*[2]/self::b[contains(@class, "className")][@id="idValue"]'],
    ['a[b=1][c="2"]:nth-child(1)', '//*[1]/self::a[@c="2"][@b="1"]'],
    [':nth-child(1) :nth-child(2)', '//*[1]//*[2]'],
    ['a:nth-child(1) b:nth-child(2)', '//*[1]/self::a//*[2]/self::b'],
    ['a+b:nth-child(2)', '//a/following-sibling::b[1][count(preceding-sibling::*) = 1]'],
    ['a + b:nth-child(102)', '//a/following-sibling::b[1][count(preceding-sibling::*) = 101]'],
    ['a+*:nth-child(2)', '//a/following-sibling::*[1][count(preceding-sibling::*) = 1]'],
    ['a + *:nth-child(52)', '//a/following-sibling::*[1][count(preceding-sibling::*) = 51]'],
    ['a~b:nth-child(2)', '//a/following-sibling::b[count(preceding-sibling::*) = 1]'],
    ['a ~ b:nth-child(52)', '//a/following-sibling::b[count(preceding-sibling::*) = 51]'],

    // Pseudo :nth-of-type(n)
    ['*:nth-of-type(1)', '//*[name(preceding-sibling::*[1]) != name()]'],
    ['a *:nth-of-type(1)', '//a//*[name(preceding-sibling::*[1]) != name()]'],
    [':nth-of-type(1)', '//*[name(preceding-sibling::*[1]) != name()]'],
    [':nth-of-type(2)', '//*[name(preceding-sibling::*[2]) != name() and name(preceding-sibling::*[1]) = name()]'],
    [':nth-of-type(150)', '//*[name(preceding-sibling::*[150]) != name() and name(preceding-sibling::*[149]) = name()]'],
    ['a b:nth-of-type( 2 )', '//a//b[2]'],
    ['#idValue:nth-of-type(2)', '//*[name(preceding-sibling::*[2]) != name() and name(preceding-sibling::*[1]) = name()][@id="idValue"]'],
    ['.className:nth-of-type(2)', '//*[name(preceding-sibling::*[2]) != name() and name(preceding-sibling::*[1]) = name()][contains(@class, "className")]'],
    ['a#idValue.className:nth-of-type(2)', '//a[2][contains(@class, "className")][@id="idValue"]'],
    ['a[b=1][c="2"]:nth-of-type(1)', '//a[1][@c="2"][@b="1"]'],
    ['a:nth-of-type(1) b:nth-of-type(2)', '//a[1]//b[2]'],
    [':nth-of-type(1) b:nth-of-type(2)', '//*[name(preceding-sibling::*[1]) != name()]//b[2]'],
    ['a+b:nth-of-type(1)', '//a/following-sibling::b[1]'],
    ['a + b:nth-of-type(1)', '//a/following-sibling::b[1]'],
    ['a + *:nth-of-type(1)', '//a/following-sibling::*[1][name(preceding-sibling::*[1]) != name()]'],
    ['a~b:nth-of-type(2)', '//a/following-sibling::b[2]'],
    ['a ~ *:nth-of-type(1)', '//a/following-sibling::*[name(preceding-sibling::*[1]) != name()]']

];

describe('Unit tests', function () {
    for (let i = 0; i < testPairs.length; i++) {
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
    [':nth-child()', 'Unsupported pseudo'],
    [':not', 'Unsupported pseudo'],
    ['::checked', 'Unsupported pseudo'],
    [':checked', 'Unsupported pseudo'],

    [':nth-child(a)', 'Unable to parse pseudo argument'],
    [':nth-child(a1)', 'Unable to parse pseudo argument'],
    [':nth-child(1 2)', 'Unable to parse pseudo argument'],

    ['a+b:nth-child(1)', 'This locator will always return null'],
    ['a+b:nth-of-type(2)', 'This locator will always return null'],
    ['a + b:nth-of-type(2)', 'This locator will always return null'],
    ['a+[a=b].class:nth-of-type(5)', 'This locator will always return null'],
    ['a+*:nth-of-type(4)', 'This locator will always return null']

];


describe('Negative unit tests', function () {
    for (let i = 0; i < negativeTestPairs.length; i++) {
        it(`"${negativeTestPairs[i][0]}" is expected to cause log: "${negativeTestPairs[i][1]}"`, function () {
            assert((cssxpathObject(negativeTestPairs[i][0]).error).startsWith(negativeTestPairs[i][1]), `Actual: ${cssxpathObject(negativeTestPairs[i][0]).error}`);
        });
    }
});
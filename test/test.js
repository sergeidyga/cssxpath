const assert = require('assert');
const cssxpath = require('../index');
const cssxpathObject = require('../src/cssxpath').cssXpath;

let testPairs = [

    // Elements and special selectors
    ['*', '//*'],
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
    ['a ~ *:nth-of-type(1)', '//a/following-sibling::*[name(preceding-sibling::*[1]) != name()]'],

    // :nth-of-type with formulas in argument (e.g. 2n+5)
    ['a:nth-of-type(n)', '//a'],
    ['a:nth-of-type(1n)', '//a'],
    ['a:nth-of-type(n+3)', '//a[position() >= 3]'],
    ['a:nth-of-type(1n+2)', '//a[position() >= 2]'],
    ['a:nth-of-type(0n+1)', '//a[1]'],
    ['a:nth-of-type(1n-10)', '//a'],
    ['a:nth-of-type(n-0)', '//a'],
    ['a:nth-of-type(1n+10)', '//a[position() >= 10]'],
    ['a:nth-of-type(-1n+5)', '//a[position() <= 5]'],
    ['a:nth-of-type(-3n+5)', '//a[(position() - 5) mod 3 = 0 and position() <= 5]'],
    ['a:nth-of-type(4n-5)', '//a[(position() + 5) mod 4 = 0]'],
    ['a:nth-of-type(2n+1)', '//a[(position() - 1) mod 2 = 0]'],
    ['a.someClass#someId[attr1][attr2="value"]:nth-of-type(2n+3)', '//a[(position() - 3) mod 2 = 0 and position() >= 3][@attr2="value"][@attr1][@id="someId"][contains(@class, "someClass")]'],
    ['a:nth-of-type(odd)', '//a[(position() - 1) mod 2 = 0]'],
    ['a:nth-of-type(even)', '//a[position() mod 2 = 0]'],
    ['a:nth-of-type(3n)', '//a[position() mod 3 = 0]'],
    ['a~b:nth-of-type(3n+2)', '//a/following-sibling::b[(position() - 2) mod 3 = 0 and position() >= 2]'],
    ['a~b:nth-of-type(3n-2)', '//a/following-sibling::b[(position() + 2) mod 3 = 0]'],
    ['a+b:nth-of-type(-3n+2)', '//a/following-sibling::b[1][(position() - 2) mod 3 = 0 and position() <= 2]'],
    ['a+b:nth-of-type(125n+1)', '//a/following-sibling::b[1]'],
    ['a+b:nth-of-type(1n)', '//a/following-sibling::b[1]'],
    ['a+b:nth-of-type(2n-1)', '//a/following-sibling::b[1][(position() + 1) mod 2 = 0]'],
    ['a+b:nth-of-type(2n+1)', '//a/following-sibling::b[1]'],
    ['a+b:nth-of-type(-15n+1)', '//a/following-sibling::b[1]'],
    ['a+b:nth-of-type(-15n+16)', '//a/following-sibling::b[1][(position() - 16) mod 15 = 0 and position() <= 16]'],
    ['a+b:nth-of-type(1)', '//a/following-sibling::b[1]'],
    ['a~b:nth-of-type(-15n+16)', '//a/following-sibling::b[(position() - 16) mod 15 = 0 and position() <= 16]'],
    ['a~b:nth-of-type(-15n+5)', '//a/following-sibling::b[(position() - 5) mod 15 = 0 and position() <= 5]'],

    // :nth-child with formulas in argument (e.g. 2n+5)
    [':nth-child(n)', '//*'],
    [':nth-child(n-0)', '//*'],
    [':nth-child(1n-10)', '//*'],
    [':nth-child(1n+1)', '//*'],
    [':nth-child(n-10)', '//*'],
    ['a:nth-child(1n)', '//a'],
    [':nth-child(n+2)', '//*[position() >= 2]'],
    [':nth-child(1n+2)', '//*[position() >= 2]'],
    ['a:nth-child(0n+1)', '//*[1]/self::a'],
    [':nth-child(1n+10)', '//*[position() >= 10]'],
    [':nth-child(-1n+1)', '//*[1]'],
    [':nth-child(-3n+5)', '//*[(position() - 5) mod 3 = 0 and position() <= 5]'],
    ['*:nth-child(4n-5)', '//*[(position() + 5) mod 4 = 0]'],
    ['*:nth-child(2n+1)', '//*[(position() - 1) mod 2 = 0]'],
    ['a:nth-child(odd)', '//*[(position() - 1) mod 2 = 0]/self::a'],
    ['a:nth-child(even)', '//*[position() mod 2 = 0]/self::a'],
    ['*:nth-child(3n)', '//*[position() mod 3 = 0]'],
    ['a~*:nth-child(3n+1)', '//a/following-sibling::*[position() mod 3 = 0]'],
    ['a~*:nth-child(3n+2)', '//a/following-sibling::*[(position() - 1) mod 3 = 0]'],
    ['a~*:nth-child(5n+3)', '//a/following-sibling::*[count(preceding-sibling::*) >= 2 and (position() - 2) mod 5 = 0]'],
    ['a~*:nth-child(-5n+3)', '//a/following-sibling::*[count(preceding-sibling::*) <= 2 and (position() - 2) mod 5 = 0]'],
    ['a~*:nth-child(5n-3)', '//a/following-sibling::*[(position() + 4) mod 5 = 0]'],
    ['a~:nth-child(5n-3)', '//a/following-sibling::*[(position() + 4) mod 5 = 0]'],
    ['a~b:nth-child(n+2)', '//a/following-sibling::b'],
    ['a+b:nth-child(n+2)', '//a/following-sibling::b[1]'],
    ['a~b:nth-child(n+1)', '//a/following-sibling::b'],
    ['a+b:nth-child(n+1)', '//a/following-sibling::b[1]'],
    ['a+b:nth-child(n-10)', '//a/following-sibling::b[1]'],
    ['a+b:nth-child(n+3)', '//a/following-sibling::b[1][count(preceding-sibling::*) >= 2]'],
    ['a~b:nth-child(n+3)', '//a/following-sibling::b[count(preceding-sibling::*) >= 2]'],
    ['a~b.someClass#someId[attr1][attr2="value"]:nth-child(2n+3)', '//a/following-sibling::b[contains(@class, "someClass")][@id="someId"][@attr1][@attr2="value"][count(preceding-sibling::*) >= 2 and (position() - 2) mod 2 = 0]']

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
    ['a~b:nth-child(1)', 'This locator will always return null'],
    ['a+b:nth-of-type(2)', 'This locator will always return null'],
    ['a + b:nth-of-type(2)', 'This locator will always return null'],
    ['a+[a=b].class:nth-of-type(5)', 'This locator will always return null'],
    ['a+*:nth-of-type(4)', 'This locator will always return null'],

    // Incorrect nth arguments:
    [':nth-child(n+)', 'Unable to parse pseudo argument'],
    [':nth-child(-n)', 'Unable to parse pseudo argument'],
    [':nth-child(-)', 'Unable to parse pseudo argument'],
    [':nth-child(-n+1)', 'Unable to parse pseudo argument'],
    [':nth-child(-n+1)', 'Unable to parse pseudo argument'],
    [':nth-child(+1)', 'Unable to parse pseudo argument'],
    [':nth-child(n1)', 'Unable to parse pseudo argument'],
    [':nth-child(1+n)', 'Unable to parse pseudo argument'],

    // Always null nth arguments:
    [':nth-child(-1n)', 'This locator will always return null'],
    [':nth-child(0n)', 'This locator will always return null'],
    ['a:nth-of-type(-1n)', 'This locator will always return null'],
    [':nth-child(-1n-1)', 'This locator will always return null'],
    ['a:nth-of-type(-1n-1)', 'This locator will always return null'],
    [':nth-child(-1n-1)', 'This locator will always return null'],
    ['a+b:nth-of-type(n+2)', 'This locator will always return null'],

    // Not supported in this version *:nth-of-type
    [':nth-of-type(-1n+2)', 'Argument \'-1n+2\' is not supported for *:nth-of-type in this version.'],

];


describe('Negative unit tests', function () {
    for (let i = 0; i < negativeTestPairs.length; i++) {
        it(`"${negativeTestPairs[i][0]}" is expected to cause log: "${negativeTestPairs[i][1]}"`, function () {
            assert((cssxpathObject(negativeTestPairs[i][0]).error).startsWith(negativeTestPairs[i][1]), `Actual: ${cssxpathObject(negativeTestPairs[i][0]).error}`);
        });
    }
});

let warningTestPairs = [

    [':nth-child(n)', 'XPath condition [position()'],
    [':nth-child(n+1)', 'XPath condition [position()'],
    [':nth-child(2n+1)', 'XPath condition [position()'],
    [':nth-child(1n-1)', 'XPath condition [position()'],

    ['a+b:nth-child(n+2)', 'XPath condition [count(preceding-sibling::*)'],
    ['a+b:nth-child(n+1)', 'XPath condition [count(preceding-sibling::*)'],
    ['a+b:nth-child(n)', 'XPath condition [count(preceding-sibling::*)'],
    ['a+b:nth-child(n-1)', 'XPath condition [count(preceding-sibling::*)'],
    ['a+b:nth-child(2n+2)', 'XPath condition [count(preceding-sibling::*)'],
    ['a+b:nth-child(2n+1)', 'XPath condition [count(preceding-sibling::*)'],
    ['a+b:nth-child(2n)', 'XPath condition [count(preceding-sibling::*)'],
    ['a+b:nth-child(2n-1)', 'XPath condition [count(preceding-sibling::*)'],

];

describe('Warning unit tests', function () {
    for (let i = 0; i < warningTestPairs.length; i++) {
        it(`"${warningTestPairs[i][0]}" is expected to cause log: "${warningTestPairs[i][1]}"`, function () {
            assert((cssxpathObject(warningTestPairs[i][0]).warning).startsWith(warningTestPairs[i][1]), `Actual: ${cssxpathObject(warningTestPairs[i][0]).warning}`);
        });
    }
});

// todo test of turning warnings on/off
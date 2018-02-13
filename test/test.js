const assert = require('assert');
const cssxpath = require('../index');

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
    [':not(a), :not(b)', '//*[not(self::a)] | //*[not(self::b)]'],
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
    [':not(#idValue)', '//*[not(self::*[@id="idValue"])]'],
    [':not( #idValue )', '//*[not(self::*[@id="idValue"])]'],
    [':not(.className)', '//*[not(self::*[contains(@class, "className")])]'],
    [':not( .className )', '//*[not(self::*[contains(@class, "className")])]'],
    [':not([attr])', '//*[not(self::*[@attr])]'],
    [':not( [attr] )', '//*[not(self::*[@attr])]'],
    [':not( [ attr ] )', '//*[not(self::*[@attr])]'],
    [':not([attr="value"])', '//*[not(self::*[@attr="value"])]'],
    [':not([ attr = "value" ])', '//*[not(self::*[@attr="value"])]'],
    ['a:not([attr])', '//a[not(self::*[@attr])]'],
    ['a b:not([attr])', '//a//b[not(self::*[@attr])]'],
    ['.className a:not([attr])', '//*[contains(@class, "className")]//a[not(self::*[@attr])]'],
    ['.className :not([attr])', '//*[contains(@class, "className")]//*[not(self::*[@attr])]'],
    ['.className :not([attr]):not(#idValue)', '//*[contains(@class, "className")]//*[not(self::*[@attr])][not(self::*[@id="idValue"])]'],

    //:not with arguments
    [':not(a b)', '//*[not(ancestor::a and self::b)]'],
    [':not(a[b])', '//*[not(self::a[@b])]'],
    [':not(a[b=2])', '//*[not(self::a[@b="2"])]'],
    [':not(a.b)', '//*[not(self::a[contains(@class, "b")])]'],
    [':not(a#b)', '//*[not(self::a[@id="b"])]'],
    [':not(.a[b])', '//*[not(self::*[contains(@class, "a")][@b])]'],
    [':not(#a[b])', '//*[not(self::*[@id="a"][@b])]'],
    [':not([a=b][b=c])', '//*[not(self::*[@a="b"][@b="c"])]'],

    //:not with nesting //todo it will be changed for deep nesting support in next versions
    [':not(a b c)', '//*[not(ancestor::a and ancestor::b and self::c)]'],
    [':not(a b>c)', '//*[not(ancestor::a and parent::b and self::c)]'],
    [':not(a b~c)', '//*[not(ancestor::a and preceding-sibling::b and self::c)]'],
    [':not(a b+c)', '//*[not(ancestor::a and preceding-sibling::b and self::c[name(preceding-sibling::*[1]) != name()])]'],
    [':not(a[myAttr] b.myClass+c)', '//*[not(ancestor::a[@myAttr] and preceding-sibling::b[contains(@class, "myClass")] and self::c[name(preceding-sibling::*[1]) != name()])]'],

    // Pseudo :nth-child(n)
    [':nth-child(1)', '//*[1]'],
    [':nth-child(199)', '//*[199]'],
    ['*:nth-child(199)', '//*[199]'],
    ['a :nth-child( 2 )', '//a//*[2]'],
    ['#idValue:nth-child(2)', '//*[2][@id="idValue"]'],
    ['.className:nth-child(2)', '//*[2][contains(@class, "className")]'],
    ['#idValue.className:nth-child(2)', '//*[2][@id="idValue"][contains(@class, "className")]'],
    ['a:nth-child(2)', '//*[2]/self::a'],
    ['a b:nth-child(2)', '//a//*[2]/self::b'],
    ['a b#idValue.className:nth-child(2)', '//a//*[2]/self::b[@id="idValue"][contains(@class, "className")]'],
    ['a[b=1][c="2"]:nth-child(1)', '//*[1]/self::a[@b="1"][@c="2"]'],
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
    ['#idValue:nth-of-type(2)', '//*[@id="idValue"][name(preceding-sibling::*[2]) != name() and name(preceding-sibling::*[1]) = name()]'],
    ['.className:nth-of-type(2)', '//*[contains(@class, "className")][name(preceding-sibling::*[2]) != name() and name(preceding-sibling::*[1]) = name()]'],
    ['a#idValue.className:nth-of-type(2)', '//a[@id="idValue"][contains(@class, "className")][2]'],
    ['a[b=1][c="2"]:nth-of-type(1)', '//a[@b="1"][@c="2"][1]'],
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
    ['a.someClass#someId[attr1][attr2="value"]:nth-of-type(2n+3)', '//a[contains(@class, "someClass")][@id="someId"][@attr1][@attr2="value"][(position() - 3) mod 2 = 0 and position() >= 3]'],
    ['a:nth-of-type(odd)', '//a[(position() - 1) mod 2 = 0]'],
    ['a:nth-of-type(even)', '//a[position() mod 2 = 0]'],
    ['a:nth-of-type(3n)', '//a[position() mod 3 = 0]'],
    ['a~b:nth-of-type(3n+2)', '//a/following-sibling::b[(position() - 2) mod 3 = 0 and position() >= 2]'],
    ['a~b:nth-of-type(3n-2)', '//a/following-sibling::b[(position() + 2) mod 3 = 0]'],
    ['a+b:nth-of-type(125n+1)', '//a/following-sibling::b[1]'],
    ['a+b:nth-of-type(1n)', '//a/following-sibling::b[1]'],
    ['a+b:nth-of-type(4n-3)', '//a/following-sibling::b[1]'],
    ['a+b:nth-of-type(2n+1)', '//a/following-sibling::b[1]'],
    ['a+b:nth-of-type(-15n+1)', '//a/following-sibling::b[1]'],
    ['a+b:nth-of-type(-15n+16)', '//a/following-sibling::b[1]'],
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

describe('Conversion tests', function () {
    for (let i = 0; i < testPairs.length; i++) {
        it(`${testPairs[i][0]} is expected as ${testPairs[i][1]}`, function () {
            assert.equal(cssxpath.convert(testPairs[i][0]), testPairs[i][1]);
        });
    }
});


let negativeTestPairs = [

    ['', 'Empty CSS selector.'],
    [' ', 'Empty CSS selector.'],

    ['123', 'Invalid CSS selector.'],
    ['a 123', 'Invalid CSS selector.'],
    ['a[*]', 'Invalid CSS selector.'],
    ['a b )', 'Invalid CSS selector.'],
    ['---a', 'Invalid CSS selector.'],
    ['___a', 'Invalid CSS selector.'],
    ['___a', 'Invalid CSS selector.'],
    ['[]', 'Invalid CSS selector.'],
    ['a[]', 'Invalid CSS selector.'],
    ['a[123]', 'Invalid CSS selector.'],
    ['[a=b=c]', 'Invalid CSS selector.'],
    ['[.a]', 'Invalid CSS selector.'],
    ['[#a]', 'Invalid CSS selector.'],
    ['[:not(a)]', 'Invalid CSS selector.'],
    ['[a:not(b)]', 'Invalid CSS selector.'],
    ['[a==b]', 'Invalid CSS selector.'],
    ['.', 'Invalid CSS selector.'],
    ['.:not(a)', 'Invalid CSS selector.'],
    ['#', 'Invalid CSS selector.'],
    ['[a="b"d"]', 'Invalid CSS selector.'],
    ['[a=\'b\'d\']', 'Invalid CSS selector.'],
    ['[a=b"d]', 'Invalid CSS selector.'],
    ['a>>b', 'Invalid CSS selector.'],
    ['a>', 'Invalid CSS selector.'],
    ['a,,b', 'Invalid CSS selector.'],
    ['a,', 'Invalid CSS selector.'],
    ['a,', 'Invalid CSS selector.'],
    ['a++', 'Invalid CSS selector.'],
    ['a+', 'Invalid CSS selector.'],
    ['a + +', 'Invalid CSS selector.'],
    ['a[b=c', 'Invalid CSS selector.'],
    ['**', 'Invalid CSS selector.'],
    ['a, :::not()', 'Invalid CSS selector.'],
    ['a, [[[a]', 'Invalid CSS selector.'],

    [':not()', 'Unsupported pseudo :not() with undefined argument'],
    ['::not', 'Unsupported pseudo ::not'],
    [':not', 'Unsupported pseudo :not'],
    [':checked(selector)', 'Unsupported pseudo :checked(selector)'],

    [':not(1)', 'Unable to parse :not argument \'1\''],
    [':nth-child(a)', 'Unable to parse :nth- argument \'a\''],
    [':nth-child(a1)', 'Unable to parse :nth- argument \'a1\''],
    ['a:nth-of-type(1 2)', 'Unable to parse :nth- argument \'1 2\''],

    ['a+b:nth-child(1)', 'This locator will always return null'],
    ['a~b:nth-child(1)', 'This locator will always return null'],
    ['a+b:nth-of-type(2)', 'This locator will always return null'],
    ['a + b:nth-of-type(2)', 'This locator will always return null'],
    ['a+[a=b].class:nth-of-type(5)', 'This locator will always return null'],
    ['a+*:nth-of-type(4)', 'This locator will always return null'],

    // Incorrect nth arguments:
    [':nth-child(n+)', 'Unable to parse :nth- argument'],
    [':nth-child(-n)', 'Unable to parse :nth- argument'],
    [':nth-child(-)', 'Unable to parse :nth- argument'],
    [':nth-child(-n+1)', 'Unable to parse :nth- argument'],
    [':nth-child(-n+1)', 'Unable to parse :nth- argument'],
    [':nth-child(+1)', 'Unable to parse :nth- argument'],
    [':nth-child(n1)', 'Unable to parse :nth- argument'],
    [':nth-child(1+n)', 'Unable to parse :nth- argument'],

    // Always null nth arguments:
    [':nth-child(-1n)', 'This locator will always return null'],
    [':nth-child(0n)', 'This locator will always return null'],
    ['a:nth-of-type(-1n)', 'This locator will always return null'],
    [':nth-child(-1n-1)', 'This locator will always return null'],
    ['a:nth-of-type(-1n-1)', 'This locator will always return null'],
    [':nth-child(-1n-1)', 'This locator will always return null'],
    ['a+b:nth-of-type(n+2)', 'This locator will always return null'],
    ['a+b:nth-of-type(-3n+2)', 'This locator will always return null'],

    // Not supported in this version
    [':nth-of-type(-2n+5)', 'Argument \'-2n+5\' is not supported for *:nth-of-type in this version.'],
    [':not(a>b>c)', 'This version supports only single nesting level for \'>\' argument in :not(). You have used it 2 times: \'a>b>c\'']


];


describe('Error logs tests', function () {
    for (let i = 0; i < negativeTestPairs.length; i++) {
        it(`"${negativeTestPairs[i][0]}" is expected to cause log: "${negativeTestPairs[i][1]}"`, function () {
            assert((cssxpath.convert(negativeTestPairs[i][0], true).error).startsWith(negativeTestPairs[i][1]), `Actual: ${cssxpath.convert(negativeTestPairs[i][0], true).error}`);
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

describe('Warning logs tests', function () {
    for (let i = 0; i < warningTestPairs.length; i++) {
        it(`"${warningTestPairs[i][0]}" is expected to cause log: "${warningTestPairs[i][1]}"`, function () {
            assert((cssxpath.convert(warningTestPairs[i][0], true).warning).startsWith(warningTestPairs[i][1]), `Actual: ${cssxpath.convert(warningTestPairs[i][0], true).warning}`);
        });
    }
});

describe('Developer mode tests', function () {
    it(`If returnMode is not defined - function must return string`, function () {
        assert.equal(typeof cssxpath.convert('a'), 'string');
    });
    it(`If returnMode is false -  - function must return string`, function () {
        assert.equal(typeof cssxpath.convert('a', false), 'string');
    });
    it(`If returnMode is true - function must return object`, function () {
        assert.equal(typeof cssxpath.convert('a', true), 'object');
    });
    it(`If returnMode is not boolean - function must throw SyntaxError`, function () {
        assert.throws(function() {cssxpath.convert('a', 1)}, SyntaxError, 'expected returnObject argument type is boolean');
    });
});

// todo test of turning warnings on/off
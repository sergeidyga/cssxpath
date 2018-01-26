cssxpath
====================
Converts CSS3 selectors into XPath expression. Based on abandoned [Firebug code](https://github.com/firebug/firebug/blob/master/extension/content/firebug/lib/xpath.js).

Install
------------
`npm i convert-cssxpath`

Examples
-----
```js
const cssxpath = require('convert-cssxpath');
cssxpath.convert('[attribute]')
/*
* Output: //*[@attribute]
*/
```
Or if you want to test different CSS selectors - you may input them in prompt using:
```js
const cssxpath = require('convert-cssxpath');
cssxpath.ask()
/*
* Run console interface and ask you to enter CSS selector
*/
```
Pseudo selector :not() is fully supported. For example:
```js
cssxpath.convert(':not([attribute])')
/*
* Output: //*[not(@attribute)]
*/
```
If CSS selector is wrong console will output the reason:
```js
cssxpath.ask()
/*
*   If invalid css was entered in the console:
* 
* CSS > :not(123)
*     > Wrong pseudo selector argument.
* 
*/
```
You can see other supported examples in `./test/test.js`

What is next
------------
Support of those expressions will be added in next versions:
- :nth-child(n)
- :nth-last-child(n)
- nth-of-type(n)
- nth-last-of-type(n)

Other pseudo selectors (e.g. :disabled) are also not supported.
Selectors with position such as :nth-child(n) are trimmed out from input CSS in this version.

Changelog
------------
_`- v.0.0.4 full support of :not(selector)`_

License
-------
[BSD 3-clause license](https://github.com/firebug/firebug/blob/master/extension/license.txt) (since it's based on Firefox code)


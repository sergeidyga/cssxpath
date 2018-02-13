function validateArgument(nthArgument) {
    let modnpos = {
        mod: 0,
        pos: 0
    };
    if (nthArgument.mod) {
        modnpos.mod = Number(nthArgument.mod);
    }
    if (nthArgument.number) {
        modnpos.mod = 0;
        modnpos.pos = Number(nthArgument.number);
    }
    if (nthArgument.pos) {
        if (!nthArgument.mod) modnpos.mod = 1;
        modnpos.pos = Number(nthArgument.pos);
    }
    if (nthArgument.odd) {
        modnpos.mod = 2;
        modnpos.pos = 1;
    }
    if (nthArgument.even) {
        modnpos.mod = 2;
    }
    if (nthArgument.fullGroup === 'n') { // (n)
        modnpos.mod = 1;
        modnpos.pos = 1;
    }

    modnpos.mod = Number(modnpos.mod);
    modnpos.pos = Number(modnpos.pos);
    return modnpos;
}

function sumWillReturnOne(modnpos) {
    return !((modnpos.pos - 1) % modnpos.mod);
}

function calculatePosition_NthOfType_WithFsOne(modnpos) {     // following-sibling::<...>[1][position() > 1]
    const Converter = require('./converter');
    const converter = Converter.getInstance();
    let xpathNthArgument;

    // Define sign:
    let sign = '=';
    if (modnpos.mod < 0) sign = '<=';
    if (modnpos.mod === 0) sign = '=';
    if (modnpos.mod > 0) sign = '>=';

    // following-sibling::<...>[1][position() > 1]
    if (modnpos.pos > 1 && modnpos.mod >= 0) converter.xpathResult.error = 'This locator will always return null.'; // (n+2), (2n+2), (2)
    if (modnpos.pos === 0 && modnpos.mod > 1) converter.xpathResult.error = 'This locator will always return null.'; // (2n)
    if (modnpos.pos <= 0 && modnpos.mod < 0) converter.xpathResult.error = 'This locator will always return null.'; // (-1n)
    if (converter.xpath[converter.index] !== '*') { // following-sibling::<element>[1]
        if ((modnpos.pos > 0 && modnpos.mod < 0) && sumWillReturnOne(modnpos)) { /*push nothing*/
            xpathNthArgument = '';
            converter.xpathResult.warning = `XPath condition was simplified from [(position() - ${modnpos.pos}) mod ${Math.abs(modnpos.mod)} = 0 and position() ${sign} ${modnpos.pos}]`;
        } // (-3n+4)
        else if (modnpos.pos === 1) { /*push nothing*/
            xpathNthArgument = '';
            converter.xpathResult.warning = `XPath condition was simplified from [(position() - ${modnpos.pos}) mod ${Math.abs(modnpos.mod)} = 0 and position() ${sign} ${modnpos.pos}]`;
        } // (1), (n+1), (2n+1)
    }
    if (converter.xpath[converter.index] === '*') { // following-sibling::*[1]
        if ((modnpos.pos > 0 && modnpos.mod < 0) && sumWillReturnOne(modnpos)) xpathNthArgument = (`[name(preceding-sibling::*[1]) != name()]`); // (-3n+4)
        else if (modnpos.pos === 1) xpathNthArgument = (`[name(preceding-sibling::*[1]) != name()]`); // (1), (n+1), (2n+1)
    }
    if ((modnpos.pos > 0 && modnpos.mod < 0) && !sumWillReturnOne(modnpos)) converter.xpathResult.error = 'This locator will always return null.'; // (-3n+5)
    if ((modnpos.pos < 0 && modnpos.mod > 0) && !sumWillReturnOne(modnpos)) converter.xpathResult.error = 'This locator will always return null.'; // (3n-1)

    return xpathNthArgument;
}

function calculatePosition_Asterisk_NthOfType(modnpos, nthArgument) { // *:nth-of-type()
    const Converter = require('./converter');
    const converter = Converter.getInstance();
    let xpathNthArgument;

    if (modnpos.pos < 1) converter.xpathResult.error = 'This locator will always return null.';
    if (modnpos.pos === 1) xpathNthArgument = (`[name(preceding-sibling::*[${Number(modnpos.pos)}]) != name()]`);
    if (modnpos.pos > 1) xpathNthArgument = (`[name(preceding-sibling::*[${Number(modnpos.pos)}]) != name() and name(preceding-sibling::*[${Number(modnpos.pos) - 1}]) = name()]`);
    if (modnpos.mod !== 0) converter.xpathResult.error = `Argument '${nthArgument.fullGroup}' is not supported for *:nth-of-type in this version. 
                        Use {element}:nth-of-type(${modnpos.pos}) or *:nth-of-type({number}) instead`; // (1n+1)-based formulas are tricky with *:nth-of-type //todo in next versions

    return xpathNthArgument;
}

function calculatePosition(modnpos) {
    const Converter = require('./converter');
    const converter = Converter.getInstance();
    let xpathNthArgument;

    // Define sign:
    let sign = '=';
    if (modnpos.mod < 0) sign = '<=';
    if (modnpos.mod === 0) sign = '=';
    if (modnpos.mod > 0) sign = '>=';

    if (modnpos.mod === 1) {
        if (modnpos.pos <= 1) {
            xpathNthArgument = ``;
            converter.xpathResult.warning = `XPath condition [position() ${sign} ${modnpos.pos}] was omitted`; // (n+1), (n), (n-100)
        }
        if (modnpos.pos > 1) xpathNthArgument = `[position() ${sign} ${modnpos.pos}]`; // (n+2)
    }
    if (modnpos.mod === -1) {
        if (modnpos.pos <= 0) converter.xpathResult.error = 'This locator will always return null'; // (-1n), (-1n-1)
        if (modnpos.pos === 1) {
            xpathNthArgument = `[1]`; // (-1n+1)
            converter.xpathResult.warning = `XPath condition [position() ${sign} ${modnpos.pos}] was omitted`;
        }
        if (modnpos.pos > 1) xpathNthArgument = `[position() ${sign} ${modnpos.pos}]`; // (-1n+2)
    }
    if (modnpos.mod === 0) {
        if (modnpos.pos <= 0) converter.xpathResult.error = 'This locator will always return null'; // (0), (-1) // todo change to WARN?
        if (modnpos.pos > 0) xpathNthArgument = `[${modnpos.pos}]`; // (1)
    }
    if (modnpos.mod > 0 && Math.abs(modnpos.mod) !== 1) {
        if (modnpos.pos === 0) {
            xpathNthArgument = `[position() mod ${Math.abs(modnpos.mod)} = 0]`; // (2n)
            converter.xpathResult.warning = `XPath condition [position() ${sign} ${modnpos.pos}] was omitted`;
        }
        if (modnpos.pos === 1) {
            xpathNthArgument = `[(position() - ${modnpos.pos}) mod ${Math.abs(modnpos.mod)} = 0]`; // (2n+1)
            converter.xpathResult.warning = `XPath condition [position() ${sign} ${modnpos.pos}] was omitted`;
        }
        if (modnpos.pos > 1) xpathNthArgument = `[(position() - ${modnpos.pos}) mod ${Math.abs(modnpos.mod)} = 0 and position() ${sign} ${modnpos.pos}]`; // (5n+2)
        if (modnpos.pos < 0) xpathNthArgument = `[(position() + ${-modnpos.pos}) mod ${Math.abs(modnpos.mod)} = 0]`; // (5n-5)
    }
    if (modnpos.mod < 0 && Math.abs(modnpos.mod) !== 1) {
        if (modnpos.pos === 0) xpathNthArgument = `[(position() mod ${Math.abs(modnpos.mod)} = 0]`; // (-2n)
        if (modnpos.pos > 0) xpathNthArgument = `[(position() - ${modnpos.pos}) mod ${Math.abs(modnpos.mod)} = 0 and position() ${sign} ${modnpos.pos}]`; //(-2n+1)
        if (modnpos.pos <= 0) converter.xpathResult.error = 'This locator will always return null'; // (-2n-1), (-2n) // todo change to WARN?
    }
    if (typeof xpathNthArgument === 'undefined' && typeof converter.xpathResult.error === 'undefined') throw new SyntaxError('Unable to parse nth argument');

    return xpathNthArgument;
}

function calculatePositionNthOfChildWithFollowingSibling(modnpos) { // Used for following-sibling ONLY!!! in case of :nth-child
    const Converter = require('./converter');
    const converter = Converter.getInstance();
    let xpathNthArgumentFS; // for following-sibling;

    // Define sign:
    let sign = '=';
    if (modnpos.mod < 0) sign = '<=';
    if (modnpos.mod === 0) sign = '=';
    if (modnpos.mod > 0) sign = '>=';

    if (modnpos.mod === 1) {
        if (modnpos.pos <= 2) {
            xpathNthArgumentFS = ``;
            converter.xpathResult.warning = `XPath condition [count(preceding-sibling::*) ${sign} ${modnpos.pos - 1}] was omitted`; // (n+2), (n), (n-100)
        }
        if (modnpos.pos > 2) xpathNthArgumentFS = `[count(preceding-sibling::*) ${sign} ${modnpos.pos - 1}]`; // (n+3)
    }
    if (modnpos.mod === -1) {
        if (modnpos.pos <= 1) converter.xpathResult.error = 'This locator will always return null'; // (-1n), (-1n-1)
        if (modnpos.pos === 2) {
            xpathNthArgumentFS = ``; // (-1n+2)
            converter.xpathResult.warning = `XPath condition [count(preceding-sibling::*) ${sign} ${modnpos.pos - 1}] was omitted`;
        }
        if (modnpos.pos > 2) xpathNthArgumentFS = `[count(preceding-sibling::*) ${sign} ${modnpos.pos - 1}]`; // (-1n+3)
    }
    if (modnpos.mod === 0) {
        if (modnpos.pos <= 1) converter.xpathResult.error = 'This locator will always return null'; // (1), (0), (-1) // todo change to WARN?
        if (modnpos.pos > 1) xpathNthArgumentFS = `[count(preceding-sibling::*) ${sign} ${modnpos.pos - 1}]`; // (2)
    }
    if (modnpos.mod > 0 && Math.abs(modnpos.mod) !== 1) {
        if (modnpos.pos === 1) {
            xpathNthArgumentFS = `[position() mod ${Math.abs(modnpos.mod)} = 0]`; // (2n+1)
            converter.xpathResult.warning = `XPath condition [count(preceding-sibling::*) ${sign} ${modnpos.pos - 1}] was omitted`;
        }
        if (modnpos.pos === 2) {
            xpathNthArgumentFS = `[(position() - ${modnpos.pos - 1}) mod ${Math.abs(modnpos.mod)} = 0]`; // (2n+2)
            converter.xpathResult.warning = `XPath condition [count(preceding-sibling::*) ${sign} ${modnpos.pos - 1}] was omitted`;
        }
        if (modnpos.pos > 2) xpathNthArgumentFS = `[count(preceding-sibling::*) ${sign} ${modnpos.pos - 1} and (position() - ${modnpos.pos - 1}) mod ${Math.abs(modnpos.mod)} = 0]`; // (5n+3)
        if (modnpos.pos < 1) {
            xpathNthArgumentFS = `[(position() + ${-(modnpos.pos - 1)}) mod ${Math.abs(modnpos.mod)} = 0]`; // (2n), (2n-1)
            converter.xpathResult.warning = `XPath condition [count(preceding-sibling::*) ${sign} ${modnpos.pos - 1}] was omitted`;
        }
    }
    if (modnpos.mod < 0 && Math.abs(modnpos.mod) !== 1) {
        if (modnpos.pos === 1) {
            xpathNthArgumentFS = `[position() mod ${Math.abs(modnpos.mod)} = 0]`; // (2n+1)
            converter.xpathResult.warning = `XPath condition [count(preceding-sibling::*) ${sign} ${modnpos.pos - 1}] was omitted`;
        }
        if (modnpos.pos === 2) {
            xpathNthArgumentFS = `[(position() - ${modnpos.pos - 1}) mod ${Math.abs(modnpos.mod)} = 0]`; // (2n+2)
            converter.xpathResult.warning = `XPath condition [count(preceding-sibling::*) ${sign} ${modnpos.pos - 1}] was omitted`;
        }
        if (modnpos.pos > 2) xpathNthArgumentFS = `[count(preceding-sibling::*) ${sign} ${modnpos.pos - 1} and (position() - ${modnpos.pos - 1}) mod ${Math.abs(modnpos.mod)} = 0]`; // (5n+3)
        if (modnpos.pos < 1) converter.xpathResult.error = 'This locator will always return null'; // (-2n-1), (-2n) // todo change to WARN?
    }
    if (typeof xpathNthArgumentFS === 'undefined' && typeof converter.xpathResult.error === 'undefined') throw new SyntaxError('Unable to parse nth argument');

    return xpathNthArgumentFS;
}

function getPosition(nthArgument) {
    let modnpos = validateArgument(nthArgument);
    return calculatePosition(modnpos);
}

function getPositionFS_nthChild(nthArgument) {
    let modnpos = validateArgument(nthArgument);
    return calculatePositionNthOfChildWithFollowingSibling(modnpos);
}

function getPositionFsOne_nthOfType(nthArgument) {
    let modnpos = validateArgument(nthArgument);
    return calculatePosition_NthOfType_WithFsOne(modnpos);
}

function getPositionAsterisk_nthOfType(nthArgument) {
    let modnpos = validateArgument(nthArgument);
    return calculatePosition_Asterisk_NthOfType(modnpos, nthArgument);
}

module.exports.getPositionFS = getPositionFS_nthChild;
module.exports.getPositionFsOne = getPositionFsOne_nthOfType;
module.exports.getPositionAsterisk = getPositionAsterisk_nthOfType;
module.exports.getPosition = getPosition;
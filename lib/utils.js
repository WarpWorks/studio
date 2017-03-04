// ***************************************************************************************************** //
// Utility functions
// ***************************************************************************************************** //
const HeadStartError = require('./headstart-error');

function splitBySeparator(str, separator) {
    var res = [];
    if (!str.includes(separator)) {
        return [str];
    }
    res[0] = str.split(separator, 1)[0];
    res[1] = str.slice(res[0].length + separator.length);
    return res;
}

function extractTagValue(str, openTag, closeTag) {
    // Returns array with header, tag value (value between openTag and closeTag), footer
    // Only extracts first tag value

    var pos1 = str.indexOf(openTag);
    var pos2 = str.indexOf(closeTag);

    if (pos1 === -1) {
        throw new HeadStartError(`Missing opening tag '${openTag}'!`);
    } else if (pos2 === -1) {
        throw new HeadStartError(`Missing closing tag '${closeTag}'!`);
    } else if (pos1 > pos2) {
        throw new HeadStartError(`Opening tag '${openTag}' must come before closing tag '${closeTag}'!`);
    }

    return [
        str.slice(0, pos1),
        str.slice(pos1 + openTag.length, pos2),
        str.slice(pos2 + closeTag.length)
    ];
}

function getTokenSeq(str, openTag, closeTag) {
    // Parse str for tagValues enclosed between openTag and closeTag
    // Returns array of tokens as follows: { value: "text", isTagValue: true|false }
    var tokenSeq = [];
    while (str.includes(openTag)) {
        var bs = extractTagValue(str, openTag, closeTag);
        if (bs[0].length > 0) {
            tokenSeq.push({ value: bs[0], isTagValue: false });
        }
        if (bs[1].length > 0) {
            if (bs[1].includes(openTag)) {
                throw new HeadStartError("Opening tag '" + openTag + "' must be followed by closing tag '" + closeTag + "' before next opening tag!");
            }
            tokenSeq.push({value: bs[1], isTagValue: true});
        }
        str = bs[2];
    }
    if (str.length > 0) {
        if (str.includes(closeTag)) {
            throw new HeadStartError("Missing opening tag '" + openTag + "'!");
        }
        tokenSeq.push({value: str, isTagValue: false});
    }

    return tokenSeq;
}

function createBeginTag(tagName, conditional) {
    if (conditional) {
        return '{{' + tagName + '?}}';
    } else {
        return "{{" + tagName + "*}}";
    }
}

function createEndTag(tagName, conditional) {
    if (conditional) {
        return '{{/' + tagName + '?}}';
    } else {
        return "{{/" + tagName + "}}";
    }
}



module.exports = {
    createBeginTag,
    createEndTag,
    extractTagValue,
    getTokenSeq,
    splitBySeparator
};

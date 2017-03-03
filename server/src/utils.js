// ***************************************************************************************************** //
// Utility functions
// ***************************************************************************************************** //

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
    if (!str.includes(openTag)) {
        throw new Error("Missing opening tag '" + openTag + "'!");
    }
    if (!str.includes(closeTag)) {
        throw new Error("Missing closing tag '" + closeTag + "'!");
    }
    var pos1 = str.indexOf(openTag);
    var pos2 = str.indexOf(closeTag);
    if (pos1 > pos2) {
        throw new Error("Opening tag '" + openTag + "' must come before closing tag '" + closeTag + "'!");
    }

    var res = [];
    res.push(str.slice(0, pos1));
    res.push(str.slice(pos1 + openTag.length, pos2));
    res.push(str.slice(pos2 + closeTag.length));
    return res;
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
                throw new Error("Opening tag '" + openTag + "' must be followed by closing tag '" + closeTag + "' before next opening tag!");
            }
            tokenSeq.push({value: bs[1], isTagValue: true});
        }
        str = bs[2];
    }
    if (str.length > 0) {
        if (str.includes(closeTag)) {
            throw new Error("Missing opening tag '" + openTag + "'!");
        }
        tokenSeq.push({value: str, isTagValue: false});
    }

    return tokenSeq;
}

exports.splitBySeparator = splitBySeparator;
exports.extractTagValue = extractTagValue;
exports.getTokenSeq = getTokenSeq;

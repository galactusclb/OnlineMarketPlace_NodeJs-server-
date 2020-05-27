var Regex = require("regex");

module.exports = (escaped, char) => function (req, res, next) {
    unescapeCharacter(req.params, escaped, char);
    unescapeCharacter(req.query, escaped, char);
    unescapeCharacter(req.body, escaped, char);
    return next();
}

function unescapeCharacter (obj, escaped, char) {
    for (const key in obj) {
        // Replace the escaped version with the character
        obj[key] = obj[key].replace(new Regex(escaped, "g"), char);
    }
}
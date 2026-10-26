const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const Account = require("./schema/Account");
const secrets = require("./secrets.json");

/** @param {String} id */
const signToken = (id) => ({
    access: jwt.sign(
        { id: String(id), _r: randomUUID() },
        secrets.jwt,
        { algorithm: "HS256", expiresIn: "1d" }
    ),
});

const resolveUser = async (token) => {
    if (!token) return null;
    try {
        const payload = jwt.verify(token, secrets.jwt, { algorithms: ["HS256"] });
        return await Account.findById(payload.id);
    } catch (e) {
        if (e.name !== "TokenExpiredError" && e.name !== "JsonWebTokenError") console.error(e);
        return null;
    }
};

const checkAuth = async (req, res, next) => {
    req.user = await resolveUser(req.cookies?.Token);
    next();
};

const checkToken = async (token) => !!(await resolveUser(token));

const sanitize = (user) => {
    const obj = user.toObject();
    delete obj.password;
    delete obj.__v;
    return obj;
};

module.exports = { checkToken, signToken, sanitize, checkAuth };
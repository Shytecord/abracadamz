const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const argon = require("argon2");
const { checkAuth, sanitize, signToken } = require("../../utils");
const Account = require("../../schema/Account");

const PASSREGEX = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,64}$/;
const USERREGEX = /^[a-zA-Z0-9_]{3,16}$/;
const allowedFields = ["displayName"];

const router = Router();

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "too-many-requests" },
});

const COOKIE_OPTS = {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.post("/auth", limiter, async (req, res) => {
    try {
        const { username, password } = req.body ?? {};
        if (typeof username !== "string" || typeof password !== "string" || !username || !password)
            return res.status(400).json({ error: "auth/missing-credentials" });

        let user = await Account.findOne({ username: username.toLowerCase() });
        let status = 200;

        if (user) {
            if (!(await argon.verify(user.password, password)))
                return res.status(401).json({ error: "auth/invalid-credentials" });
        } else {
            if (!USERREGEX.test(username)) return res.status(400).json({ error: "auth/username-invalid" });
            if (!PASSREGEX.test(password)) return res.status(400).json({ error: "auth/password-weak" });

            user = await Account.create({
                username: username.toLowerCase(),
                displayName: username,
                password: await argon.hash(password),
                avatar: `https://api.dicebear.com/10.x/initials/png?seed=${username}`,
            });
            status = 201;
        }

        res.cookie("Token", signToken(user._id).access, COOKIE_OPTS);
        return res.status(status).json({ redirect: "/" });
    } catch (err) {
        if (err.code === 11000) {
            console.error("dup key:", err.keyPattern, err.keyValue);
            const field = Object.keys(err.keyPattern ?? {})[0];
            return field === "username"
                ? res.status(409).json({ error: "auth/username-exists" })
                : res.status(500).json({ error: "server/internal-error" });
        }
        console.error(err);
        return res.status(500).json({ error: "server/internal-error" });
    }
});

router.get("/signout", checkAuth, (req, res) => {
    if (!req.user) return res.status(401).json({ error: "api/unauthorized" });
    res.clearCookie("Token");
    res.redirect("/");
});

router.get("/me", checkAuth, (req, res) => {
    if (!req.user) return res.status(401).json({ error: "api/unauthorized" });
    res.json({ user: sanitize(req.user) });
});

router.put("/modifyUser", checkAuth, async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "api/unauthorized" });

    const update = {};
    for (const key of allowedFields) {
        const value = req.body?.[key];
        if (value === undefined) continue;
        if (typeof value !== "string" || !value.trim() || value.length > 32)
            return res.status(400).json({ error: `api/${key}-invalid` });
        update[key] = value.trim();
    }
    if (!Object.keys(update).length) return res.status(400).json({ error: "api/nothing-to-update" });

    try {
        await Account.findByIdAndUpdate(req.user._id, update);
        res.json({});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "server/internal-error" });
    }
});

module.exports = router;
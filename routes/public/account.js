const { Router } = require("express");
const { checkAuth } = require("../../utils");

const router = Router();

router.get("/", checkAuth, (req, res) => {
    if (!req.user) return res.redirect("/account/signin");

    res.render("account/index", {
        user: req.user
    });
});

router.get("/signin", (req, res) => {
    res.render("account/signin");
});

module.exports = router;
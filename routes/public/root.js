const { Router } = require("express");

const router = Router();

router.get("/", (req, res) => {
    res.render("index");
});

router.get("/shyte", (req, res) => {
    res.render("construction");
});

router.get("/projects", (req, res) => {
    res.render("construction");
});

router.get("/contact", (req, res) => {
    res.render("construction");
});

module.exports = router;
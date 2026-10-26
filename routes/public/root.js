const { Router } = require("express");

const router = Router();

router.use("/account", require("./account"));
router.use("/woh", require("./woh"));

router.get("/", (req, res) => {
    const projects = [
        { 
            name: "Wheel Of Hell", 
            url: "/woh", 
            thumb: "/assets/woh.png",
            blurb: "Nightmares of R6", 
            tags: ["Games"]
        },
    ];

    res.render("index", { projects });
});

router.get("/shyte", (req, res) => {
    res.render("construction");
});

router.get("/projects", (req, res) => {
    res.render("construction");
});

router.get("/contact", (req, res) => {
    res.render("contact");
});

module.exports = router;
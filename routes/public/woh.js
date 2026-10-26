const { Router } = require("express");

const router = Router();

router.get("/", (req, res) => {
    res.render("construction");
});

module.exports = router;
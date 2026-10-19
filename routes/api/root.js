const { Router } = require("express");
const axios = require("axios");

const config = require("../../config.json");
const secrets = require("../../secrets.json");

const router = Router();

router.get("/youtube/latest", async (req, res) => {
    const areq = await axios.get("https://www.googleapis.com/youtube/v3/search", {
        params: {
            part: "snippet",
            channelId: config.channelId,
            maxResults: 1,
            order: "date",
            type: "video",
            key: secrets.google.apiKey
        },
        validateStatus: (status) => true
    });

    if (areq.status !== 200) {
        return res.status(200).json({ id: "5wf0ylNt0BY" })
    };

    res.status(200).json({ id: areq.data.items[0].id.videoId });
});

module.exports = router;
const { Router } = require("express");
const axios = require("axios");
const nm = require("nodemailer");
const validator = require("validator");
const rateLimit = require("express-rate-limit");

const config = require("../../config.json");
const secrets = require("../../secrets.json");

const router = Router();

router.use("/account", require("./account"));

const parseDuration = (iso) => {
    const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || "");
    if (!m) return 0;
    return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
}

const FALLBACK_ID = "5wf0ylNt0BY";
const cache = new Map();

const cached = async (key, ttlMs, fn) => {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < ttlMs) return hit.value;
    try {
        const value = await fn();
        cache.set(key, { at: Date.now(), value });
        return value;
    } catch (err) {
        if (hit) return hit.value;
        throw err;
    }
}

const yt = async (endpoint, params) => {
    const r = await axios.get(`https://www.googleapis.com/youtube/v3/${endpoint}`, {
        params: { ...params, key: secrets.google.apiKey },
        validateStatus: () => true
    });
    if (r.status !== 200) {
        const e = r.data?.error;
        console.error(`[youtube] ${endpoint} -> ${r.status}`, e?.errors?.[0]?.reason, e?.message);
        throw new Error(`youtube-${r.status}`);
    }
    return r.data;
}

router.get("/youtube/latest", async (req, res) => {
    try {
        const id = await cached("latest", 10 * 60 * 1000, async () => {
            const playlist = await yt("playlistItems", {
                part: "contentDetails",
                playlistId: "UU" + config.channelId.slice(2),
                maxResults: 20
            });
            const ids = (playlist.items || []).map(i => i.contentDetails.videoId);
            if (!ids.length) throw new Error("no-videos");

            const details = await yt("videos", {
                part: "contentDetails,liveStreamingDetails",
                id: ids.join(",")
            });
            const byId = new Map(details.items.map(v => [v.id, v]));

            const latest = ids.find(vid => {
                const v = byId.get(vid);
                if (!v) return false;
                if (v.liveStreamingDetails) return false;
                return parseDuration(v.contentDetails.duration) >= 181;
            });
            if (!latest) throw new Error("no-matching-videos");
            return latest;
        });
        res.json({ id });
    } catch {
        res.json({ id: FALLBACK_ID });
    }
});

router.get("/youtube/best", async (req, res) => {
    try {
        const id = await cached("best", 24 * 60 * 60 * 1000, async () => {
            const search = await yt("search", {
                part: "snippet",
                channelId: config.channelId,
                maxResults: 50,
                order: "viewCount",
                type: "video"
            });
            const ids = (search.items || []).map(i => i.id.videoId);
            if (!ids.length) throw new Error("no-videos");

            const details = await yt("videos", {
                part: "contentDetails",
                id: ids.join(",")
            });
            const durations = new Map(
                details.items.map(v => [v.id, parseDuration(v.contentDetails.duration)])
            );
            const best = ids.find(i => (durations.get(i) || 0) >= 181);
            if (!best) throw new Error("no-long-videos");
            return best;
        });
        res.json({ id });
    } catch {
        res.json({ id: FALLBACK_ID });
    }
});

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "too-many-requests" },
});

const LIMITS = { name: 100, email: 254, message: 5000 };

const cleanSingleLine = (str) => {
    return str
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/<[^>]*>/g, "")
        .trim();
}

const cleanMultiLine = (str) => {
    return str
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        .replace(/<[^>]*>/g, "")
        .trim();
}

router.post("/submit/contact", contactLimiter, (req, res) => {
    const { name: rawName, email: rawEmail, message: rawMessage } = req.body || {};

    if (typeof rawName !== "string" || !rawName.trim()) return res.status(400).json({ error: "missing-name" });
    if (typeof rawEmail !== "string" || !rawEmail.trim()) return res.status(400).json({ error: "missing-email" });
    if (typeof rawMessage !== "string" || !rawMessage.trim()) return res.status(400).json({ error: "missing-message" });

    if (rawName.length > LIMITS.name) return res.status(400).json({ error: "name-too-long" });
    if (rawEmail.length > LIMITS.email) return res.status(400).json({ error: "email-too-long" });
    if (rawMessage.length > LIMITS.message) return res.status(400).json({ error: "message-too-long" });

    const name = cleanSingleLine(rawName);
    const email = rawEmail.trim();
    const message = cleanMultiLine(rawMessage);

    if (!name) return res.status(400).json({ error: "invalid-name" });
    if (!message) return res.status(400).json({ error: "invalid-message" });

    if (!validator.isEmail(email)) return res.status(400).json({ error: "invalid-email" });

    const transporter = nm.createTransport({
        host: "smtp.zoho.com",
        auth: {
            user: config.email.contact,
            pass: secrets.email.contact,
        },
        port: 465,
        secure: true,
        requireTLS: true,
    });

    const mailOptions = {
        from: "contact@abracadamz.shop",
        to: "adam@abracadamz.shop",
        replyTo: email,
        subject: `Contact Form Submission (${name})`,
        text: `${message}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: "email-error" });
        }

        res.status(200).json({});
    });
});

module.exports = router;
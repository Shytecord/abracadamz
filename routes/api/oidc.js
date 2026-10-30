const { Router, urlencoded } = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { checkAuth } = require("../../utils");
const Account = require("../../schema/Account");
const fs = require("fs");

const config = require("../../config.json");
const secrets = require("../../secrets.json");
const path = require("path");

const ISSUER = config.oidc.issuer;
const KEY = crypto.createPrivateKey(fs.readFileSync(path.join(__dirname, "../../keys/oidc.pem")));
const PUB = crypto.createPublicKey(KEY);
const KID = crypto.createHash("sha256").update(PUB.export({ type: "spki", format: "der" })).digest("base64url").slice(0, 16);

const CLIENTS = {
    "woh-oidc": { redirectUris: ["http://127.0.0.1:53682/callback"] },
};

const codes = new Map();

const router = Router();

router.get("/userinfo", checkAuth, async (req, res) => {
    if (!req.user) return res.status(401).set("WWW-Authenticate", "Bearer").end();
    res.json({
        sub: String(req.user._id),
        preferred_username: req.user.username,
        name: req.user.displayName,
        picture: req.user.avatar
    });
});

router.get("/.well-known/openid-configuration", (req, res) => res.json({
    issuer: ISSUER,
    authorization_endpoint: `${ISSUER}/authorize`,
    token_endpoint: `${ISSUER}/token`,
    userinfo_endpoint: `${ISSUER}/userinfo`,
    jwks_uri: `${ISSUER}/jwks.json`,
    response_types_supported: ["code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    code_challenge_methods_supported: ["S256"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["openid", "profile"],
}));

router.get("/jwks.json", (req, res) => {
    res.json({ keys: [{ ...PUB.export({ format: "jwk" }), kid: KID, use: "sig", alg: "RS256" }] });
});

router.get("/authorize", checkAuth, (req, res) => {
    const { client_id, redirect_uri, response_type, code_challenge, code_challenge_method, state, nonce } = req.query;

    const client = CLIENTS[client_id];
    if (!client || !client.redirectUris.includes(redirect_uri))
        return res.status(400).send("invalid client or redirect_uri");

    const back = (params) => {
        const u = new URL(redirect_uri);
        for (const [k, v] of Object.entries({ ...params, state })) if (v) u.searchParams.set(k, v);
        return res.redirect(u.toString());
    };

    if (response_type !== "code") return back({ error: "unsupported_response_type" });
    if (!code_challenge || code_challenge_method !== "S256") return back({ error: "invalid_request" });

    if (!req.user) return res.redirect(`/account/signin?returnTo=${encodeURIComponent(req.originalUrl)}`);

    const code = crypto.randomBytes(32).toString("base64url");
    codes.set(code, {
        userId: req.user._id, clientId: client_id, redirectUri: redirect_uri,
        challenge: code_challenge, nonce, exp: Date.now() + 60_000,
    });
    back({ code });
});

router.post("/token", urlencoded({ extended: false }), async (req, res) => {
    res.set("Cache-Control", "no-store");
    const { grant_type, code, redirect_uri, client_id, code_verifier } = req.body ?? {};
    const bad = (error) => res.status(400).json({ error });

    if (grant_type !== "authorization_code") return bad("unsupported_grant_type");

    const c = codes.get(code);
    codes.delete(code);
    if (!c || c.exp < Date.now() || c.clientId !== client_id || c.redirectUri !== redirect_uri)
        return bad("invalid_grant");

    const challenge = crypto.createHash("sha256").update(code_verifier ?? "").digest("base64url");
    if (challenge !== c.challenge) return bad("invalid_grant");

    const user = await Account.findById(c.userId);
    const id_token = jwt.sign(
        { nonce: c.nonce, preferred_username: user.username, name: user.displayName, picture: user.avatar },
        KEY,
        { algorithm: "RS256", keyid: KID, issuer: ISSUER, audience: client_id, subject: String(user._id), expiresIn: "1h" }
    );

    res.json({ token_type: "Bearer", id_token /*, access_token, refresh_token */ });
});

module.exports = router;
const mongoose = require("mongoose");

const OIDCSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    redirectUris: {
        type: [String],
        required: true,
        default: ["http://localhost:8000/callback"]
    },
    scopes: {
        type: [String],
        required: true,
        default: ["openid", "profile"]
    },
    grantTypes: {
        type: [String],
        required: true,
        default: ["authorization_code", "refresh_token"]
    }
}, { timestamps: true });

module.exports = mongoose.model("OIDC", OIDCSchema);
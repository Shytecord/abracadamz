const mongoose = require("mongoose");

const IntegrationSchema = new mongoose.Schema({
    providerName: {
        type: String,
        enum: ["discord"],
        default: "discord"
    },
    providerId: {
        type: String,
        required: true
    }
});

const AccountSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    displayName: { type: String },
    avatar: { type: String },
    roles: {
        type: Number,
        default: 2
    },
    status: {
        type: String,
        enum: ["normal", "disabled", "banned"],
        default: "normal"
    },
    integrations: {
        type: [IntegrationSchema]
    }
}, { timestamps: true });

module.exports = mongoose.model("Account", AccountSchema);
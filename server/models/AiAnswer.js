const mongoose = require("mongoose");

const aiAnswerSchema = new mongoose.Schema(
    {
        post_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
        },
        ai_answer: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: {
            createdAt: "crdAt",
            updatedAt: "upAt",
        },
    }
);

const AiAnswer = mongoose.model("AiAnswer", aiAnswerSchema);

module.exports = AiAnswer;

const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        post_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
        },
        is_sensitive: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: {
            createdAt: "crdAt",
            updatedAt: "upAt",
        },
    }
);

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;

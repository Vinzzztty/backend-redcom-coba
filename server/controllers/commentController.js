const Comment = require("../models/Comment");
const axios = require("axios");

// Create a new comment
exports.createComment = async (req, res) => {
    try {
        const { text, postId, userId } = req.body;

        // Sentiment analysis with Flask API
        let sentimentLabel;
        try {
            const response = await axios.post(process.env.PREDICT_API, {
                text: text,
            });

            if (response.status !== 200) {
                throw new Error("Failed to analyze sentiment");
            }

            sentimentLabel = response.data.data.label; // Extract the label from the response
        } catch (apiError) {
            return res.status(500).json({
                status: "error",
                message: "Failed to analyze sentiment",
            });
        }

        // Determine is_sensitive based on sentiment label
        const isSensitive = sentimentLabel === "negative";

        const comment = new Comment({
            text,
            post_id: postId,
            user_id: userId,
            is_sensitive: isSensitive,
        });

        await comment.save();
        res.status(201).json({
            status: "success",
            message: "Comment created successfully",
            comment,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An unexpected error occurred",
        });
    }
};

/**
 * GET
 * All Comments
 */

exports.showAllComments = async (req, res) => {
    try {
        const comments = await Comment.find();

        res.status(200).json({
            status: "success",
            data: comments,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An unexpected error occurred",
        });
    }
};

/**
 * GET
 * Specific Comment by Id
 */

exports.getCommentById = async (req, res) => {
    try {
        const commentId = req.params.id;

        // Find Specific Comment by Id
        const comment = await Comment.findById(commentId);

        res.status(200).json({
            status: "success",
            data: comment,
        });
    } catch (error) {
        res.status(404).json({
            status: "error",
            message: "Comment id not found" || error.message,
        });
    }
};

/**
 * PUT
 * Edit Specific Comment
 */
exports.editComment = async (req, res) => {
    try {
        const commentId = req.params.id;
        const { text } = req.body;

        // Find the comment by Id and update the fields
        const updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            { text },
            { new: true }
        );

        res.status(200).json({
            status: "success",
            data: updatedComment,
        });
    } catch (error) {
        res.status(404).json({
            status: "error",
            message: "Comment id not found" || error.message,
        });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const commentId = req.params.id;

        // Delete the comment from the database
        await Comment.findByIdAndDelete(commentId);

        res.status(200).json({
            status: "success",
            message: "Comment deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An unexpected error occurred",
        });
    }
};

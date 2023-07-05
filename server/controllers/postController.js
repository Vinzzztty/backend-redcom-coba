const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Kategori = require("../models/Kategori");
const Report = require("../models/Report");
const User = require("../models/User");

const { formatDate, formatTime } = require("../utils/formattedDate");

// Create new Post
exports.createPost = async (req, res) => {
    try {
        const { content, kategoriId, userId } = req.body;

        const userExists = await User.exists({ _id: userId });

        if (!userExists) {
            return res.status(404).json({
                status: "error",
                message: "User not found",
            });
        }

        const kategoriExists = await Kategori.exists({ _id: kategoriId });

        if (!kategoriExists) {
            return res.status(404).json({
                status: "error",
                message: "Kategori not found",
            });
        }

        const post = new Post({
            content,
            kategori_id: kategoriId,
            user_id: userId,
        });
        await post.save();
        res.status(201).json({
            status: "success",
            message: post,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An unexpected error occurred",
        });
    }
};

// GET All Posts Data
exports.getPosts = async (req, res) => {
    try {
        const posts = await Post.find();

        res.status(200).json({
            status: "success",
            data: posts,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An unexpected error occurred",
        });
    }
};

// GET Specific Post
exports.getSpecificPost = async (req, res, next) => {
    try {
        const postId = req.params.id;

        // Find Specific Post by Id
        const posts = await Post.findOne({ _id: postId })
            .populate("user_id")
            .populate("kategori_id")
            .exec();

        if (!posts) {
            return res.status(404).json({
                status: "error",
                message: "Post not found",
            });
        }

        const formattedPosts = () => {
            const date_created = formatDate(posts.crdAt);
            const time = formatTime(posts.crdAt);

            return {
                _id: posts._id,
                content: posts.content,
                kategori_id: posts.kategori_id,
                user_id: posts.user_id,
                date_created: date_created,
                time: time,
            };
        };

        res.status(200).json({
            status: "success",
            data: formattedPosts(),
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
};

// PUT Edit post
exports.editPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const { content, kategoriId } = req.body;

        // Find the post by Id and Update the fields
        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { content, kategori_id: kategoriId },
            { new: true }
        );

        res.status(200).json({
            status: "success",
            data: updatedPost,
        });
    } catch (error) {
        res.status(500).json({
            status: "successs",
            message: "An unexpected error occurred" || error.message,
        });
    }
};

// Delete a post by ID
exports.deletePost = async (req, res) => {
    try {
        const postId = req.params.id;

        // Delete the post from the database
        await Post.findByIdAndDelete(postId);

        // Delete the comments associated with the post
        await Comment.deleteMany({ post_id: postId });

        // Delete the reports associated with the post
        await Report.deleteOne({ post_id: postId });

        res.status(200).json({
            status: "success",
            message: "Post and associated data deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An unexpected error occurred" || error.message,
        });
    }
};

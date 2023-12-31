const Post = require("../models/Post");
const User = require("../models/User");
const Report = require("../models/Report");
const Kategori = require("../models/Kategori");
const Comment = require("../models/Comment");
const { verifyAccessToken } = require("../middleware/jwt_helper");
const { formatDate, formatTime } = require("../utils/formattedDate");

exports.getCountUserAndPost = async (req, res) => {
    try {
        const countUsers = await User.countDocuments({ is_admin: { $ne: 1 } });
        const countPosts = await Post.countDocuments();

        res.status(200).json({
            status: "success",
            data: { countUsers, countPosts },
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
};

exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().select("_id");

        res.status(200).json({
            status: "success",
            data: posts,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
};

exports.getAllReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate("user_id")
            .sort({ crdAt: -1 });

        res.status(200).json({
            status: "success",
            data: reports,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const postId = req.params.id;

        // Delete the post from the databse
        await Post.findByIdAndDelete(postId);

        await Report.deleteOne({ post_id: postId });

        res.status(200).json({
            status: "success",
            message: "Post deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const reportId = req.params.id;

        await Report.findByIdAndDelete(reportId);

        res.status(200).json({
            status: "success",
            message: "Report deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
};

const Post = require("../models/Post");
const User = require("../models/User");
const Kategori = require("../models/Kategori");
const Comment = require("../models/Comment");
const AiAnswer = require("../models/AiAnswer");
const { verifyAccessToken } = require("../middleware/jwt_helper");
const { formatDate, formatTime } = require("../utils/formattedDate");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.home = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate("user_id")
            .populate("kategori_id")
            .sort({ crdAt: -1 });

        if (!posts) {
            return res.status(404).json({
                status: "error",
                message: "Post Not Found",
            });
        }

        const formattedPosts = await Promise.all(
            posts.map(async (post) => {
                const formattedCreatedAtDate = formatDate(post.crdAt);
                const formattedCreatedAtTime = formatTime(post.crdAt);

                // Count the total comments for each post
                const totalComments = await Comment.countDocuments({
                    post_id: post._id,
                });

                return {
                    _id: post._id,
                    content: post.content,
                    kategori_id: post.kategori_id,
                    user_id: post.user_id,
                    total_comments: totalComments,
                    date_created: formattedCreatedAtDate,
                    time: formattedCreatedAtTime,
                };
            })
        );

        res.status(200).json({
            status: "success",
            data: formattedPosts,
        });
    } catch (error) {
        res.status(500).json({
            error: error,
            message: "An unexpected error occurred",
        });
    }
};

exports.tes = async (req, res) => {
    try {
        res.status(200).json({
            message: "Masuk",
        });
    } catch (error) {
        res.status(500).json({
            error: error,
            message: "An unexpected error occurred",
        });
    }
};

/**
 * Search Post Data
 */
exports.search = async (req, res) => {
    try {
        let searchPost = req.query.searchPost;
        const searchNoSpecialChar = searchPost.replace(/[^a-zA-Z0-9 ]/g, "");

        const posts = await Post.find({
            $or: [
                { content: { $regex: new RegExp(searchNoSpecialChar, "i") } },
            ],
        })
            .populate("user_id")
            .populate("kategori_id")
            .sort({ crdAt: -1 });

        if (posts.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Post Not Found",
            });
        }

        const formattedPosts = await Promise.all(
            posts.map(async (post) => {
                const formattedCreatedAtDate = formatDate(post.crdAt);
                const formattedCreatedAtTime = formatTime(post.crdAt);

                // Count the total comments for each post
                const totalComments = await Comment.countDocuments({
                    post_id: post._id,
                });

                return {
                    _id: post._id,
                    content: post.content,
                    kategori_id: post.kategori_id,
                    user_id: post.user_id,
                    total_comments: totalComments,
                    date_created: formattedCreatedAtDate,
                    time: formattedCreatedAtTime,
                };
            })
        );

        // res.render("search", { post });
        res.status(200).json({
            status: "Success",
            data: formattedPosts,
        });
        return;
    } catch (error) {
        res.status(500).json({
            error: error,
            message: "An unexpected error occurred",
        });
    }
};

/**
 * POST New Post
 */
exports.createPost = async (req, res) => {
    try {
        verifyAccessToken(req, res, async (err) => {
            if (err) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            const { content, kategoriId } = req.body;

            const userId = req.payload.aud;

            const user = await User.findOne({ _id: userId });

            if (!user) {
                return res.status(404).json({
                    status: "error",
                    message: "user not found",
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
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An unexpected error occurred",
        });
    }
};

exports.createComment = async (req, res) => {
    try {
        verifyAccessToken(req, res, async (err) => {
            if (err) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            const { text, postId, userId } = req.body;

            const user = await User.findOne({ _id: userId });

            if (!user) {
                return res.status(404).json({
                    status: "error",
                    message: "user not found",
                });
            }

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
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An unexpected error occurred",
        });
    }
};

exports.sortByKategori = async (req, res) => {
    try {
        const kategoriPost = req.query.kategoriPost;

        // Find the kategori by name
        const kategori = await Kategori.findOne({
            kategori: kategoriPost,
        });

        // If kategori is not found, return an error response
        if (!kategori) {
            return res.status(404).json({
                status: "error",
                message: "Kategori not found",
            });
        }

        // Find all posts with the given kategori_id
        const posts = await Post.find({ kategori_id: kategori._id })
            .populate("user_id")
            .populate("kategori_id")
            .sort({ crdAt: -1 })
            .exec();

        // If no posts are found, return an error response
        if (posts.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Not Post with this Kategori",
            });
        }

        const formattedPosts = await Promise.all(
            posts.map(async (post) => {
                const formattedCreatedAtDate = formatDate(post.crdAt);
                const formattedCreatedAtTime = formatTime(post.crdAt);

                // Count total comments for each post
                const totalComments = await Comment.countDocuments({
                    post_id: post._id,
                });

                return {
                    _id: post._id,
                    content: post.content,
                    kategori_id: post.kategori_id,
                    user_id: post.user_id,
                    total_comments: totalComments,
                    date_created: formattedCreatedAtDate,
                    time: formattedCreatedAtTime,
                };
            })
        );

        // Return the sorted posts as the response
        res.status(200).json({
            status: "success",
            data: formattedPosts,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An unexpected error occurred" + error.message,
        });
    }
};

exports.getCommentByIdPost = async (req, res) => {
    try {
        const postId = req.query.postId;

        // Find Specific Comment by Post Id and populate user and post
        const comments = await Comment.find({ post_id: postId })
            .populate({
                path: "user_id",
                select: "username",
            })
            .populate("user_id");

        const transformedComments = comments.map((comment) => {
            return {
                _id: comment._id,
                text: comment.text,
                username: comment.user_id.username,
                is_admin: comment.user_id.is_admin,
                is_sensitive: comment.is_sensitive,
            };
        });

        res.status(200).json({
            status: "success",
            data: transformedComments,
        });
    } catch (error) {
        res.status(404).json({
            status: "error",
            message: "Comment id not found" || error.message,
        });
    }
};

exports.getAllAiAnswer = async (req, res) => {
    try {
        const aiAnswer = await AiAnswer.find().populate("post_id");

        res.status(200).json({
            status: "success",
            data: aiAnswer,
        });
    } catch (error) {
        res.status(404).json({
            status: "error",
            message: error.message,
        });
    }
};

exports.generateAiAnswer = async (req, res) => {
    try {
        verifyAccessToken(req, res, async (err) => {
            if (err) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const { postId } = req.body;

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

            // Make comment using generate Gemini
            const googleAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const geminiConfig = {
                temperature: 0,
                topP: 1,
                topK: 1,
                maxOutputTokens: 500,
            };

            const geminiModel = googleAI.getGenerativeModel({
                model: "gemini-pro",
                geminiConfig,
            });

            const generateText = async () => {
                try {
                    const prompt = `${posts.content} answer with maximum 100 word`;
                    const result = await geminiModel.generateContent(prompt);

                    let response =
                        result.response.candidates[0].content.parts[0].text;

                    // Remove unwanted formatting and join lines using regex
                    response = response
                        .replace(/(\*\*|\*|_|\n)/g, " ")
                        .replace(/\s+/g, " ")
                        .trim();
                    return response;
                } catch (error) {
                    throw new Error("Can't generate gemini: " + error.message);
                }
            };

            const ai_answer = await generateText();

            const formattedReturn = {
                post_id: posts._id,
                content: posts.content,
                ai_answer: ai_answer,
            };

            const aiAnswer = new AiAnswer({
                post_id: postId,
                ai_answer: ai_answer,
            });

            await aiAnswer.save();

            res.status(200).json({
                status: "success",
                data: formattedReturn,
            });
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "An unexpected error occurred" || error.message,
        });
    }
};

exports.getSpecificAiAnswer = async (req, res) => {
    try {
        const aiAnswerid = req.params.id;

        const aiAnswer = await AiAnswer.findOne({ _id: aiAnswerid })
            .populate("post_id")
            .exec();

        if (!aiAnswer) {
            return res.status(404).json({
                status: "error",
                message: "Ai Answer not found",
            });
        }

        const formattedAiAnswer = () => {
            const date_created = formatDate(aiAnswer.crdAt);
            const time = formatTime(aiAnswer.crdAt);

            return {
                _id: aiAnswer._id,
                post_id: aiAnswer.post_id._id,
                content: aiAnswer.post_id.content,
                ai_answer: aiAnswer.ai_answer,
                date_created: date_created,
                time: time,
            };
        };

        res.status(200).json({
            status: "success",
            data: formattedAiAnswer(),
        });
    } catch (error) {
        res.status(404).json({
            status: "error",
            message: "Comment id not found" || error.message,
        });
    }
};

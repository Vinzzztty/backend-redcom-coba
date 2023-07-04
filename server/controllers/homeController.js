const Posts = require("../models/Post");

module.exports = {
    home: async (req, res) => {
        try {
            const post = await Posts.find().populate("user");
            res.render("home", { post });
            console.log(post);
        } catch (err) {}
    },
};

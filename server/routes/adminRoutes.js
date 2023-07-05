const router = require("express").Router();

const adminControllers = require("../controllers/adminController");

router.get("/dashboard", adminControllers.getCountUserAndPost);

router.get("/reportPosts", adminControllers.getAllPosts);

module.exports = router;

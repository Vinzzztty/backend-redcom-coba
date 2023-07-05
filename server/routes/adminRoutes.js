const router = require("express").Router();

const adminControllers = require("../controllers/adminController");

router.get("/dashboard", adminControllers.getCountUserAndPost);

module.exports = router;

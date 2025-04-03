const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

/* GET */
router.get("/endpoint", authController.getRestAPIEndpoint);

module.exports = router;

const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');

/* GET */
router.get('/', clientController.homepage);

module.exports = router;
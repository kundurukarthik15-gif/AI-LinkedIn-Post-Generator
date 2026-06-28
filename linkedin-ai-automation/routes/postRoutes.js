/**
 * API routes for LinkedIn automation workflow.
 */
const express = require('express');
const upload = require('../middleware/upload');
const postController = require('../controllers/postController');

const router = express.Router();

router.get('/health', postController.healthCheck);
router.get('/linkedin/status', postController.linkedInStatus);

router.post('/generate-post', postController.generatePost);
router.post('/upload-image', upload.single('image'), postController.uploadImage);
router.post('/preview-post', postController.previewPost);
router.post('/publish-post', postController.publishPost);

module.exports = router;

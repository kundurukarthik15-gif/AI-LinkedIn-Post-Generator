/**
 * Post controller — handles generate, upload, preview, and publish flow.
 * Safety: publish only runs when confirmed === true.
 */
const { generateLinkedInPost } = require('../services/aiPostService');
const { uploadImageFromPath } = require('../services/cloudinaryService');
const { publishToLinkedIn, getLinkedInStatus } = require('../services/linkedinService');
const { saveDraft, getDraft, markPublished } = require('../services/draftStore');

/**
 * POST /api/generate-post
 * Body: { achievement?, project?, certificate?, event? }
 */
async function generatePost(req, res, next) {
  try {
    const { achievement, project, certificate, event } = req.body;
    const generated = await generateLinkedInPost({
      achievement,
      project,
      certificate,
      event,
    });

    res.json({
      success: true,
      message: 'LinkedIn post generated successfully.',
      data: generated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/upload-image
 * Multipart form field: image
 */
async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided. Use field name "image".',
      });
    }

    const uploaded = await uploadImageFromPath(req.file.path);

    res.json({
      success: true,
      message: 'Image uploaded to Cloudinary.',
      data: uploaded,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/preview-post
 * Body: { content, hashtags, imageUrl?, formattedPost?, input? }
 * Returns preview + draftId for confirmation step.
 */
async function previewPost(req, res, next) {
  try {
    const { content, hashtags, imageUrl, formattedPost, input } = req.body;

    if (!content || !Array.isArray(hashtags)) {
      return res.status(400).json({
        success: false,
        message: 'content (string) and hashtags (array) are required.',
      });
    }

    const hashtagLine = hashtags.join(' ');
    const fullText = formattedPost || `${content}\n\n${hashtagLine}`.trim();

    const preview = {
      content,
      hashtags,
      imageUrl: imageUrl || null,
      formattedPost: fullText,
      characterCount: fullText.length,
      hasImage: Boolean(imageUrl),
    };

    const draftId = saveDraft({
      ...preview,
      input: input || null,
    });

    res.json({
      success: true,
      message: 'Preview ready. Review below, then confirm to publish.',
      draftId,
      preview,
      confirmationRequired: true,
      confirmationPrompt: 'Do you want to publish this post to LinkedIn?',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/publish-post
 * Body: { draftId, confirmed: true }
 * Will NOT publish unless confirmed is explicitly true.
 */
async function publishPost(req, res, next) {
  try {
    const { draftId, confirmed } = req.body;

    if (!draftId) {
      return res.status(400).json({
        success: false,
        message: 'draftId is required. Create a preview first.',
      });
    }

    if (confirmed !== true) {
      return res.status(400).json({
        success: false,
        message:
          'Publishing blocked: confirmation required. Set confirmed: true only after user approval.',
        confirmationRequired: true,
      });
    }

    const draft = getDraft(draftId);
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found or expired. Please generate a new preview.',
      });
    }

    if (draft.status === 'published') {
      return res.status(409).json({
        success: false,
        message: 'This draft was already published.',
      });
    }

    const publishResult = await publishToLinkedIn(draft);
    markPublished(draftId, publishResult);

    res.json({
      success: true,
      message: 'Post published to LinkedIn successfully.',
      draftId,
      publishResult,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/linkedin/status
 */
async function linkedInStatus(_req, res, next) {
  try {
    const data = await getLinkedInStatus();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/health
 */
function healthCheck(_req, res) {
  const { config } = require('../config/env');
  res.json({
    success: true,
    message: 'LinkedIn AI Automation API is running.',
    aiProvider: config.ai.provider,
    workflow: ['generate', 'upload-image (optional)', 'preview', 'confirm', 'publish'],
  });
}

module.exports = {
  generatePost,
  uploadImage,
  previewPost,
  publishPost,
  linkedInStatus,
  healthCheck,
};

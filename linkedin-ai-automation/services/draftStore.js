/**
 * In-memory store for post drafts between preview and publish.
 * In production you would use Redis or a database.
 */
const { v4: uuidv4 } = require('uuid');

const drafts = new Map();

const DRAFT_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Save a draft and return its ID.
 */
function saveDraft(draft) {
  const draftId = uuidv4();
  drafts.set(draftId, {
    ...draft,
    draftId,
    createdAt: Date.now(),
    status: 'preview',
  });
  return draftId;
}

/**
 * Get a draft by ID or null if missing/expired.
 */
function getDraft(draftId) {
  const draft = drafts.get(draftId);
  if (!draft) return null;

  if (Date.now() - draft.createdAt > DRAFT_TTL_MS) {
    drafts.delete(draftId);
    return null;
  }

  return draft;
}

/**
 * Mark draft as published after successful LinkedIn post.
 */
function markPublished(draftId, publishResult) {
  const draft = drafts.get(draftId);
  if (!draft) return null;

  const updated = {
    ...draft,
    status: 'published',
    publishedAt: Date.now(),
    publishResult,
  };
  drafts.set(draftId, updated);
  return updated;
}

module.exports = {
  saveDraft,
  getDraft,
  markPublished,
};

/**
 * Frontend for LinkedIn AI Automation — preview-first workflow.
 */
const state = {
  generated: null,
  imageUrl: null,
  draftId: null,
};

const $ = (id) => document.getElementById(id);

async function loadLinkedInMode() {
  const el = $('linkedin-mode');
  if (!el) return;
  try {
    const res = await fetch('/api/linkedin/status');
    const json = await res.json();
    const data = json.data || {};
    if (data.mode === 'mock') {
      el.textContent = 'Test mode — posts are not sent to LinkedIn';
      el.className = 'mode-badge mock';
    } else if (data.mode === 'composio') {
      el.textContent = 'Live — posts publish to your LinkedIn via Composio';
      el.className = 'mode-badge';
    } else {
      el.textContent = data.message || 'LinkedIn not configured';
      el.className = 'mode-badge error';
    }
  } catch {
    el.textContent = 'Could not load LinkedIn status';
    el.className = 'mode-badge error';
  }
}

loadLinkedInMode();

function setStatus(message, type = '') {
  const el = $('status');
  el.textContent = message;
  el.className = `status ${type}`.trim();
}

function getInputPayload() {
  return {
    achievement: $('achievement').value.trim(),
    project: $('project').value.trim(),
    certificate: $('certificate').value.trim(),
    event: $('event').value.trim(),
  };
}

async function uploadImageIfSelected() {
  const fileInput = $('image');
  if (!fileInput.files || !fileInput.files[0]) return null;

  const formData = new FormData();
  formData.append('image', fileInput.files[0]);

  const res = await fetch('/api/upload-image', {
    method: 'POST',
    body: formData,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Image upload failed');
  return json.data.url;
}

async function generatePost() {
  const payload = getInputPayload();
  if (!payload.achievement && !payload.project && !payload.certificate && !payload.event) {
    setStatus('Enter at least one field (achievement, project, certificate, or event).', 'error');
    return;
  }

  $('generate-btn').disabled = true;
  setStatus('Generating post with OpenAI...');

  try {
    const imageUrl = await uploadImageIfSelected();
    state.imageUrl = imageUrl;

    const res = await fetch('/api/generate-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Generation failed');

    state.generated = json.data;
    await createPreview();
    setStatus('Post generated. Review the preview before publishing.', 'success');
  } catch (err) {
    setStatus(err.message, 'error');
  } finally {
    $('generate-btn').disabled = false;
  }
}

async function createPreview() {
  const { content, hashtags, formattedPost, input } = state.generated;

  const res = await fetch('/api/preview-post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      hashtags,
      formattedPost,
      imageUrl: state.imageUrl,
      input,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Preview failed');

  state.draftId = json.draftId;
  showPreview(json.preview);
}

function showPreview(preview) {
  $('preview-content').textContent = preview.formattedPost;
  $('preview-hashtags').textContent = preview.hashtags.join(' ');
  $('preview-meta').textContent = `${preview.characterCount} characters · ${
    preview.hasImage ? 'Image attached' : 'No image'
  }`;

  const imageBox = $('image-preview');
  if (preview.imageUrl) {
    imageBox.innerHTML = `<img src="${preview.imageUrl}" alt="Post preview" />`;
    imageBox.classList.remove('hidden');
  } else {
    imageBox.innerHTML = '';
    imageBox.classList.add('hidden');
  }

  $('preview-section').classList.remove('hidden');
  $('result-section').classList.add('hidden');
}

async function publish(confirmed) {
  if (!state.draftId) {
    setStatus('No draft to publish. Generate a preview first.', 'error');
    return;
  }

  $('confirm-publish').disabled = true;
  setStatus('Publishing to LinkedIn...');

  try {
    const res = await fetch('/api/publish-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draftId: state.draftId, confirmed }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Publish failed');

    $('result-section').classList.remove('hidden');
    $('result-content').textContent = JSON.stringify(json, null, 2);
    setStatus('Published successfully!', 'success');
    $('confirm-modal').classList.add('hidden');
  } catch (err) {
    setStatus(err.message, 'error');
  } finally {
    $('confirm-publish').disabled = false;
  }
}

$('generate-btn').addEventListener('click', generatePost);

$('edit-btn').addEventListener('click', () => {
  $('preview-section').classList.add('hidden');
  setStatus('');
});

$('publish-btn').addEventListener('click', () => {
  $('confirm-modal').classList.remove('hidden');
});

$('cancel-publish').addEventListener('click', () => {
  $('confirm-modal').classList.add('hidden');
});

$('confirm-publish').addEventListener('click', () => publish(true));

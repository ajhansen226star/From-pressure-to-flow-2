import {pagesRepository, presentationData, TRANSCRIPT_LIMIT} from './presentation-data.js';
import {decodeTranscript, loadPresentation, publishPresentation} from './presentation-github.js';

const get = id => document.getElementById(id);
const repo = pagesRepository(location);
const fields = get('editor-fields');
const video = get('youtube-url');
const transcript = get('transcript-text');
const upload = get('transcript-file');
const token = get('publish-token');
const status = get('editor-status');
const failure = get('editor-error');
const confirm = get('confirm-check');
const commit = get('view-commit');
let saved;
let loadedText;

function showError(message = '') {
  failure.textContent = message;
  failure.hidden = !message;
}

function setTranscript(text) {
  transcript.value = text;
  loadedText = {original: text, visible: transcript.value};
}

function currentTranscript() {
  return transcript.value === loadedText?.visible ? loadedText.original : transcript.value;
}

function draftData() {
  return presentationData({youtubeUrl: video.value, transcript: currentTranscript()});
}

function needsConfirmation(draft) {
  const previous = saved.data;
  return (Boolean(previous.youtubeUrl) && !draft.youtubeUrl)
    || (Boolean(previous.transcript.trim()) && !draft.transcript.trim())
    || (previous.youtubeUrl !== draft.youtubeUrl && Boolean(draft.transcript.trim())
      && previous.transcript === draft.transcript && Boolean(previous.youtubeUrl));
}

function refreshDraft() {
  confirm.checked = false;
  const copy = currentTranscript();
  get('preview-text').textContent = copy.trim() ? copy : 'No transcript in this draft.';
  get('confirm-replacement').hidden = true;
  try {
    const draft = draftData();
    get('preview-link').textContent = draft.youtubeUrl || 'No YouTube link in this draft.';
    get('confirm-replacement').hidden = !needsConfirmation(draft);
  } catch {
    get('preview-link').textContent = 'Enter a valid YouTube link to preview it.';
  }
}

async function reload() {
  fields.disabled = true;
  commit.hidden = true;
  showError();
  status.textContent = 'Loading the latest content from GitHub…';
  try {
    saved = await loadPresentation(repo);
    video.value = saved.data.youtubeUrl;
    setTranscript(saved.data.transcript);
    upload.value = '';
    token.value = '';
    refreshDraft();
    status.textContent = 'Latest content loaded.';
    fields.disabled = false;
  } catch (error) {
    status.textContent = '';
    showError(error.message);
    fields.disabled = !saved;
    if (!saved) {
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = 'Try loading again';
      retry.addEventListener('click', () => {
        retry.remove();
        void reload();
      });
      failure.after(retry);
    }
  }
}

for (const field of [video, transcript]) field.addEventListener('input', refreshDraft);
upload.addEventListener('change', async () => {
  const file = upload.files[0];
  if (!file) return;
  fields.disabled = true;
  status.textContent = '';
  showError();
  try {
    if (!/\.(txt|vtt|srt)$/i.test(file.name) || file.size > TRANSCRIPT_LIMIT * 4) {
      throw new Error('Choose a UTF-8 .txt, .vtt, or .srt transcript of at most 100,000 characters.');
    }
    let copy;
    try {
      copy = decodeTranscript(await file.arrayBuffer());
    } catch {
      throw new Error('This transcript could not be read as UTF-8 text. Save it as UTF-8 and try again.');
    }
    if (copy.length > TRANSCRIPT_LIMIT) throw new Error('The transcript must be 100,000 characters or fewer.');
    setTranscript(copy);
    refreshDraft();
    status.textContent = 'Transcript loaded into the draft.';
  } catch (error) {
    showError(error.message);
  } finally {
    upload.value = '';
    fields.disabled = false;
  }
});

get('reload-presentation').addEventListener('click', () => {
  if ((video.value !== saved.data.youtubeUrl || currentTranscript() !== saved.data.transcript)
    && !window.confirm('Discard the current draft and reload from GitHub?')) return;
  void reload();
});

get('editor').addEventListener('submit', async event => {
  event.preventDefault();
  if (!saved || fields.disabled) return;
  showError();
  status.textContent = '';
  commit.hidden = true;
  try {
    const draft = draftData();
    if (draft.youtubeUrl === saved.data.youtubeUrl && draft.transcript === saved.data.transcript) {
      status.textContent = 'There are no changes to publish.';
      return;
    }
    if (needsConfirmation(draft) && !confirm.checked) {
      confirm.focus();
      throw new Error('Review and confirm the removal or video replacement before publishing.');
    }
    const key = token.value.trim();
    if (!/^github_pat_[a-zA-Z0-9_]+$/.test(key)) {
      token.focus();
      throw new Error('Enter a fine-grained GitHub publishing token.');
    }
    token.value = '';
    fields.disabled = true;
    status.textContent = 'Saving this update to GitHub…';
    const result = await publishPresentation(repo, saved.sha, draft, key);
    saved = {sha: result.sha, data: draft};
    video.value = draft.youtubeUrl;
    setTranscript(draft.transcript);
    refreshDraft();
    commit.href = 'https://github.com/' + repo.owner + '/' + repo.name + '/commit/' + result.commitSha;
    commit.hidden = false;
    status.textContent = 'Saved to GitHub. Your visitors will see the update after the Pages deployment finishes.';
  } catch (error) {
    status.textContent = '';
    showError(error.name === 'TimeoutError' || error instanceof TypeError
      ? 'Could not confirm the save. Check Actions or reload the published content before retrying.'
      : error.message);
  } finally {
    fields.disabled = false;
    token.value = '';
  }
});

if (repo) {
  get('repository').textContent = 'Publishing to ' + repo.owner + '/' + repo.name + ' · ' + repo.branch + ' branch';
  void reload();
} else {
  get('repository').textContent = 'Open this editor at your HTTPS GitHub Pages address (github.io) to publish.';
}

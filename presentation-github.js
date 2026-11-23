import {PRESENTATION_FILE, presentationData} from './presentation-data.js';

const decoder = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true});
const encoder = new TextEncoder();

export function decodeTranscript(bytes) {
  return decoder.decode(bytes);
}

function endpoint(repo) {
  const base = 'https://api.github.com/repos/';
  const path = [repo.owner, repo.name].map(encodeURIComponent).join('/');
  return base + path + '/contents/' + PRESENTATION_FILE;
}

function requestOptions() {
  return {
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
    headers: {Accept: 'application/vnd.github+json'},
  };
}

export async function loadPresentation(repo, request = fetch) {
  const response = await request(endpoint(repo) + '?ref=' + encodeURIComponent(repo.branch), requestOptions());
  if (response.status === 404) {
    throw new Error('GitHub could not find presentation.json. Check that the repository is public and the package files are at the top level of main.');
  }
  if (!response.ok) throw new Error('Could not read the current presentation from GitHub. Try reloading in a moment.');
  const record = await response.json();
  if (record.type !== 'file' || record.encoding !== 'base64' || !/^[a-f0-9]{40}$/i.test(record.sha)) {
    throw new Error('GitHub returned an unexpected presentation file.');
  }
  const bytes = Uint8Array.from(atob(record.content), char => char.charCodeAt(0));
  return {sha: record.sha, data: presentationData(JSON.parse(decoder.decode(bytes)))};
}

export async function publishPresentation(repo, sha, draft, token, request = fetch) {
  const content = JSON.stringify(presentationData(draft), null, 2) + '\n';
  const bytes = encoder.encode(content);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  const options = requestOptions();
  options.method = 'PUT';
  Object.assign(options.headers, {'Content-Type': 'application/json', Authorization: 'Bearer ' + token});
  options.body = JSON.stringify({
    message: 'Update presentation video and verbatim transcript',
    content: btoa(binary),
    sha,
    branch: repo.branch,
  });
  const response = await request(endpoint(repo), options);
  if (response.status === 409 || (response.status === 422 && /sha|conflict/i.test((await response.json().catch(() => ({}))).message || ''))) {
    throw new Error('The GitHub file changed after this editor loaded. Copy your draft, reload the published content, then apply your edits again.');
  }
  if ([401, 403, 404].includes(response.status)) {
    throw new Error('GitHub denied publishing. Check the token’s expiration, repository access, Contents write permission, and any branch protection rules.');
  }
  if (!response.ok) throw new Error('GitHub could not save this update. Check the repository or reload the published content before retrying.');
  const result = await response.json();
  const commitSha = result.commit?.sha;
  const fileSha = result.content?.sha;
  if (!/^[a-f0-9]{40}$/i.test(commitSha || '') || !/^[a-f0-9]{40}$/i.test(fileSha || '')) {
    throw new Error('GitHub returned an unexpected response. Check the repository before trying again.');
  }
  return {sha: fileSha, commitSha};
}

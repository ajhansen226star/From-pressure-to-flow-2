export const PRESENTATION_FILE = 'presentation.json';
export const TRANSCRIPT_LIMIT = 100_000;

export function youtubeLink(value) {
  if (!value.trim()) return '';
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error('Enter a full YouTube video link, including https://.');
  }
  const path = url.pathname.split('/');
  let id;
  if (url.protocol === 'https:' && !url.port && !url.username && !url.password) {
    if (url.hostname === 'youtu.be' && path.length === 2) id = path[1];
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
      if (url.pathname === '/watch') id = url.searchParams.get('v');
      if (path.length === 3 && ['live', 'shorts', 'embed'].includes(path[1])) id = path[2];
    }
  }
  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) {
    throw new Error('Use a YouTube video link, such as a watch or youtu.be link.');
  }
  return 'https://www.youtube.com/watch?v=' + id;
}

export function presentationData(data) {
  if (typeof data?.youtubeUrl !== 'string' || typeof data.transcript !== 'string') {
    throw new Error('The presentation file has an unexpected format.');
  }
  if (data.transcript.length > TRANSCRIPT_LIMIT) {
    throw new Error('The transcript must be 100,000 characters or fewer.');
  }
  return {youtubeUrl: youtubeLink(data.youtubeUrl), transcript: data.transcript};
}

export function pagesRepository(location) {
  const owner = /^([a-z0-9-]+)\.github\.io$/i.exec(location.hostname)?.[1];
  if (location.protocol !== 'https:' || !owner) return null;
  const directories = location.pathname.replace(/^\//, '').split('/').slice(0, -1);
  const name = directories.length ? directories[0] : owner + '.github.io';
  return directories.length <= 1 && /^[a-z0-9_.-]+$/i.test(name) && name !== '.' && name !== '..'
    ? {owner, name, branch: 'main'}
    : null;
}

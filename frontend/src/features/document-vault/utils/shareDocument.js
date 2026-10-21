export async function shareDocument(document) {
  if (typeof navigator.share !== 'function') {
    throw new Error('Your browser does not support the system share menu. Try sharing from a supported browser or device.');
  }

  const title = document.title || document.file_name || 'Shared document';
  const url = new URL(`/document-vault/${encodeURIComponent(document.id)}`, window.location.origin).href;

  await navigator.share({
    title,
    text: `Document: ${title}`,
    url,
  });
}

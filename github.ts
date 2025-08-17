export async function getGithubFileSha({ owner, repo, path, branch, token }:{
  owner: string; repo: string; path: string; branch: string; token: string;
}) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`;
  const res = await fetch(url, { headers: { Authorization: `token ${token}` } });
  if (!res.ok) return undefined;
  const json = await res.json();
  return json?.sha as string | undefined;
}

export function toBase64(str: string){
  return Buffer.from(str, "utf8").toString("base64");
}

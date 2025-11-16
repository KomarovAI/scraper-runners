// Cleanup GitHub artifacts: filter by name, retention via env, parallel, daily once, paginated
const axios = require('axios');
const retention = parseInt(process.env.ARTIFACT_RETENTION_DAYS || '7');
const headers = { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` };
const now = Date.now();
if (global.lastArtifactCleanup && now - global.lastArtifactCleanup < 23*60*60*1000) {
  return {json:{skipped:true,reason:'Already cleaned today'}};
}
global.lastArtifactCleanup = now;
let page = 1, allArtifacts = [];
while(true){
  const resp = await axios.get(`https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/actions/artifacts?page=${page}&per_page=100`, {headers});
  const batch = resp.data.artifacts||[];
  allArtifacts.push(...batch);
  if (batch.length<100) break;
  page++;
}
const cutoff = new Date(Date.now()-retention*86400*1000);
const old = allArtifacts.filter(a=>new Date(a.created_at)<cutoff && a.name.startsWith('batch-'));
const pLimit = require('p-limit');
const limit = pLimit(10);
const results = await Promise.allSettled(old.map(a=>limit(()=>axios.delete(`https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/actions/artifacts/${a.id}`,{headers}))));
return {json:{cleaned:results.filter(r=>r.status==='fulfilled').length,total:allArtifacts.length,attempted:old.length}};

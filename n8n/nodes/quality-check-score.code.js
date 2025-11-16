// Multi-dimensional quality scoring (text, title, links).
const tlen = $json.data?.text_length || 0;
const hasTitle = !!($json.data?.title && $json.data.title.length > 3);
const linkCount = $json.data?.links?.length || 0;
const score =
  (hasTitle ? 30 : 0) +
  (tlen > 500 ? 40 : tlen > 200 ? 20 : tlen > 50 ? 10 : 0) +
  (linkCount > 5 ? 20 : linkCount > 0 ? 5 : 0);
return { json: { ...$json, qualityScore: score, qualityPass: score >= 60, qualityFeatures: { tlen, hasTitle, linkCount } } };

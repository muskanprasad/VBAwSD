// server/utils/similarity.js
export function dot(a,b){
  let s=0;
  for(let i=0;i<a.length;i++) s += a[i]*b[i];
  return s;
}
export function norm(v){
  let s=0; for(let i=0;i<v.length;i++) s+=v[i]*v[i];
  return Math.sqrt(s);
}
export function cosine(a,b){
  if(!a || !b || a.length!==b.length) return 0;
  const d = dot(a,b);
  const na = norm(a);
  const nb = norm(b);
  if(na===0 || nb===0) return 0;
  return d/(na*nb);
}

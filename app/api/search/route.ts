import { getSmartSearch } from '../../_lib/smart-search';

export async function GET(request: Request) {
  const params=new URL(request.url).searchParams;
  const query=(params.get('q')||'').trim();
  const language=params.get('lang')==='ru'?'ru':'ro';
  if(query.length<2 || query.length>160 || query.split(/\s+/).length>16)
    return Response.json({error:'invalid_query'},{status:400});
  try {
    const {result,suggestions}=await getSmartSearch(query,language);
    return Response.json({
      result:{...result,hits:result.hits.slice(0,8).map(hit=>({
        ...hit,product:{...hit.product,description:{ro:'',ru:''}},
      }))},suggestions,
    },{headers:{'Cache-Control':'private, max-age=15'}});
  } catch {
    return Response.json({error:'search_unavailable'},{status:503});
  }
}

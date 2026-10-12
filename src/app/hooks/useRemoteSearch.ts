import { useEffect, useState } from 'react';
import type { SearchResult } from '../../lib/searchEngine';

export function useRemoteSearch(query: string, language: 'ro'|'ru', enabled: boolean) {
  const [state,setState]=useState<{key:string;result:SearchResult|null;suggestions:string[];loading:boolean}>({key:'',result:null,suggestions:[],loading:false});
  const key=language+':'+query.trim();
  useEffect(()=>{
    if(!enabled || query.trim().length<2) {
      setState({key,result:null,suggestions:[],loading:false});return;
    }
    const controller=new AbortController();
    setState({key,result:null,suggestions:[],loading:true});
    const timer=setTimeout(async()=>{
      try{
        const response=await fetch('/api/search?'+new URLSearchParams({q:query.trim(),lang:language}),{signal:controller.signal});
        if(!response.ok) throw Error('Search unavailable');
        const body=await response.json();
        if(!controller.signal.aborted)setState({key,result:body.result,suggestions:body.suggestions||[],loading:false});
      }catch{
        if(!controller.signal.aborted)setState({key,result:null,suggestions:[],loading:false});
      }
    },250);
    return ()=>{clearTimeout(timer);controller.abort();};
  },[key,enabled,language,query]);
  return state.key===key?state:{key,result:null,suggestions:[],loading:enabled&&query.trim().length>=2};
}

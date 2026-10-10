import { useEffect, useState } from 'react';
export function ApiNotice(){
  const [error,setError]=useState('');
  useEffect(()=>{const handle=(e:Event)=>setError((e as CustomEvent<Error>).detail.message);window.addEventListener('svyazka:api-error',handle);return()=>window.removeEventListener('svyazka:api-error',handle);},[]);
  if(!error)return null;
  return <div className="api-notice" role="alert"><span>{error}</span><button onClick={()=>window.location.reload()}>Повторить</button><button aria-label="Закрыть уведомление" onClick={()=>setError('')}>×</button></div>;
}

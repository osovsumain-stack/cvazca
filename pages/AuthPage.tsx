import { getReferralContext, clearReferralContext } from '@/services/referralCapture';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/services/authContext';
import { apiRequest } from '@/repositories/transport';
import { renderVkButton, processVkAuth, saveAuthOrigin } from '@/services/vkAuthService';
import { ConsentGate } from '@/components/ConsentGate';
import type { AuthSession } from '@/types/platform';

export function AuthPage() {
  const { isAuthenticated, isLoading, vkStatus, refreshAccount } = useAuth();
  const location = useLocation(), navigate = useNavigate();
  const from = (location.state as { from?: string })?.from || '/career/profile';
  const safeFrom = from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/auth') ? from : '/career/profile';
  const [register,setRegister] = useState((location.state as {mode?:string})?.mode === 'register'), [busy,setBusy] = useState(false), [error,setError] = useState('');
  const [form,setForm] = useState({ email:'',password:'',firstName:'',lastName:'' });
  const [consent,setConsent] = useState({ user_terms:false,personal_data:false,marketing:false });
  const vk = useRef<HTMLDivElement>(null);
  useEffect(() => { if(isAuthenticated && !isLoading && !busy) navigate(safeFrom,{replace:true}); },[isAuthenticated,isLoading,busy,safeFrom,navigate]);
  useEffect(() => {
    if(vkStatus!=='ready' || !vk.current || !consent.user_terms || !consent.personal_data) return;
    return renderVkButton(vk.current,async(code,device)=>{
      setBusy(true);setError('');saveAuthOrigin(safeFrom.startsWith('/business')?'business':'career');
      try { const result=await processVkAuth(code,device);if(!result.success)throw new Error(result.error||'Ошибка входа');clearReferralContext();await refreshAccount();navigate(safeFrom,{replace:true}); }
      catch(err){setError(err instanceof Error?err.message:'Ошибка входа');}finally{setBusy(false);}
    },setError);
  },[vkStatus,consent,safeFrom,refreshAccount,navigate]);
  async function submit(e:FormEvent){
    e.preventDefault();setBusy(true);setError('');
    try { await apiRequest<AuthSession>(register?'/api/auth/register':'/api/auth/login',{...form,consent,referralCode:getReferralContext()?.refCode});clearReferralContext();await refreshAccount();navigate(safeFrom,{replace:true}); }
    catch(err){setError(err instanceof Error?err.message:'Ошибка входа');}finally{setBusy(false);}
  }
  return <div className="simple-page"><div className="simple-card auth-card">
    <Link to="/" className="text-link">← На главную</Link><h1>{register?'Создать аккаунт':'Вход в СВЯЗКУ'}</h1><p>Один аккаунт для карьеры и бизнеса</p>
    <div className="segmented"><button type="button" className={!register?'active':''} onClick={()=>{setRegister(false);setError('');}}>Вход</button><button type="button" className={register?'active':''} onClick={()=>{setRegister(true);setError('');}}>Регистрация</button></div>
    <form onSubmit={submit} className="stack-form">
      {register&&<div className="form-grid"><label>Имя<input className="form-input" autoComplete="given-name" required maxLength={80} value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})}/></label><label>Фамилия<input className="form-input" autoComplete="family-name" required maxLength={80} value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})}/></label></div>}
      <label>Email<input className="form-input" type="email" autoComplete="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
      <label>Пароль<input className="form-input" type="password" autoComplete={register?'new-password':'current-password'} minLength={register?12:1} maxLength={256} required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label>
      {register&&<><small>Не менее 12 символов. Можно использовать длинную фразу.</small><ConsentGate onAllRequiredAccepted={setConsent}/></>}
      {error&&<p className="form-error" role="alert">{error}</p>}
      <button className="platform-nav-btn primary" disabled={busy||(register&&(!consent.user_terms||!consent.personal_data))}>{busy?'Подождите…':register?'Зарегистрироваться':'Войти'}</button>
    </form>
    {vkStatus==='ready'&&<div className="vk-login-alternative"><p>Или продолжите через VK ID</p>{!register&&<ConsentGate onAllRequiredAccepted={setConsent}/>}<div ref={vk}/></div>}
    <p className="auth-note">Данные доступны в вашем кабинете после входа с любого устройства.</p>
  </div></div>;
}

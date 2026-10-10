import { Navigate } from 'react-router-dom';
export function BusinessRegisterPage(){return <Navigate to="/auth" state={{from:'/business/organizations/new',mode:'register'}} replace/>;}

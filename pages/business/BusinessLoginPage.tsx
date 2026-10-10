import { Navigate } from 'react-router-dom';
export function BusinessLoginPage(){return <Navigate to="/auth" state={{from:'/business/dashboard'}} replace/>;}

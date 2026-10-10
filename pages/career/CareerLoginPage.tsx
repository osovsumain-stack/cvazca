import { Navigate } from 'react-router-dom';
export function CareerLoginPage(){return <Navigate to="/auth" state={{from:'/career/profile'}} replace/>;}

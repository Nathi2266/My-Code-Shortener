import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import Analysis from '../pages/Analysis';
import Sessions from '../pages/Sessions';
import Docs from '../pages/Docs';
import Profile from '../pages/Profile';
import Login from '../pages/Login';
import Register from '../pages/Register';
import { ErrorBoundary } from 'react-error-boundary';
import { useAuth } from '../context/AuthContext';
import { Navigate, Route, Routes } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <Home /> },
      { path: 'analysis', element: <Analysis /> },
      { path: 'sessions', element: <Sessions /> },
      { path: 'docs', element: <Docs /> },
      { path: 'profile', element: <Profile /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: '*', element: <div>Not Found</div> }
    ]
  }
]);

const RoutesComponent = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
      <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
    </Routes>
  );
};

export default RoutesComponent; 
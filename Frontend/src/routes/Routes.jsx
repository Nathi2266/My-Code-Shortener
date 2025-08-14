import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import { useAuth } from '../context/AuthContext';
import { ErrorBoundary } from 'react-error-boundary';

const Protected = ({ element }) => {
  const { user } = useAuth();
  return user ? element : <Login />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <Protected element={<Home />} /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: '*', element: <div>Not Found</div> }
    ]
  }
], {
  future: {
    v7_startTransition: true,
  }
}); 
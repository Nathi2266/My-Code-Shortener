import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import Analysis from '../pages/Analysis';
import Sessions from '../pages/Sessions';
import Docs from '../pages/Docs';
import Profile from '../pages/Profile';
import Login from '../pages/Login';
import Register from '../pages/Register';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
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
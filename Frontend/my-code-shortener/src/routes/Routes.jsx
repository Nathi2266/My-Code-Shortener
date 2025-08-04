import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import Analysis from '../pages/Analysis';
import Sessions from '../pages/Sessions';
import Docs from '../pages/Docs';
import { ErrorBoundary } from 'react-error-boundary';

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
      { path: '*', element: <div>Not Found</div> }
    ]
  }
]); 
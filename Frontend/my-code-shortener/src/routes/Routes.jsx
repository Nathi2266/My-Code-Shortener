import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import { ErrorBoundary } from 'react-error-boundary';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <Home /> },
      { path: '*', element: <div>Not Found</div> }
    ]
  }
], {
  future: {
    v7_startTransition: true,
  }
}); 
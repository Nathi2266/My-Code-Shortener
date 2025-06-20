import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ColorModeScript } from '@chakra-ui/react';
import theme from './theme';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <App />
  </>
);

// If you want to start measuring performance in your app, pass a function
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals

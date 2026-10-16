import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import TemplateApp from './TemplateApp.jsx';
createRoot(document.getElementById('root')).render(<BrowserRouter><TemplateApp /></BrowserRouter>);

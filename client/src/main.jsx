import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/admin/styles.css';
import './styles/admin/cms-pages.css';
import './styles/admin/system-admin.css';
import './styles/admin/admin-login.css';
import './styles/admin/admin-theme.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);

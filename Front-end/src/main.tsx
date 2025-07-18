import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import 'antd/dist/reset.css';
import AppProvider from "./shared/notification/AppProvider.tsx";

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <AppProvider>
            <App />
        </AppProvider>
    </BrowserRouter>
);
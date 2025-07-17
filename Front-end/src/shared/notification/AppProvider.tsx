import React from 'react';
import { App, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import type { ConfigProviderProps } from 'antd/es/config-provider';

interface AppProviderProps {
    children: React.ReactNode;
    theme?: ConfigProviderProps['theme'];
}

const AppProvider: React.FC<AppProviderProps> = ({ children, theme }) => {
    return (
        <ConfigProvider
            locale={viVN}
            theme={{
                token: {
                    colorPrimary: '#1677ff',
                    borderRadius: 6,
                    colorBgContainer: '#ffffff',
                },
                ...theme,
            }}
        >
            <App>
                {children}
            </App>
        </ConfigProvider>
    );
};

export default AppProvider;
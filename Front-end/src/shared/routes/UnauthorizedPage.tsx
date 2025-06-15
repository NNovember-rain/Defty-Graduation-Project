import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const UnauthorizedPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>{t('unauthorized.title')}</h1>
            <p>{t('unauthorized.message')}</p>
            <Link to={``}>{t('unauthorized.goHome')}</Link>
        </div>
    );
};

export default UnauthorizedPage;
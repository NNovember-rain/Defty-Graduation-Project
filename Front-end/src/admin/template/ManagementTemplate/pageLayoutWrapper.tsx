import React from 'react';
import { useTranslation } from 'react-i18next';
import Breadcrumb from './Breadcrumb';
import './FormTemplate.scss';

interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface PageLayoutWrapperProps {
    pageTitle?: string;
    pageTitleKey?: string;
    breadcrumbItems: BreadcrumbItem[];
    children: React.ReactNode;
    showDefaultPadding?: boolean;
}

const PageLayoutWrapper: React.FC<PageLayoutWrapperProps> = ({
                                                                 pageTitle,
                                                                 pageTitleKey,
                                                                 breadcrumbItems,
                                                                 children,
                                                                 showDefaultPadding = true
                                                             }) => {
    const { t } = useTranslation();

    const currentPageTitle = pageTitle || (pageTitleKey ? t(pageTitleKey) : '');

    return (
        <div className="form-template">
            <div className="form-template__header-container">
                <div className="form-template__left">
                    <h1 className="form-template__page-title">{currentPageTitle}</h1>
                </div>
                <div className="form-template__right">
                    <Breadcrumb items={breadcrumbItems} />
                </div>
            </div>
            <div className={showDefaultPadding ? "form-template__content" : ""}>
                {showDefaultPadding ? (
                    <div className="form-template__form-container">
                        {children}
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
};

export default PageLayoutWrapper;
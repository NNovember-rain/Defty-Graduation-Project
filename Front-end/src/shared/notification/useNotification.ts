import React, { useEffect } from "react";
import { App } from 'antd';
// import { useTranslation } from 'react-i18next'; // Removed due to compilation error

export interface NotificationOptions {
    duration?: number;
    placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
    className?: string;
    style?: React.CSSProperties;
}

export interface MessageOptions {
    duration?: number;
    key?: string;
    className?: string;
    style?: React.CSSProperties;
}

export interface ModalConfirmOptions {
    title: string;
    content?: React.ReactNode;
    onOk?: () => void | Promise<void>;
    onCancel?: () => void;
    okText?: string;
    cancelText?: string;
    okType?: 'primary' | 'danger';
}

// CSS styles được inject vào head
const injectStyles = () => {
    const styleId = 'custom-notification-styles';

    // Kiểm tra xem styles đã được inject chưa
    if (document.getElementById(styleId)) return;

    const styles = `
        /* Dark theme message styles */
        .dark-theme-message .ant-message-notice-content {
            background-color: #2c2c2c !important;
            border: 1px solid #404040 !important;
            border-radius: 8px !important;
            color: #d1d1d1 !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
        }
        
        .dark-theme-message-success .ant-message-notice-content {
            background-color: #2c2c2c !important;
            border: 1px solid #2ecc71 !important;
            color: #2ecc71 !important;
        }
        
        .dark-theme-message-error .ant-message-notice-content {
            background-color: #2c2c2c !important;
            border: 1px solid #e74c3c !important;
            color: #e74c3c !important;
        }
        
        .dark-theme-message-warning .ant-message-notice-content {
            background-color: #2c2c2c !important;
            border: 1px solid #f1c40f !important;
            color: #f1c40f !important;
        }
        
        .dark-theme-message-info .ant-message-notice-content {
            background-color: #2c2c2c !important;
            border: 1px solid #3498db !important;
            color: #3498db !important;
        }
        
        /* Dark theme notification styles */
        .dark-theme-notification {
            background-color: #2c2c2c !important;
            border: 1px solid #404040 !important;
            border-radius: 8px !important;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4) !important;
        }
        
        .dark-theme-notification .ant-notification-notice-message {
            color: #f1f1f1 !important;
            font-weight: 600 !important;
        }
        
        .dark-theme-notification .ant-notification-notice-description {
            color: #d1d1d1 !important;
        }
        
        /* Remove left border for all notification types */
        .dark-theme-notification.ant-notification-notice-with-icon {
            border-left: none !important;
        }
        
        /* Notification success */
        .dark-theme-notification-success {
            background-color: #2c2c2c !important;
        }
        
        .dark-theme-notification-success .ant-notification-notice-icon {
            color: #2ecc71 !important;
        }
        
        /* Notification error */
        .dark-theme-notification-error {
            background-color: #2c2c2c !important;
        }
        
        .dark-theme-notification-error .ant-notification-notice-icon {
            color: #e74c3c !important;
        }
        
        /* Notification warning */
        .dark-theme-notification-warning {
            background-color: #2c2c2c !important;
        }
        
        .dark-theme-notification-warning .ant-notification-notice-icon {
            color: #f1c40f !important;
        }
        
        /* Notification info */
        .dark-theme-notification-info {
            background-color: #2c2c2c !important;
        }
        
        .dark-theme-notification-info .ant-notification-notice-icon {
            color: #3498db !important;
        }
        
        /* Loading message dark theme */
        .dark-theme-message-loading .ant-message-notice-content {
            background-color: #2c2c2c !important;
            border: 1px solid #6b7280 !important;
            color: #9ca3af !important;
        }

        /* Close button cho dark theme */
        .dark-theme-notification .ant-notification-notice-close {
            background-color: transparent !important; /* sáng hơn chút */
            border: none !important;
            border-radius: 6px !important;
            padding: 3px !important;
            transition: all 0.2s ease !important;
            opacity: 1 !important; /* bỏ mờ */
            font-weight: bold !important; /* icon đậm hơn */
        }
        
        /* target chính xác nút close */
        .dark-theme-notification .ant-notification-notice-close svg {
            fill: #2ecc71 !important;
            width: 14px;
            height: 14px;
        }

        /* Make close button more prominent with a subtle border */
        .dark-theme-notification .ant-notification-notice-close::before {
            content: '' !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            border-radius: 4px !important;
            pointer-events: none !important;
        }

    `;

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
};

export const useNotification = () => {
    const { message, notification, modal } = App.useApp();
    // const { t } = useTranslation(); // Removed due to compilation error

    // Kiểm tra URL có prefix /admin không
    const isAdminPath = () => {
        return window.location.pathname.startsWith('/admin');
    };

    // Inject styles khi hook được sử dụng
    useEffect(() => {
        if (!isAdminPath()) {
            injectStyles();
        }
    }, []);

    // Message functions với theme detection
    const showSuccess = (
        content: string,
        duration: number = 3,
        options?: MessageOptions
    ): void => {
        const isDarkTheme = !isAdminPath();

        message.success({
            content,
            duration,
            className: isDarkTheme ? `dark-theme-message-success ${options?.className || ''}` : options?.className,
            style: options?.style,
            key: options?.key,
        });
    };

    const showError = (
        content: string,
        duration: number = 5,
        options?: MessageOptions
    ): void => {
        const isDarkTheme = !isAdminPath();

        message.error({
            content,
            duration,
            className: isDarkTheme ? `dark-theme-message-error ${options?.className || ''}` : options?.className,
            style: options?.style,
            key: options?.key,
        });
    };

    const showWarning = (
        content: string,
        duration: number = 4,
        options?: MessageOptions
    ): void => {
        const isDarkTheme = !isAdminPath();

        message.warning({
            content,
            duration,
            className: isDarkTheme ? `dark-theme-message-warning ${options?.className || ''}` : options?.className,
            style: options?.style,
            key: options?.key,
        });
    };

    const showInfo = (
        content: string,
        duration: number = 3,
        options?: MessageOptions
    ): void => {
        const isDarkTheme = !isAdminPath();

        message.info({
            content,
            duration,
            className: isDarkTheme ? `dark-theme-message-info ${options?.className || ''}` : options?.className,
            style: options?.style,
            key: options?.key,
        });
    };

    const showLoading = (
        content: string = 'Loading data...', // Hardcoded text instead of t('common.loadingData')
        options?: MessageOptions
    ): void => {
        const isDarkTheme = !isAdminPath();

        message.loading({
            content,
            duration: 0,
            className: isDarkTheme ? `dark-theme-message-loading ${options?.className || ''}` : options?.className,
            style: options?.style,
            key: options?.key,
        });
    };

    // Notification functions với theme detection
    const showNotification = (
        type: 'success' | 'error' | 'warning' | 'info',
        title: string,
        description?: string,
        options?: NotificationOptions
    ): void => {
        const isDarkTheme = !isAdminPath();

        let className = options?.className || '';
        if (isDarkTheme) {
            className = `dark-theme-notification dark-theme-notification-${type} ${className}`.trim();
        }

        notification[type]({
            message: title,
            description,
            duration: options?.duration || 4.5,
            placement: options?.placement || 'topRight',
            className,
            style: options?.style,
        });
    };

    // Modal functions
    const showConfirm = (options: ModalConfirmOptions): void => {
        modal.confirm({
            title: options.title,
            content: options.content,
            onOk: options.onOk,
            onCancel: options.onCancel,
            okText: options.okText || 'Confirm', // Hardcoded text instead of t('common.confirm')
            cancelText: options.cancelText || 'Cancel', // Hardcoded text instead of t('common.cancel')
            okType: options.okType || 'primary',
        });
    };

    const showDeleteConfirm = (
        title: string,
        onOk: () => void | Promise<void>,
        content?: string
    ): void => {
        modal.confirm({
            title,
            content: content || 'Are you sure you want to delete this item?', // Hardcoded text instead of t('common.confirmDeleteContent')
            okText: 'Delete', // Hardcoded text instead of t('common.delete')
            okType: 'danger',
            cancelText: 'Cancel', // Hardcoded text instead of t('common.cancel')
            onOk,
        });
    };

    // Advanced message functions
    const showApiError = (error: any): void => {
        const errorMsg = error?.response?.data?.message || error?.message || 'Error'; // Hardcoded text instead of t('common.error')
        showError(errorMsg);
    };

    const showValidationErrors = (errors: Record<string, string[]>): void => {
        Object.values(errors).forEach(errorArray => {
            if (errorArray.length > 0) {
                showError(errorArray[0]);
            }
        });
    };

    return {
        // Message
        message: {
            success: showSuccess,
            error: showError,
            warning: showWarning,
            info: showInfo,
            loading: showLoading,
            destroy: message.destroy,
        },
        // Notification
        notification: {
            success: (title: string, description?: string, options?: NotificationOptions) =>
                showNotification('success', title, description, options),
            error: (title: string, description?: string, options?: NotificationOptions) =>
                showNotification('error', title, description, options),
            warning: (title: string, description?: string, options?: NotificationOptions) =>
                showNotification('warning', title, description, options),
            info: (title: string, description?: string, options?: NotificationOptions) =>
                showNotification('info', title, description, options),
            destroy: notification.destroy,
        },
        // Modal
        modal: {
            confirm: showConfirm,
            deleteConfirm: showDeleteConfirm,
        },
        // Utilities
        showApiError,
        showValidationErrors,
        // Helper function để kiểm tra theme
        isAdminPath,
    };
};
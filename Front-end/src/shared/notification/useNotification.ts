import React from "react";
import { App } from 'antd';
import { useTranslation } from 'react-i18next';

export interface NotificationOptions {
    duration?: number;
    placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
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

export const useNotification = () => {
    const { message, notification, modal } = App.useApp();
    const { t } = useTranslation();

    // Message functions với type safety
    const showSuccess = (content: string, duration: number = 3): void => {
        message.success(content, duration);
    };

    const showError = (content: string, duration: number = 5): void => {
        message.error(content, duration);
    };

    const showWarning = (content: string, duration: number = 4): void => {
        message.warning(content, duration);
    };

    const showInfo = (content: string, duration: number = 3): void => {
        message.info(content, duration);
    };

    const showLoading = (content: string = t('common.loadingData')): void => {
        message.loading(content, 0);
    };

    // Notification functions
    const showNotification = (
        type: 'success' | 'error' | 'warning' | 'info',
        title: string,
        description?: string,
        options?: NotificationOptions
    ): void => {
        notification[type]({
            message: title,
            description,
            duration: options?.duration || 4.5,
            placement: options?.placement || 'topRight',
        });
    };

    // Modal functions
    const showConfirm = (options: ModalConfirmOptions): void => {
        modal.confirm({
            title: options.title,
            content: options.content,
            onOk: options.onOk,
            onCancel: options.onCancel,
            okText: options.okText || t('common.confirm'),
            cancelText: options.cancelText || t('common.cancel'),
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
            content: content || t('common.confirmDeleteContent'),
            okText: t('common.delete'),
            okType: 'danger',
            cancelText: t('common.cancel'),
            onOk,
        });
    };

    // Advanced message functions
    const showApiError = (error: any): void => {
        const errorMsg = error?.response?.data?.message || error?.message || t('common.error');
        message.error(errorMsg);
    };

    const showValidationErrors = (errors: Record<string, string[]>): void => {
        Object.values(errors).forEach(errorArray => {
            if (errorArray.length > 0) {
                message.error(errorArray[0]);
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
    };
};
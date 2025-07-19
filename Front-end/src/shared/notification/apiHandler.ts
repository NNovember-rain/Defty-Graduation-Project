import { App } from 'antd';

export interface ApiHandlerOptions {
    loadingMessage?: string;
    successMessage?: string;
    errorMessage?: string;
    showLoading?: boolean;
    showSuccess?: boolean;
    showError?: boolean;
}

export const createApiHandler = () => {
    const { message } = App.useApp();

    const handleApiCall = async <T>(
        apiCall: () => Promise<T>,
        options: ApiHandlerOptions = {}
    ): Promise<T> => {
        const {
            loadingMessage = 'Đang xử lý...',
            successMessage = 'Thành công!',
            errorMessage = 'Có lỗi xảy ra!',
            showLoading = true,
            showSuccess = true,
            showError = true,
        } = options;

        let loadingHide: (() => void) | null = null;

        try {
            if (showLoading) {
                loadingHide = message.loading(loadingMessage, 0);
            }

            const result = await apiCall();

            if (loadingHide) loadingHide();

            if (showSuccess) {
                message.success(successMessage);
            }

            return result;
        } catch (error: any) {
            if (loadingHide) loadingHide();

            if (showError) {
                const errorMsg = error.response?.data?.message || error.message || errorMessage;
                message.error(errorMsg);
            }

            throw error;
        }
    };

    return { handleApiCall };
};
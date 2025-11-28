import { getLocalStorageItem, setLocalStorageItem, removeLocalStorageItem } from '../utils/localStorage';
import { message } from 'antd';
import i18n from '../locales/i18n';

const DOMAIN: string = import.meta.env.VITE_DOMAIN as string;
const PREFIX_API: string = import.meta.env.VITE_PREFIX_API as string;
const PREFIX_AUTH: string = import.meta.env.VITE_PREFIX_AUTH as string;
const PREFIX_IDENTITY: string = import.meta.env.VITE_PREFIX_IDENTITY as string;

const ACCESS_TOKEN_KEY: string = 'token';

const getAccessToken = (): string | null => {
    return getLocalStorageItem<string>(ACCESS_TOKEN_KEY);
};

const setAccessToken = (token: string): void => {
    setLocalStorageItem(ACCESS_TOKEN_KEY, token);
};

const removeAccessToken = (): void => {
    removeLocalStorageItem(ACCESS_TOKEN_KEY);
};

const refreshToken = async (): Promise<boolean> => {
    try {
        const token = getAccessToken();
        if (!token) {
            console.error("Không tìm thấy token cho yêu cầu làm mới. Không thể làm mới.");
            handleRefreshTokenFailure();
            return false;
        }

        const requestBody = {
            token: token,
        };

        const response = await fetch(`${DOMAIN}/${PREFIX_API}/${PREFIX_IDENTITY}/${PREFIX_AUTH}/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            console.error('Không thể làm mới token (lỗi HTTP):', response.status, response.statusText);
            handleRefreshTokenFailure();
            return false;
        }
        const apiResponse: { code: number; result?: { authenticated: boolean; token: string } } = await response.json();
        if (apiResponse.code === 200 && apiResponse.result && apiResponse.result.authenticated && apiResponse.result.token) {
            setAccessToken(apiResponse.result.token);
            return true;
        } else {
            console.error('API làm mới token trả về trạng thái không phải 200, hoặc thiếu token mới:', apiResponse);
            handleRefreshTokenFailure();
            return false;
        }
    } catch (error) {
        console.error('Lỗi khi làm mới access token (lỗi mạng/phân tích cú pháp):', error);
        handleRefreshTokenFailure();
        return false;
    }
};

const handleRefreshTokenFailure = (): void => {
    message.error(i18n.t('apiMessages.sessionExpired'), 3);
    removeAccessToken();
};

const requestWithRefresh = async (path: string, options: RequestInit): Promise<Response> => {
    const fullPath = `${DOMAIN}/${PREFIX_API}/${path}`;

    const currentAccessToken = getAccessToken();
    const headers = { ...(options.headers as Record<string, string> || {}) };

    if (currentAccessToken) {
        headers['Authorization'] = `Bearer ${currentAccessToken}`;
    }

    let response: Response;
    try {
        response = await fetch(fullPath, {
            ...options,
            headers,
            credentials: 'include',
        });
    } catch (error) {
        console.error('Network error during initial fetch:', error);
        message.error(i18n.t('apiMessages.networkErrorInitialFetch'), 3);
        throw error;
    }

    if (response.status === 401) {
        console.warn('Received 401 Unauthorized. Attempting to refresh token...');
        const isRefreshSuccessful = await refreshToken();

        if (isRefreshSuccessful) {
            console.log('Token refreshed successfully. Retrying original request...');
            const newAccessToken = getAccessToken();
            const retryHeaders = { ...(options.headers as Record<string, string> || {}) };

            if (newAccessToken) {
                retryHeaders['Authorization'] = `Bearer ${newAccessToken}`;
            }

            try {
                response = await fetch(fullPath, {
                    ...options,
                    headers: retryHeaders,
                    credentials: 'include',
                });
                if (!response.ok) {
                    console.error('Request failed after token refresh:', response.status, response.statusText);
                    message.error(i18n.t('apiMessages.requestFailedAfterRefresh'), 3);
                    throw new Error(`Request failed after token refresh with status ${response.status}`);
                }
            } catch (error) {
                console.error('Network error during retried fetch:', error);
                message.error(i18n.t('apiMessages.networkErrorRetryFetch'), 3);
                throw error;
            }
        } else {
            throw new Error('Failed to refresh token after 401 response. Session might be invalid.');
        }
    }

    return response;
};


export const get = async (path: string, options?: RequestInit): Promise<Response> => {
    const finalOptions: RequestInit = {
        method: 'GET',
        ...options,
    };

    return requestWithRefresh(path, finalOptions);
};


export const postJsonData = async (path: string, data: Record<string, any>): Promise<Response> => {
    return requestWithRefresh(path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
};

export const postFormData = async (path: string, data: FormData): Promise<Response> => {
    return requestWithRefresh(path, {
        method: 'POST',
        body: data,
    });
};

export const putJsonData = async (path: string, data: Record<string, any>): Promise<Response> => {
    return requestWithRefresh(path, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
};

export const putFormData = async (path: string, data: FormData): Promise<Response> => {
    return requestWithRefresh(path, {
        method: 'PUT',
        body: data,
    });
};

export const patchJsonData = async (path: string, data: Record<string, any>): Promise<Response> => {
    return requestWithRefresh(path, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
};

export const patchFormData = async (path: string, data: FormData): Promise<Response> => {
    return requestWithRefresh(path, {
        method: 'PATCH',
        body: data,
    });
};

export const del = async (path: string): Promise<Response> => {
    return requestWithRefresh(path, {
        method: 'DELETE',
    });
};

export const bulkDelete = async (path: string, data: Record<string, any>): Promise<Response> => {
    return requestWithRefresh(path, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
};

export const patchStatus = async (path: string): Promise<Response> => {
    return requestWithRefresh(path, {
        method: 'PATCH',
    });
};

export const postMultipartData = async (
    path: string,
    formData: FormData
): Promise<Response> => {
    const token = getAccessToken();

    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Dùng cùng cơ chế với các hàm khác
    const fullPath = `${DOMAIN}/${PREFIX_API}/${path}`;

    return fetch(fullPath, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
    });
};
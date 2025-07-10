export const setLocalStorageItem = <T>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error setting localStorage item for key "${key}":`, error);
    }
};

export const getLocalStorageItem = <T>(key: string): T | null => {
    try {
        const item = localStorage.getItem(key);
        if (item === null) {
            return null;
        }
        try {
            return JSON.parse(item) as T;
        } catch (e) {
            return item as T;
        }
    } catch (error) {
        console.error(`Error getting localStorage item for key "${key}":`, error);
        return null;
    }
};

export const removeLocalStorageItem = (key: string): void => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Error removing localStorage item for key "${key}":`, error);
    }
};

export const clearLocalStorage = (): void => {
    try {
        localStorage.clear();
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
};
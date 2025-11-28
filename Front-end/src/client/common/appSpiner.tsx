// src/shared/components/AppSpinner/AppSpinner.tsx

import React from 'react';

// Định nghĩa props để có thể tùy chỉnh kích thước hoặc màu sắc nếu cần
interface AppSpinnerProps {
    size?: number; // Ví dụ: 24 (pixels)
    color?: string; // Ví dụ: '#ffffff'
    className?: string; // Để thêm các class khác (ví dụ: margin)
}

const AppSpinner: React.FC<AppSpinnerProps> = ({ size = 20, color = '#ffffff', className = '' }) => {

    // Tạo giá trị độ trong suốt 30% cho border mờ
    // Lưu ý: React style dùng camelCase (borderTopColor)
    const spinnerStyle: React.CSSProperties = {
        width: `${size}px`,
        height: `${size}px`,
        // Độ dày border cố định
        borderWidth: '3px',

        // Màu border mờ (base color)
        borderColor: `${color}4D`,

        // Màu border sáng (top color)
        borderTopColor: color,
    };

    return (
        // Dùng class app-spinner-base để lấy animation @keyframes từ SCSS
        <div
            className={`app-spinner-base ${className}`}
            style={spinnerStyle}
        />
    );
};

export default AppSpinner;
import React from 'react';

interface QuestionBoxProps {
    number: number;
    isCorrect: boolean | null;
    onClick?: () => void;
    size?: 'small' | 'medium';
}

const QuestionBox: React.FC<QuestionBoxProps> = ({ number, isCorrect, onClick, size = 'small' }) => {
    const bg =
        isCorrect === true ? '#dcfce7' :
            isCorrect === false ? '#fee2e2' :
                '#f3f4f6';

    const color =
        isCorrect === true ? '#166534' :
            isCorrect === false ? '#991b1b' :
                '#6b7280';

    const border =
        isCorrect === true ? '#86efac' :
            isCorrect === false ? '#fca5a5' :
                '#e5e7eb';

    const boxSize = size === 'small' ? '32px' : '48px';

    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: boxSize,
                height: boxSize,
                backgroundColor: bg,
                borderRadius: '6px',
                border: `1px solid ${border}`,
                color,
                fontWeight: 600,
                fontSize: size === 'small' ? '12px' : '14px',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'transform 0.15s'
            }}
            // onMouseEnter={(e) => onClick && (e.currentTarget.style.transform = 'scale(1.05)')}
            // onMouseLeave={(e) => onClick && (e.currentTarget.style.transform = 'scale(1)')}
        >
            {number}
        </div>
    );
};

export default QuestionBox;

// ==================== SKELETON COMPONENTS ====================
// Đặt file này ở: src/shared/components/Skeleton.tsx hoặc tương tự

import React from 'react';

// CSS Animation cho pulse effect
const skeletonStyles = `
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  .skeleton-shimmer {
    animation: shimmer 2s infinite;
    background: linear-gradient(
      to right,
      #f0f0f0 0%,
      #e0e0e0 20%,
      #f0f0f0 40%,
      #f0f0f0 100%
    );
    background-size: 1000px 100%;
  }
`;

// Inject styles vào document
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = skeletonStyles;
    if (!document.head.querySelector('style[data-skeleton]')) {
        styleSheet.setAttribute('data-skeleton', 'true');
        document.head.appendChild(styleSheet);
    }
}

// ==================== BASE SKELETON ====================
interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    className?: string;
    style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
                                                      width = '100%',
                                                      height = '20px',
                                                      borderRadius = '4px',
                                                      className = '',
                                                      style = {}
                                                  }) => {
    return (
        <div
            className={`skeleton-shimmer ${className}`}
            style={{
                width,
                height,
                borderRadius,
                ...style
            }}
        />
    );
};

// ==================== PEOPLE TAB SKELETONS ====================

// Skeleton cho Teacher/Assistant (single person)
export const PersonSkeleton: React.FC = () => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '1rem' }}>
        <Skeleton
            width="48px"
            height="48px"
            borderRadius="50%"
            style={{ marginRight: '1rem', flexShrink: 0 }}
        />
        <div style={{ flex: 1 }}>
            <Skeleton height="20px" style={{ marginBottom: '8px', width: '60%' }} />
            <Skeleton height="16px" style={{ width: '40%' }} />
        </div>
    </div>
);

// Skeleton cho Student list item
export const StudentSkeleton: React.FC = () => (
    <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '1.5rem 0',
        borderBottom: '1px solid #f3f4f6'
    }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
            <Skeleton
                width="56px"
                height="56px"
                borderRadius="50%"
                style={{ flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Skeleton height="24px" style={{ width: '50%' }} />
                    <Skeleton height="20px" width="50px" borderRadius="4px" />
                </div>
                <Skeleton height="18px" style={{ width: '40%' }} />
            </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            <Skeleton height="28px" width="100px" borderRadius="20px" />
            <Skeleton height="36px" width="36px" borderRadius="4px" />
        </div>
    </div>
);

// Skeleton cho toàn bộ People Tab section
export const PeopleTabSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            {/* Teacher Section Skeleton */}
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '1.5rem',
                border: '1px solid #e5e7eb'
            }}>
                <Skeleton height="30px" width="120px" style={{ marginBottom: '1.5rem' }} />
                <PersonSkeleton />
            </div>

            {/* Assistant Section Skeleton */}
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '1.5rem',
                border: '1px solid #e5e7eb'
            }}>
                <Skeleton height="30px" width="100px" style={{ marginBottom: '1.5rem' }} />
                <PersonSkeleton />
                <PersonSkeleton />
            </div>

            {/* Students Section Skeleton */}
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '2rem',
                border: '1px solid #e5e7eb'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <Skeleton height="30px" width="100px" />
                    <Skeleton height="20px" width="80px" />
                </div>
                <div>
                    {Array.from({ length: count }).map((_, idx) => (
                        <StudentSkeleton key={idx} />
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// ==================== HOMEWORK TAB SKELETONS ====================

// Skeleton cho một Exercise Row
export const ExerciseRowSkeleton: React.FC = () => (
    <div style={{
        borderBottom: '1px solid #f3f4f6',
        padding: '16px 24px'
    }}>
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
        }}>
            <div style={{ flex: 1, minWidth: '0' }}>
                <Skeleton height="22px" style={{ width: '70%', marginBottom: '8px' }} />
                <Skeleton height="18px" style={{ width: '90%' }} />
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <Skeleton width="80px" height="20px" />
                    <Skeleton width="60px" height="20px" />
                </div>
                <Skeleton width="120px" height="36px" borderRadius="8px" />
            </div>
        </div>
    </div>
);

// Skeleton cho Collection Section
export const CollectionSkeleton: React.FC<{ exerciseCount?: number }> = ({ exerciseCount = 3 }) => (
    <div style={{
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        marginBottom: '16px'
    }}>
        {/* Collection Header */}
        <div style={{
            padding: '1rem 1.5rem',
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Skeleton width="24px" height="24px" />
                <div style={{ flex: 1 }}>
                    <Skeleton height="24px" style={{ width: '40%', marginBottom: '8px' }} />
                    <Skeleton height="16px" style={{ width: '60%' }} />
                </div>
            </div>
        </div>

        {/* Exercise Rows */}
        <div style={{ backgroundColor: '#fff' }}>
            {Array.from({ length: exerciseCount }).map((_, idx) => (
                <ExerciseRowSkeleton key={idx} />
            ))}
        </div>
    </div>
);

// Skeleton cho toàn bộ Homework Tab
export const HomeWorkTabSkeleton: React.FC<{ collectionCount?: number }> = ({ collectionCount = 2 }) => (
    <div style={{ width: '100%' }}>
        {Array.from({ length: collectionCount }).map((_, idx) => (
            <CollectionSkeleton key={idx} exerciseCount={3} />
        ))}
    </div>
);

// ==================== CLASS DETAIL SKELETONS ====================

// Skeleton cho Class Header (banner)
export const ClassHeaderSkeleton: React.FC = () => (
    <div style={{
        padding: '1.5rem',
        marginBottom: '1.5rem',
        backgroundColor: '#f3f4f6',
        border: '1px solid #e0e0e0',
        borderRadius: '8px'
    }}>
        <Skeleton height="36px" style={{ width: '60%', marginBottom: '12px' }} />
        <Skeleton height="20px" style={{ width: '80%' }} />
    </div>
);

// Skeleton cho History Table Row
export const HistoryRowSkeleton: React.FC = () => (
    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
        <td style={{ padding: '0.75rem' }}>
            <Skeleton height="18px" width="120px" />
        </td>
        <td style={{ padding: '0.75rem' }}>
            <Skeleton height="18px" width="150px" />
        </td>
        <td style={{ padding: '0.75rem' }}>
            <Skeleton height="18px" width="100px" />
        </td>
        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
            <Skeleton height="28px" width="60px" borderRadius="20px" style={{ margin: '0 auto' }} />
        </td>
        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
            <Skeleton height="18px" width="50px" style={{ margin: '0 auto' }} />
        </td>
        <td style={{ padding: '0.75rem' }}>
            <Skeleton height="8px" borderRadius="9999px" />
            <Skeleton height="12px" width="40px" style={{ margin: '4px auto 0' }} />
        </td>
    </tr>
);

// Skeleton cho History Table
export const HistoryTableSkeleton: React.FC<{ rowCount?: number }> = ({ rowCount = 5 }) => (
    <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        overflow: 'hidden'
    }}>
        {/* Header */}
        <div style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb'
        }}>
            <Skeleton height="28px" width="250px" />
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    {['Học viên', 'Tên đề', 'Ngày làm', 'Điểm', 'Thời gian', 'Độ chính xác'].map((header, idx) => (
                        <th key={idx} style={{ padding: '0.75rem', textAlign: idx > 2 ? 'center' : 'left' }}>
                            <Skeleton height="18px" width="80px" />
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {Array.from({ length: rowCount }).map((_, idx) => (
                    <HistoryRowSkeleton key={idx} />
                ))}
                </tbody>
            </table>
        </div>
    </div>
);

// Skeleton cho Class Code Card
export const ClassCodeCardSkeleton: React.FC = () => (
    <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        padding: '1.5rem',
        marginBottom: '1.5rem'
    }}>
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
        }}>
            <Skeleton height="24px" width="100px" />
            <div style={{ display: 'flex', gap: '8px' }}>
                <Skeleton width="36px" height="36px" borderRadius="8px" />
                <Skeleton width="36px" height="36px" borderRadius="8px" />
            </div>
        </div>

        <div style={{
            backgroundColor: '#f3f4f6',
            border: '2px dashed #d1d5db',
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center'
        }}>
            <Skeleton height="48px" width="150px" style={{ margin: '0 auto' }} />
        </div>
    </div>
);

// ==================== EXERCISE DETAIL PAGE SKELETONS ====================

// Skeleton cho Header Card với back button
export const ExerciseHeaderSkeleton: React.FC = () => (
    <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '1.5rem',
        border: '1px solid #e5e7eb'
    }}>
        <Skeleton height="20px" width="80px" style={{ marginBottom: '12px' }} />
        <Skeleton height="48px" style={{ width: '70%', marginBottom: '1rem' }} />

        <div style={{
            display: 'flex',
            gap: '2rem',
            flexWrap: 'wrap',
            marginBottom: '1rem'
        }}>
            <Skeleton height="18px" width="250px" />
            <Skeleton height="18px" width="150px" />
            <Skeleton height="18px" width="120px" />
        </div>

        <Skeleton height="16px" style={{ width: '60%' }} />
    </div>
);

// Skeleton cho Tabs Navigation
export const ExerciseTabsSkeleton: React.FC = () => (
    <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px 12px 0 0',
        border: '1px solid #e5e7eb',
        borderBottom: 'none'
    }}>
        <div style={{
            display: 'flex',
            gap: '1rem',
            padding: '0 1rem',
            borderBottom: '1px solid #e5e7eb'
        }}>
            <Skeleton height="52px" width="100px" />
            <Skeleton height="52px" width="120px" />
            <Skeleton height="52px" width="140px" />
        </div>
    </div>
);

// Skeleton cho Practice Mode Content
export const PracticeModeContentSkeleton: React.FC = () => (
    <div>
        {/* Mode Toggle */}
        <div style={{
            display: 'inline-flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            padding: '0.25rem',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
        }}>
            <Skeleton width="100px" height="32px" borderRadius="6px" />
            <Skeleton width="100px" height="32px" borderRadius="6px" />
        </div>

        {/* Part Selection */}
        <div style={{ marginBottom: '2rem' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
            }}>
                <Skeleton height="24px" width="120px" />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Skeleton height="32px" width="100px" borderRadius="6px" />
                    <Skeleton height="32px" width="80px" borderRadius="6px" />
                </div>
            </div>

            {/* Part Checkboxes Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem'
            }}>
                {Array.from({ length: 7 }).map((_, idx) => (
                    <Skeleton key={idx} height="50px" borderRadius="8px" />
                ))}
            </div>
        </div>

        {/* Time Limit Selector */}
        <div style={{ maxWidth: '240px' }}>
            <Skeleton height="20px" width="140px" style={{ marginBottom: '0.5rem' }} />
            <Skeleton height="40px" borderRadius="8px" style={{ marginBottom: '1rem' }} />
            <Skeleton height="40px" borderRadius="8px" />
        </div>
    </div>
);

// Skeleton cho Test Mode Content
export const TestModeContentSkeleton: React.FC = () => (
    <div>
        {/* Info Box */}
        <div style={{
            padding: '1.5rem',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            border: '1px solid #fbbf24'
        }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Skeleton width="20px" height="20px" borderRadius="4px" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                    <Skeleton height="24px" style={{ width: '40%', marginBottom: '0.5rem' }} />
                    <Skeleton height="16px" style={{ width: '100%', marginBottom: '0.25rem' }} />
                    <Skeleton height="16px" style={{ width: '80%', marginBottom: '0.25rem' }} />
                    <Skeleton height="16px" style={{ width: '90%' }} />
                </div>
            </div>
        </div>

        <Skeleton height="40px" width="180px" borderRadius="8px" />
    </div>
);

// Skeleton cho History Table (My History / Student History)
export const HistoryTableSkeletonV2: React.FC<{ rowCount?: number }> = ({ rowCount = 5 }) => (
    <div>
        <Skeleton height="32px" style={{ width: '250px', marginBottom: '1rem' }} />

        {/* Desktop Table */}
        <div style={{
            overflowX: 'auto',
            display: window.innerWidth >= 768 ? 'block' : 'none'
        }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>
                        <Skeleton height="18px" width="80px" />
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>
                        <Skeleton height="18px" width="80px" />
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>
                        <Skeleton height="18px" width="100px" />
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <Skeleton height="18px" width="80px" style={{ marginLeft: 'auto' }} />
                    </th>
                </tr>
                </thead>
                <tbody>
                {Array.from({ length: rowCount }).map((_, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '0.75rem' }}>
                            <Skeleton height="18px" style={{ width: '140px', marginBottom: '8px' }} />
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <Skeleton height="20px" width="60px" borderRadius="4px" />
                                <Skeleton height="20px" width="50px" borderRadius="4px" />
                            </div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                            <Skeleton height="20px" width="80px" />
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                            <Skeleton height="18px" width="60px" />
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            <Skeleton height="36px" width="100px" borderRadius="6px" style={{ marginLeft: 'auto' }} />
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>

        {/* Mobile Cards */}
        <div style={{
            display: window.innerWidth < 768 ? 'flex' : 'none',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            {Array.from({ length: rowCount }).map((_, idx) => (
                <div key={idx} style={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1rem'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem',
                        paddingBottom: '0.75rem',
                        borderBottom: '1px solid #e5e7eb'
                    }}>
                        <Skeleton height="20px" width="120px" />
                        <Skeleton height="22px" width="70px" borderRadius="4px" />
                    </div>

                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
                        <Skeleton height="18px" width="60px" borderRadius="4px" />
                        <Skeleton height="18px" width="50px" borderRadius="4px" />
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.75rem',
                        marginBottom: '0.75rem'
                    }}>
                        <div>
                            <Skeleton height="14px" width="60px" style={{ marginBottom: '0.25rem' }} />
                            <Skeleton height="24px" width="70px" />
                        </div>
                        <div>
                            <Skeleton height="14px" width="70px" style={{ marginBottom: '0.25rem' }} />
                            <Skeleton height="24px" width="60px" />
                        </div>
                    </div>

                    <Skeleton height="40px" borderRadius="6px" />
                </div>
            ))}
        </div>
    </div>
);

// Skeleton cho Student History với Statistics
export const StudentHistoryContentSkeleton: React.FC = () => (
    <div>
        <Skeleton height="32px" style={{ width: '250px', marginBottom: '1rem' }} />

        {/* Statistics Grid */}
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
        }}>
            {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} style={{
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                }}>
                    <Skeleton height="14px" width="80px" style={{ marginBottom: '0.5rem' }} />
                    <Skeleton height="32px" width="60px" />
                </div>
            ))}
        </div>

        {/* Table */}
        <HistoryTableSkeletonV2 rowCount={5} />
    </div>
);

// Skeleton cho Tab Content (wrapper tổng hợp)
export const ExerciseTabContentSkeleton: React.FC<{ tab?: 'practice' | 'myHistory' | 'studentHistory' }> = ({
                                                                                                                tab = 'practice'
                                                                                                            }) => (
    <div style={{
        backgroundColor: '#fff',
        borderRadius: '0 0 12px 12px',
        border: '1px solid #e5e7eb',
        padding: '2rem',
        minHeight: '400px'
    }}>
        {tab === 'practice' && <PracticeModeContentSkeleton />}
        {tab === 'myHistory' && <HistoryTableSkeletonV2 rowCount={5} />}
        {tab === 'studentHistory' && <StudentHistoryContentSkeleton />}
    </div>
);

// Skeleton cho toàn bộ Exercise Detail Page
export const ExerciseDetailPageSkeleton: React.FC = () => (
    <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <ExerciseHeaderSkeleton />
            <ExerciseTabsSkeleton />
            <ExerciseTabContentSkeleton tab="practice" />

            {/* Comment Section Skeleton */}
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '2rem',
                marginTop: '1.5rem',
                border: '1px solid #e5e7eb'
            }}>
                <Skeleton height="28px" width="150px" style={{ marginBottom: '1.5rem' }} />
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <Skeleton width="48px" height="48px" borderRadius="50%" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <Skeleton height="80px" borderRadius="8px" style={{ marginBottom: '0.5rem' }} />
                        <Skeleton height="36px" width="100px" borderRadius="6px" />
                    </div>
                </div>
                {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} style={{
                        display: 'flex',
                        gap: '1rem',
                        padding: '1rem 0',
                        borderTop: '1px solid #f3f4f6'
                    }}>
                        <Skeleton width="40px" height="40px" borderRadius="50%" style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <Skeleton height="18px" width="120px" style={{ marginBottom: '0.5rem' }} />
                            <Skeleton height="16px" style={{ width: '90%', marginBottom: '0.25rem' }} />
                            <Skeleton height="16px" style={{ width: '70%' }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// ==================== EXPORT DEFAULT ====================
export default Skeleton;
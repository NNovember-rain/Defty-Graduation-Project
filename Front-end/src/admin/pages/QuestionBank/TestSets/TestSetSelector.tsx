import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaSearch, FaTimes, FaCheckCircle, FaCalendar, FaLayerGroup } from 'react-icons/fa';

// Sử dụng interface này hoặc import từ service của bạn
export interface ITestSet {
    id: string;
    testName?: string;  // optional vì có thể dùng name
    name?: string;      // optional vì có thể dùng testName
    slug?: string;
    totalQuestions?: number | null;
    collectionName?: string | null;
    createdDate?: string;
    description?: string;
}

interface TestSetSelectorProps {
    testSets: ITestSet[];
    selectedTestSetId: string;
    onSelect: (testSetId: string) => void;
    loading?: boolean;
    disabled?: boolean;
    placeholder?: string;
    error?: string;
}

const TestSetSelector: React.FC<TestSetSelectorProps> = ({
                                                             testSets,
                                                             selectedTestSetId,
                                                             onSelect,
                                                             loading = false,
                                                             disabled = false,
                                                             placeholder = 'Chọn đề thi',
                                                             error
                                                         }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedTestSet = testSets.find(test => test.id === selectedTestSetId);

    // Get test name (support both testName and name)
    const getTestName = (test: ITestSet) => test.testName || test.name || '';

    // Filter test sets based on search query
    const filteredTestSets = testSets.filter(test =>
        getTestName(test).toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.collectionName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleToggle = () => {
        if (!disabled && !loading) {
            setIsOpen(!isOpen);
            if (!isOpen) {
                setSearchQuery('');
            }
        }
    };

    const handleSelect = (testSetId: string) => {
        onSelect(testSetId);
        setIsOpen(false);
        setSearchQuery('');
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const highlightText = (text: string, query: string) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === query.toLowerCase() ? (
                        <mark key={i} className="bg-yellow-200 text-gray-900">{part}</mark>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </span>
        );
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Selected Value Display */}
            <div
                onClick={handleToggle}
                className={`
                    w-full px-4 py-3 rounded-lg border bg-white cursor-pointer
                    transition-all duration-200 flex items-center justify-between
                    ${selectedTestSet ? 'border-gray-800 bg-gray-50' : 'border-gray-300'}
                    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
                    ${error ? 'border-red-300' : ''}
                `}
            >
                <div className="flex-1 min-w-0">
                    {selectedTestSet ? (
                        <div>
                            <div className="font-medium text-gray-900 truncate">
                                {getTestName(selectedTestSet)}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                {selectedTestSet.totalQuestions !== null && (
                                    <span className="flex items-center gap-1">
                                        <FaCheckCircle className="text-green-500"/>
                                        {selectedTestSet.totalQuestions || 0} câu
                                    </span>
                                )}
                                {selectedTestSet.collectionName && (
                                    <span className="flex items-center gap-1">
                                        <FaLayerGroup/>
                                        {selectedTestSet.collectionName}
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                <FaChevronDown
                    className={`ml-2 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? 'transform rotate-180' : ''
                    }`}
                />
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg">
                    {/* Search Bar */}
                    <div className="p-3 border-b border-gray-200">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"/>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm đề thi..."
                                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes/>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Test Set List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {filteredTestSets.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                <div className="text-4xl mb-2">🔍</div>
                                <div className="text-sm">
                                    {searchQuery ? 'Không tìm thấy đề thi phù hợp' : 'Không có đề thi nào'}
                                </div>
                            </div>
                        ) : (
                            <div className="py-1">
                                {filteredTestSets.map((test) => (
                                    <div
                                        key={test.id}
                                        onClick={() => handleSelect(test.id)}
                                        className={`
                                            px-4 py-3 cursor-pointer transition-colors
                                            hover:bg-gray-50 border-l-4
                                            ${test.id === selectedTestSetId
                                            ? 'bg-gray-50 border-gray-800'
                                            : 'border-transparent'
                                        }
                                        `}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 mb-1">
                                                    {highlightText(getTestName(test), searchQuery)}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                                    {test.totalQuestions !== null && (
                                                        <span className="flex items-center gap-1">
                                                            <FaCheckCircle className="text-green-500"/>
                                                            <span className="font-medium text-green-700">
                                                                {test.totalQuestions || 0}
                                                            </span>
                                                            <span>câu hỏi</span>
                                                        </span>
                                                    )}
                                                    {test.collectionName && (
                                                        <span className="flex items-center gap-1">
                                                            <FaLayerGroup/>
                                                            {highlightText(test.collectionName, searchQuery)}
                                                        </span>
                                                    )}
                                                    {test.createdDate && (
                                                        <span className="flex items-center gap-1">
                                                            <FaCalendar/>
                                                            {formatDate(test.createdDate)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {test.id === selectedTestSetId && (
                                                <FaCheckCircle className="text-gray-800 text-lg flex-shrink-0"/>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer Info */}
                    {filteredTestSets.length > 0 && (
                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                            Hiển thị {filteredTestSets.length} / {testSets.length} đề thi
                        </div>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mt-1 text-sm text-red-600">
                    {error}
                </div>
            )}
        </div>
    );
};

export default TestSetSelector;
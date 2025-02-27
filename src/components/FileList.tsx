'use client';

import { useState, useMemo } from 'react';
import { FileData, FileType } from '@/types/file';
import { motion } from 'framer-motion';
import { FiDownload, FiTrash2, FiEye, FiDownloadCloud, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface FileListProps {
    files: FileData[];
    userRole: string;
    isLoading?: boolean;
    onDownload: (downloadURL: string, fileName: string) => void;
    onDelete?: (id: string) => void;
}

type SortOption = 'newest' | 'oldest' | 'largest' | 'smallest' | 'name';

export default function FileList({ files, userRole, isLoading, onDownload, onDelete }: FileListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<FileType | 'all'>('all');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const truncateFileName = (name: string, maxLength: number = 90) => {
        if (name.length <= maxLength) return name;
        const extension = name.split('.').pop();
        const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
        const truncatedName = nameWithoutExt.substring(0, maxLength - 3 - (extension?.length || 0));
        return `${truncatedName}...${extension ? `.${extension}` : ''}`;
    };

    const getFileIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'pdf':
                return (
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            case 'doc':
            case 'docx':
                return (
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            case 'xls':
            case 'xlsx':
                return (
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
        }
    };

    const filteredAndSortedFiles = useMemo(() => {
        const result = files.filter(file => {
            const searchMatch = (file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               file.title.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const typeMatch = selectedType === 'all' || file.type === selectedType;

            return searchMatch && typeMatch;
        });

        return result.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'largest':
                    return b.size - a.size;
                case 'smallest':
                    return a.size - b.size;
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });
    }, [files, searchTerm, selectedType, sortBy]);

    const paginatedFiles = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedFiles.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAndSortedFiles, currentPage]);

    const totalPages = Math.ceil(filteredAndSortedFiles.length / itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (files.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
                <p className="text-gray-500">File yoxdur.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Arama ve filtreleme */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex flex-col gap-4">
                    <div className="w-full">
                        <input
                            type="text"
                            placeholder="Fayl axtar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value as FileType | 'all')}
                            className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                        >
                            <option value="all">Bütün Fayllar</option>
                            <option value="pdf">PDF</option>
                            <option value="word">Word</option>
                            <option value="excel">Excel</option>
                            <option value="other">Diğər</option>
                        </select>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                        >
                            <option value="newest">Yeni Fayllar</option>
                            <option value="oldest">Köhnə Fayllar</option>
                            <option value="largest">Böyük Ölçülü</option>
                            <option value="smallest">Kiçik Ölçülü</option>
                            <option value="name">Ad siyahısına</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Dosya listesi */}
            <div className="bg-white rounded-2xl shadow-sm divide-y mt-4">
                {paginatedFiles.map((file, index) => (
                    <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 gap-4"
                    >
                        <div className="flex items-start space-x-4 min-w-0">
                            <div className="flex-shrink-0 pt-1">
                                {getFileIcon(file.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 break-all line-clamp-2 sm:line-clamp-1">
                                    {truncateFileName(file.title || file.name)}
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-xs text-gray-500">
                                    <span>{new Date(file.createdAt).toLocaleDateString('tr-TR')}</span>
                                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                                {file.description && (
                                    <p className="text-sm text-gray-500 mt-1 break-all line-clamp-2">
                                        {file.description}
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-4 mt-4 sm:mt-0">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 text-gray-500 text-sm">
                                    <FiEye className="w-4 h-4" />
                                    <span>{file.views}</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500 text-sm">
                                    <FiDownloadCloud className="w-4 h-4" />
                                    <span>{file.downloads}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onDownload(file.downloadURL, file.name)}
                                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                    title="İndir"
                                >
                                    <FiDownload className="w-5 h-5" />
                                </button>
                                
                                {userRole === 'admin' && onDelete && (
                                    <button
                                        onClick={() => onDelete(file.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                        title="Sil"
                                    >
                                        <FiTrash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
                <div className="flex flex-wrap justify-center items-center gap-2 mt-4 pb-4">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <FiChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="flex flex-wrap gap-2 justify-center">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                                    currentPage === page
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                    
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <FiChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
} 
'use client';

import { useState, useMemo } from 'react';
import { FileData, FileType } from '@/types/file';
import { motion } from 'framer-motion';
import { FiDownload, FiTrash2, FiEye, FiDownloadCloud } from 'react-icons/fi';

interface FileListProps {
    files: FileData[];
    userRole: string;
    isLoading?: boolean;
    onDownload: (downloadURL: string) => void;
    onDelete?: (id: string, path: string) => void;
}

type SortOption = 'newest' | 'oldest' | 'largest' | 'smallest' | 'name';

export default function FileList({ files, userRole, isLoading, onDownload, onDelete }: FileListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<FileType | 'all'>('all');
    const [sortBy, setSortBy] = useState<SortOption>('newest');

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
        let result = files.filter(file => {
            // İsim ve başlık filtresi
            const searchMatch = (file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               file.title.toLowerCase().includes(searchTerm.toLowerCase()));
            
            // Dosya tipi filtresi
            const typeMatch = selectedType === 'all' || file.type === selectedType;

            return searchMatch && typeMatch;
        });

        // Sıralama
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
                <p className="text-gray-500">Henüz dosya yüklenmemiş.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Arama ve filtreleme */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex flex-wrap gap-4 text-black">
                    <div className="flex-1 min-w-[200px]">
                        <input
                            type="text"
                            placeholder="Dosya ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value as FileType | 'all')}
                        className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="all">Tüm Dosyalar</option>
                        <option value="pdf">PDF</option>
                        <option value="word">Word</option>
                        <option value="excel">Excel</option>
                        <option value="other">Diğer</option>
                    </select>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="newest">En Yeni</option>
                        <option value="oldest">En Eski</option>
                        <option value="largest">En Büyük</option>
                        <option value="smallest">En Küçük</option>
                        <option value="name">İsme Göre</option>
                    </select>
                </div>
            </div>

            {/* Dosya listesi */}
            <div className="bg-white rounded-2xl shadow-sm divide-y">
                {filteredAndSortedFiles.map((file, index) => (
                    <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="p-4 flex items-center justify-between hover:bg-gray-50"
                    >
                        <div className="flex items-center space-x-4">
                            {getFileIcon(file.type)}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {file.title || file.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {new Date(file.createdAt).toLocaleDateString('tr-TR')} • {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                {file.description && (
                                    <p className="text-sm text-gray-500 mt-1 truncate">
                                        {file.description}
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                            <div className="flex items-center space-x-1 text-gray-500 text-sm">
                                <FiEye className="w-4 h-4" />
                                <span>{file.views}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-gray-500 text-sm">
                                <FiDownloadCloud className="w-4 h-4" />
                                <span>{file.downloads}</span>
                            </div>
                            <button
                                onClick={() => onDownload(file.downloadURL)}
                                className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                title="İndir"
                            >
                                <FiDownload className="w-5 h-5" />
                            </button>
                            
                            {userRole === 'admin' && onDelete && (
                                <button
                                    onClick={() => onDelete(file.id, file.path)}
                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Sil"
                                >
                                    <FiTrash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
} 
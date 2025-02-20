'use client';

import { useState, useMemo } from 'react';
import { File, FileType } from '@/types/file';
import { UserRole } from '@/types/user';

interface FileListProps {
    files: File[];
    userRole: UserRole;
}

type SortOption = 'newest' | 'oldest' | 'largest' | 'smallest' | 'name';

export default function FileList({ files, userRole }: FileListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<FileType | 'all'>('all');
    const [sortBy, setSortBy] = useState<SortOption>('newest');

    const handleDownload = (file: File) => {
        // TODO: Implement file download logic
        window.open(file.url, '_blank');
    };

    const handleDelete = async (fileId: string) => {
        // TODO: Implement file deletion logic
        console.log('Delete file:', fileId);
    };

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'pdf':
                return (
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            case 'word':
                return (
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            case 'excel':
                return (
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const filteredAndSortedFiles = useMemo(() => {
        let result = files.filter(file => {
            // İsim filtresi
            const nameMatch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Dosya tipi filtresi
            const typeMatch = selectedType === 'all' || file.type === selectedType;

            return nameMatch && typeMatch;
        });

        // Sıralama
        return result.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
                case 'oldest':
                    return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
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

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Filtreleme ve Sıralama Araçları */}
            <div className="p-4 border-b border-gray-200 space-y-4">
                <div className="flex flex-wrap gap-4">
                    {/* İsim Arama */}
                    <div className="flex-1 min-w-[200px]">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                            Dosya Adı
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="search"
                                className="appearance-none w-full rounded-xl bg-white border border-gray-200 px-4 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 transition-all duration-200"
                                placeholder="Dosya adı ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Dosya Tipi Filtresi */}
                    <div className="w-48">
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                            Dosya Tipi
                        </label>
                        <div className="relative">
                            <select
                                id="type"
                                className="appearance-none w-full rounded-xl bg-white border border-gray-200 px-4 py-2.5 pr-8 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 transition-all duration-200"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value as FileType | 'all')}
                            >
                                <option value="all">Tüm Dosyalar</option>
                                <option value="pdf">PDF Dosyaları</option>
                                <option value="word">Word Dosyaları</option>
                                <option value="excel">Excel Dosyaları</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Sıralama Seçenekleri */}
                    <div className="w-48">
                        <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                            Sırala
                        </label>
                        <div className="relative">
                            <select
                                id="sort"
                                className="appearance-none w-full rounded-xl bg-white border border-gray-200 px-4 py-2.5 pr-8 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 transition-all duration-200"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                            >
                                <option value="newest">En Yeni Yüklenen</option>
                                <option value="oldest">En Eski Yüklenen</option>
                                <option value="largest">En Büyük Boyut</option>
                                <option value="smallest">En Küçük Boyut</option>
                                <option value="name">A'dan Z'ye</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dosya Listesi */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Dosya
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tip
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Boyut
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Yüklenme Tarihi
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                İşlemler
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAndSortedFiles.map((file) => (
                            <tr key={file.id} className="hover:bg-gray-50 transition-colors duration-150">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {getFileIcon(file.type)}
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{file.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-gray-500">{file.type.toUpperCase()}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(file.uploadedAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => handleDownload(file)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors duration-150"
                                    >
                                        İndir
                                    </button>
                                    {userRole === 'admin' && (
                                        <button
                                            onClick={() => handleDelete(file.id)}
                                            className="text-red-600 hover:text-red-900 transition-colors duration-150"
                                        >
                                            Sil
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredAndSortedFiles.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                    Dosya bulunamadı
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
} 
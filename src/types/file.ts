export interface FileData {
    id: string;
    name: string;
    title: string;
    description: string;
    size: number;
    type: string;
    uploadedAt: string;
    downloadURL: string;
    path: string;
    status: 'active' | 'deleted';
    views: number;
    downloads: number;
    uploadedBy: string;
    uploadedByEmail: string;
    url: string;
    createdAt: string;
}

export type FileType = 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'other' | 'word' | 'excel'; 
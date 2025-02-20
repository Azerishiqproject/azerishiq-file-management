export type FileType = 'pdf' | 'word' | 'excel';

export interface File {
    id: string;
    name: string;
    type: FileType;
    size: number;
    uploadedBy: string;
    uploadedAt: Date;
    url: string;
    description?: string;
} 
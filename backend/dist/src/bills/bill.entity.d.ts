export type BillStatus = 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'paid' | 'rejected' | 'archived';
export type BillLineItem = {
    description: string;
    amount: number;
    category: string;
};
export type BillHistoryEntry = {
    status: BillStatus;
    date: string;
    comment?: string;
};
export declare class Bill {
    id: string;
    vendorId: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    amount: number;
    notes?: string;
    status: BillStatus;
    lineItems: BillLineItem[];
    history: BillHistoryEntry[];
    createdAt: string;
    updatedAt: string;
}

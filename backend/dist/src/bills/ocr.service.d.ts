type ExtractedInvoice = {
    vendorName: string | null;
    totalAmount: number | null;
    invoiceDate: string | null;
    dueDate: string | null;
    currency: string | null;
};
export declare class OcrService {
    private readonly logger;
    extractInvoiceFromFile(file: {
        buffer: Buffer;
        mimetype: string;
    }): Promise<ExtractedInvoice>;
}
export {};

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var OcrService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OcrService = void 0;
const common_1 = require("@nestjs/common");
const openai_1 = __importDefault(require("openai"));
const pdf_parse_1 = require("pdf-parse");
const SYSTEM_PROMPT = 'Eres un experto contable. Extrae de este documento de factura los siguientes campos en formato JSON: vendorName, totalAmount (number), invoiceDate (ISO string), dueDate (ISO string), y currency. Si no encuentras alguno, devuelve null.';
const MAX_PDF_TEXT_CHARS = 14_000;
function delay(ms) {
    return new Promise((resolve) => {
        globalThis.setTimeout(resolve, ms);
    });
}
const SIMULATED_INVOICE = {
    vendorName: 'Acme Corp',
    totalAmount: 1500,
    invoiceDate: '2026-04-20T00:00:00.000Z',
    dueDate: '2026-05-20T00:00:00.000Z',
    currency: 'USD',
};
function isImageMime(mimetype) {
    return /^image\/(jpeg|png|gif|webp)$/i.test(mimetype);
}
function parseExtractedJson(content) {
    const parsed = JSON.parse(content);
    return {
        vendorName: parsed.vendorName ?? null,
        totalAmount: parsed.totalAmount === null || parsed.totalAmount === undefined
            ? null
            : Number(parsed.totalAmount),
        invoiceDate: parsed.invoiceDate ?? null,
        dueDate: parsed.dueDate ?? null,
        currency: parsed.currency ?? null,
    };
}
let OcrService = OcrService_1 = class OcrService {
    logger = new common_1.Logger(OcrService_1.name);
    async extractInvoiceFromFile(file) {
        if (!file?.buffer || !file?.mimetype) {
            throw new common_1.BadRequestException('File is required');
        }
        const apiKey = process.env.OPENAI_API_KEY?.trim();
        if (!apiKey) {
            this.logger.log('OpenAI Key not found, using simulation mode');
            await delay(2000);
            return { ...SIMULATED_INVOICE };
        }
        const client = new openai_1.default({ apiKey });
        const mimetype = file.mimetype.toLowerCase();
        if (mimetype === 'application/pdf') {
            const parser = new pdf_parse_1.PDFParse({ data: file.buffer });
            const { text } = await parser.getText();
            const trimmed = text.replaceAll(/\s+/g, ' ').trim();
            if (!trimmed) {
                throw new common_1.BadRequestException('This PDF has no extractable text (it may be scanned). Upload a PNG or JPEG of the invoice, or use a text-based PDF.');
            }
            const excerpt = trimmed.length > MAX_PDF_TEXT_CHARS ? trimmed.slice(0, MAX_PDF_TEXT_CHARS) : trimmed;
            const completion = await client.chat.completions.create({
                model: 'gpt-4o-mini',
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: `El siguiente texto fue extraído de un PDF de factura. Extrae los datos:\n\n${excerpt}`,
                    },
                ],
            });
            const content = completion.choices[0]?.message?.content;
            if (!content) {
                throw new common_1.InternalServerErrorException('OpenAI returned an empty OCR response');
            }
            return parseExtractedJson(content);
        }
        if (isImageMime(mimetype)) {
            const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
            const completion = await client.chat.completions.create({
                model: 'gpt-4o-mini',
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: 'Extrae los datos de esta factura (imagen).' },
                            { type: 'image_url', image_url: { url: dataUrl } },
                        ],
                    },
                ],
            });
            const content = completion.choices[0]?.message?.content;
            if (!content) {
                throw new common_1.InternalServerErrorException('OpenAI returned an empty OCR response');
            }
            return parseExtractedJson(content);
        }
        throw new common_1.BadRequestException(`Unsupported file type: ${file.mimetype}. Use PDF or an image (JPEG, PNG, GIF, WebP).`);
    }
};
exports.OcrService = OcrService;
exports.OcrService = OcrService = OcrService_1 = __decorate([
    (0, common_1.Injectable)()
], OcrService);
//# sourceMappingURL=ocr.service.js.map
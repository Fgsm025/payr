import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PDFParse } from 'pdf-parse';

type ExtractedInvoice = {
  vendorName: string | null;
  totalAmount: number | null;
  invoiceDate: string | null;
  dueDate: string | null;
  currency: string | null;
};

const SYSTEM_PROMPT =
  'You are an accounting expert. Extract the following fields from this invoice document in JSON format: vendorName, totalAmount (number), invoiceDate (ISO string), dueDate (ISO string), and currency. If any field is not found, return null.';

const MAX_PDF_TEXT_CHARS = 14_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

const SIMULATED_INVOICE: ExtractedInvoice = {
  vendorName: 'Acme Corp',
  totalAmount: 1500,
  invoiceDate: '2026-04-20T00:00:00.000Z',
  dueDate: '2026-05-20T00:00:00.000Z',
  currency: 'USD',
};

function isImageMime(mimetype: string): boolean {
  return /^image\/(jpeg|png|gif|webp)$/i.test(mimetype);
}

function parseExtractedJson(content: string): ExtractedInvoice {
  const parsed = JSON.parse(content) as Partial<ExtractedInvoice>;
  return {
    vendorName: parsed.vendorName ?? null,
    totalAmount:
      parsed.totalAmount === null || parsed.totalAmount === undefined
        ? null
        : Number(parsed.totalAmount),
    invoiceDate: parsed.invoiceDate ?? null,
    dueDate: parsed.dueDate ?? null,
    currency: parsed.currency ?? null,
  };
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  async extractInvoiceFromFile(file: { buffer: Buffer; mimetype: string }): Promise<ExtractedInvoice> {
    if (!file?.buffer || !file?.mimetype) {
      throw new BadRequestException('File is required');
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      this.logger.log('OpenAI Key not found, using simulation mode');
      await delay(2000);
      return { ...SIMULATED_INVOICE };
    }

    const client = new OpenAI({ apiKey });
    const mimetype = file.mimetype.toLowerCase();

    if (mimetype === 'application/pdf') {
      const parser = new PDFParse({ data: file.buffer });
      const { text } = await parser.getText();
      const trimmed = text.replaceAll(/\s+/g, ' ').trim();
      if (!trimmed) {
        throw new BadRequestException(
          'This PDF has no extractable text (it may be scanned). Upload a PNG or JPEG of the invoice, or use a text-based PDF.',
        );
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
        throw new InternalServerErrorException('OpenAI returned an empty OCR response');
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
        throw new InternalServerErrorException('OpenAI returned an empty OCR response');
      }
      return parseExtractedJson(content);
    }

    throw new BadRequestException(`Unsupported file type: ${file.mimetype}. Use PDF or an image (JPEG, PNG, GIF, WebP).`);
  }
}

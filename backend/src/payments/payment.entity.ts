export class Payment {
  id: string;
  billId: string;
  amount: number;
  paymentDate: string;
  method: 'ach' | 'wire' | 'check';
  reference?: string;
}

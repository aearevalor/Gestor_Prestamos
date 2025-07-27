
export interface RawItemData {
  placa: string;
  descripcion: string;
  crea: string;
  cantidad: number;
}

export interface Item {
  uniqueKey: string;
  placa: string;
  description: string;
  crea: string;
  isConsumable: boolean;
  initialQuantity: number;
}

export enum LoanStatus {
  LOANED = 'En Préstamo',
  RETURNED = 'Devuelto',
}

export interface Loan {
  id: string;
  item: Item;
  requesterName: string;
  loanedQuantity: number;
  loanTimestamp: Date;
  returnTimestamp: Date | null;
  receiverSignature: string; // base64 string
  returnerSignature: string | null; // base64 string
  status: LoanStatus;
}

import firebase from "firebase/app";

export class Payments {
  transactionId: string;
  amountPay: number;
  totalAmount: number;
  totalDueAmount: number;
  buyModelId: string;
  signal: number;

  price
  paymentMethod: number;
  charges: number;
  chargePercentage: number;

  customerId: string;
  customerMonthId: string;
  customerName: string;
  customerMobile: string;

  serviceId: string;
  serviceName: string;
  packageId: string;
  packageName: string;

  timestamp: firebase.firestore.Timestamp;
}

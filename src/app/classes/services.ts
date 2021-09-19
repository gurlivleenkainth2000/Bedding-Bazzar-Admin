import firebase from 'firebase/app';
import { Category } from './category';

export class Services {
  serviceName: string;
  serviceId: string;
  numberOfSitting: number;
  consumedSitting?: number;
  gifted?: number;
  price: number;
  description: string;
  sessionDuration: number;
  category?: Category;
  imageUrl: string;
  active?: boolean;
  createdOn?: firebase.firestore.Timestamp;
}

export class CustomerServiceModel {
  serviceName: string;
  serviceId: string;
  numberOfSitting: number;
  price: number;
  remainingAmount: number;
  description: string;
  sessionDuration: number;
  customerId: string;
  customerMonthId: string;
  customerServiceId: string;
  customerName: string;
  customerMobile: string;
  active?: boolean;
  imageUrl?: string;
  createdOn?: firebase.firestore.Timestamp;
}

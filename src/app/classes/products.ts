import firebase from 'firebase/app';
import { Category } from './category';

export class Products {
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


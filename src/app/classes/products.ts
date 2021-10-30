import firebase from 'firebase/app';
import { Category } from './category';

export class Products {
  productName: string;
  productId: string;
  description: string;
  price: number;
  category?: Category;
  imageUrls: string[];
  thumbnailImage: number;
  active?: boolean;
  showOnHomePage: boolean;
  createdOn?: firebase.firestore.Timestamp;
}


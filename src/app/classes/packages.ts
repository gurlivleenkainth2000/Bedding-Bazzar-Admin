import firebase from "firebase/app";
import { Products } from "./products";

export class Packages {
  packageId: string;
  name: string;
  description: string;
  price: number;
  services: Products[];
  imageUrl: string;
  createdOn: firebase.firestore.Timestamp;
  active: boolean;
  validity: number;
  // fromDate: firebase.firestore.Timestamp;
  // toDate: firebase.firestore.Timestamp;

}

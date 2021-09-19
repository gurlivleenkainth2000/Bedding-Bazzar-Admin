import firebase from "firebase/app";
import { Services } from "./services";

export class Packages {
  packageId: string;
  name: string;
  description: string;
  price: number;
  services: Services[];
  imageUrl: string;
  createdOn: firebase.firestore.Timestamp;
  active: boolean;
  validity: number;
  // fromDate: firebase.firestore.Timestamp;
  // toDate: firebase.firestore.Timestamp;

}

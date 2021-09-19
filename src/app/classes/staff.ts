import firebase from "firebase/app";
import { Services } from "./services";

export class Staff {
  name: string;
  mobile: string;
  email: string;
  authId: string;
  monthlyStaffId: string;
  staffId: string;
  address: string;
  imageUrl: string;
  gender: string;
  active: boolean;
  createdOn: firebase.firestore.Timestamp;
  salary: number;
  services?: Services[];
  servicesHashcode?: string[];
}

import firebase from "firebase/app";

export class Customers {
  name: string;
  email: string;
  mobile: string;
  monthlyCustomerId: string;
  customerId: string;
  authId: string;
  address: string;
  imageUrl: string;
  gender: number;
  createdOn: firebase.firestore.Timestamp;
  active: boolean;
  token?: string;
  linkedUserList:string[] = [];

}

import firebase from "firebase/app";
import { Customers } from "./customers";
export class Queries {
  answer: string;
  monthlyQueryId: string;
  status: boolean;
  queryId: string;
  query: string;
  date: firebase.firestore.Timestamp;
  answerDate: firebase.firestore.Timestamp;
  customerModel: Customers
}

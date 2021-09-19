import firebase from "firebase/app";
export class Category {
  categoryName: string;
  categoryId: string;
  createdOn: firebase.firestore.Timestamp;
  active: boolean;
}

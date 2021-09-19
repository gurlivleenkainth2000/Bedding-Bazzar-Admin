import firebase from "firebase/app";

export class Offers {
  offerId: string;
  title: string;
  description: string;
  imageUrl: string;
  validTill: firebase.firestore.Timestamp
  createdOn: firebase.firestore.Timestamp;
  active: boolean;
}

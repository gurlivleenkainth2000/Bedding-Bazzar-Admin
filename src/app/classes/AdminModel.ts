import firebase from "firebase/app";
export class AdminModel {
  authId: string;
  adminId: string;
  name: string;
  email: string;
  // password: string;
  status: boolean;
  roles: any;
  createdOn: firebase.firestore.Timestamp;
}

//0 image
//1 pdf
//2 video

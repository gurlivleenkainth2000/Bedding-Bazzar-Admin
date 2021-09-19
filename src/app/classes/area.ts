import {Customers} from "./customers"

export class Area{
  areaId: string;
  title: string;
  description: string;
  type: number; // 0 -> assignable || 1 -> Non assignable
  status: number; // 0 -> available || 1 -> Occupied
  createdOn: firebase.default.firestore.Timestamp;
}

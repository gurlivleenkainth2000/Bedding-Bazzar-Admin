import firebase from "firebase/app";
import { Services } from "./services";

export class BuyModel {
  // Buy Model
  buyModelId: string;
  signal: number; // 0 -> Service | 1 -> Package

  price: number;
  discountPrice: number;
  fromDate: firebase.firestore.Timestamp;
  toDate: firebase.firestore.Timestamp;
  totalAmount: number;
  totalDueAmount: number;
  // numberOfSitting: number;
  // remainingSitting: number;

  // For Package
  packageId: string;
  packageName: string;
  description: string;
  servicesHashCode: string[];
  serviceCategoriesHashcode: string[];
  services: Services[];

  // For Service
  serviceId: string;
  serviceName: string;
  // sessionDuration: number;
  // categoryId: string;
  // categoryName: string;

  // Customer Details
  customerId: string;
  customerMonthId: string;
  customerMobile: string;
  customerName: string;

  // From Customer Details
  fromCustomerId: string;
  fromCustomerMonthId: string;
  fromCustomerMobile: string;
  fromCustomerName: string;

  // Additional
  createdOn: firebase.firestore.Timestamp;
  active: boolean;
}

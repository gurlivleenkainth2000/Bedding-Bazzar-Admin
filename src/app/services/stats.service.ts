import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import * as util from './../utils';
import firebase from 'firebase/app';
import { DatePipe } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class StatsService {

  constructor(
    private dbRef: AngularFirestore
  ) { }

  maintainGlobalStats(key: string ,bool: boolean ){
    // this.dbRef.collection(util.GLOBAL_STATS).doc(util.GLOBAL_STATS).set({
    //   [key]: firebase.firestore.FieldValue.increment(bool? 1 : -1)
    // },{merge:true})
  }

  // maintainServiceCustomerStats(res: BuyModel) {
  //   let today: Date = new Date();
  //   let month = new DatePipe('en').transform(today, 'yyyyMM');

  //   this.dbRef.collection(res.signal ? util.PACKAGES_COLLECTION : util.PRODUCTS_COLLECTION)
  //     .doc(res.signal ? res.packageId : res.serviceId)
  //     .collection(res.signal ? util.PACKAGE_STATS_COLLECTION : util.SERVICE_STATS_COLLECTION).doc(month)
  //     .set({
  //       statsId: month,
  //       customersCount: firebase.firestore.FieldValue.increment(1),
  //     }, { merge: true })
  // }

  // maintainServicePaymentStats(paymentObj: Payments) {
  //   let today: Date = new Date();
  //   let month = new DatePipe('en').transform(today, 'yyyyMM');
  //   let date = today.getDate();

  //   this.dbRef.collection(paymentObj.signal ? util.PACKAGES_COLLECTION : util.PRODUCTS_COLLECTION)
  //     .doc(paymentObj.signal ? paymentObj.packageId : paymentObj.serviceId)
  //     .collection(paymentObj.signal ? util.PACKAGE_STATS_COLLECTION : util.SERVICE_STATS_COLLECTION).doc(month)
  //     .set({
  //       [paymentObj.paymentMethod ? 'cardDaily': 'cashDaily' ]: {
  //         [date]: firebase.firestore.FieldValue.increment(paymentObj.amountPay)
  //       }
  //     }, { merge: true });
  // }

}

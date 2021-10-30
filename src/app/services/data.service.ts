import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { Customers } from '../classes/customers';
import { Images } from '../classes/images';
import { Products } from '../classes/products';
import { sliderImages } from '../classes/slider';
import { Videos } from '../classes/videos';
import { ToastrService } from 'ngx-toastr';
import { formatDate } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Category } from '../classes/category';
import { Queries } from '../classes/queries';
import * as util from './../utils';
import firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  docLimit: number = 50;
  monthId: string;

  customersSub = new BehaviorSubject<Customers[]>([]);
  customerLastDocs = new BehaviorSubject<any>(null);
  customersRetrieved: boolean = false;

  queriesSub = new BehaviorSubject<Queries[]>([]);
  queryLastDocs = new BehaviorSubject<any>(null);
  queriesRetrieved: boolean = false;

  productCategorySub = new BehaviorSubject<Category[]>([]);
  productCategoryLastDocs = new BehaviorSubject<any>(null);
  categoryRetrieved: boolean = false;

  productSub = new BehaviorSubject<Products[]>([]);
  productLastDocs = new BehaviorSubject<any>(null);
  productRetrieved: boolean = false;

  imagessSub = new BehaviorSubject<Images[]>([]);
  imagesLastDocs = new BehaviorSubject<any>(null);
  imagesRetrieved: boolean = false;

  sliderSub = new BehaviorSubject<sliderImages[]>([]);
  sliderLastDocs = new BehaviorSubject<any>(null);
  sliderRetrieved: boolean = false;

  videosSub = new BehaviorSubject<Videos[]>([]);
  videosLastDocs = new BehaviorSubject<any>(null);
  videosRetrieved: boolean = false;

  constructor(
    private dbRef: AngularFirestore,
    private toast: ToastrService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe(res => {
      this.monthId = res['month'] || formatDate(new Date(), 'yyyyMM', 'en-us');
    })
  }

  canWriteCheck(url?) {
    return true;
    // if (JSON.parse(localStorage.getItem("admin")).roles[url || this.router.url.replace("/", "").split("/")[0]] == 2) {
    //   return true;
    // } else {
    //   return false;
    // }
  }

  getCustomers(monthlyId: string) {
    this.dbRef.collection(util.MONTHLY_CUSTOMERS_COLLECTION).doc(monthlyId)
      .collection(util.CUSTOMERS_COLLECTION, ref => ref.orderBy("createdOn", "desc").limit(this.docLimit))
      .get().toPromise()
      .then((response) => {
        if (response.docs.length != 0) {
          let customersList = response.docs.map((ele, idx) => {
            let cusObj: Customers = Object.assign({}, ele.data() as Customers);
            this.customerLastDocs.next(ele);
            return cusObj
          });
          this.customersSub.next(customersList);
          this.customersRetrieved = true;
        } else {
          this.customersSub.next([]);
        }
      })
  }

  getCategories() {
    if (!this.categoryRetrieved)
      this.dbRef.collection(util.PRODUCT_CATEGORY_COLLECTION, (ref) => ref.orderBy("categoryName", "asc"))
        .get().toPromise()
        .then((response) => {
          let productCategoryList: Category[] = response.docs.map(ele => {
            let productCategoryObj: Category = Object.assign({}, ele.data() as Category);
            this.productCategoryLastDocs.next(ele);
            return productCategoryObj;

          })
          this.productCategorySub.next(productCategoryList);
          this.categoryRetrieved = true;
        })
  }

  getProducts() {
    if (!this.productRetrieved) {
      this.dbRef.collection(util.PRODUCTS_COLLECTION, (ref) =>
        ref.orderBy("serviceName", "asc").limit(this.docLimit)
      )
        .get().toPromise()
        .then((response) => {
          let productList: Products[] = response.docs.map(ele => {
            let prodObj: Products = Object.assign({}, ele.data() as Products);
            this.productLastDocs.next(ele);
            return prodObj;
          })
          this.productSub.next(productList);
          this.productRetrieved = true;
        });
    }
  }

  getQueries(monthlyId: string) {
    this.dbRef.collection(util.MONTHLY_QUERIES_COLLECTION).doc(monthlyId)
      .collection(util.QUERIES_COLLECTION, ref => ref.orderBy("date", "desc").limit(this.docLimit))
      .get().toPromise()
      .then((response) => {
        if (response.size != 0) {
          let queriesList = response.docs.map((ele, idx) => {
            let queryObj: Queries = Object.assign({}, ele.data() as Queries);
            this.queryLastDocs.next(ele);
            return queryObj
          });
          this.queriesSub.next(queriesList);
          this.queriesRetrieved = true;
        } else {
          this.queriesSub.next([]);
          // let datePipe: DatePipe = new DatePipe('en-us');
          // let month = parseInt(monthlyId.substr(4));
          // let year = parseInt(monthlyId.substr(0, 4));
          // this.toast.info(`No Queries found for ${datePipe.transform(new Date(year, month, 0), 'MMMM yyyy')}`, "");
          // this.router.navigate([], { queryParams: { month: datePipe.transform(new Date(), 'yyyyMM') }, replaceUrl: true })
        }
      })
  }

  checkMobileExists(collectionName: string, mobile: string) {
    return new Promise((resolve, reject) => {
      this.dbRef.collectionGroup(collectionName, ref => ref.where('mobile', '==', mobile))
        .get()
        .toPromise()
        .then((value) => {
          if (value.size != 0) {
            resolve(true);
          } else {
            resolve(false);
          }
        }, (error) => { })
    })
  }

  // getDailyVisits(fromDate: Date, toDate: Date) {
  //   this.dbRef
  //     .collectionGroup(util.DAILY_VISIT_COLLECTION, (ref) =>
  //       ref.where("date", ">=", fromDate).where("date", "<=", toDate)
  //     )
  //     .valueChanges()
  //     .subscribe(
  //       (response) => {
  //         let list: DailyVisitModel[] = response.map(e => Object.assign({}, e as DailyVisitModel));
  //         this.dailyVisitModelSub.next(list);
  //         this.dailyVisitModelRetrieved = true;
  //         // this.dailyVisitList = response.map((e) => Object.assign({}, e as DailyVisitModel));
  //         // this.changeDetector.detectChanges();
  //         // // this.tempList = this.dailyVisitList;
  //         // this.getDetails(
  //         //   this.dailyVisitList[this.selectedRowIndex || 0],
  //         //   this.selectedRowIndex || 0
  //         // );
  //       },
  //       (err) => {}
  //     );
  // }

  // getExtras() {
  //   if(!this.extrasRetrieved) {
  //     this.dbRef.collection(util.EXTRAS_COLLECTION).doc(util.EXTRAS_COLLECTION)
  //       .get().toPromise()
  //       .then((res) => {
  //         this.extraSub.next(Object.assign({}, res.data() as Extras));
  //         this.creditChargesSub.next((res.data() as Extras).creditCharges);
  //         this.bannerTextSub.next((res.data() as Extras).bannerText);
  //         this.extrasRetrieved = true;
  //       }, (err) => {

  //       })
  //   }
  // }

  // getRoles() {
  //   const compare_to_sort = (x, y) => {
  //     if (x.title < y.title) return -1;
  //     if (x.title > y.title) return 1;
  //     return 0;
  //   }

  //   if(!this.rolesRetreived) {
  //     this.dbRef.collection(util.ROLES_COLLECTION).doc(util.ROLES_COLLECTION)
  //       .get().toPromise()
  //       .then((res) => {
  //         let resObj = Object.assign({}, res.data() as any);
  //         this.rolesSub.next(Object.assign([], resObj['roleList'] as any[]).sort(compare_to_sort));
  //         this.rolesRetreived = true;
  //       }, (err) => { })
  //   }
  // }

  // getAdmins() {
  //   if(!this.adminsRetreived) {
  //     this.dbRef.collection(util.ADMINS_COLLECTION)
  //       .get().toPromise()
  //       .then((res) => {
  //         this.adminSub.next(res.docs.map(e => Object.assign({}, e.data() as AdminModel)));
  //         this.adminsRetreived = true;
  //       }, (err) => { })
  //   }
  // }

  // getAreas(){
  //   if(!this.areasRetrieved)
  //   this.dbRef.collection(util.AREAS_COLLECTION, ref => ref.orderBy("type","asc").orderBy("title","asc"))
  //   .valueChanges()
  //   .subscribe((response) => {
  //     this.areaSub.next(response as Area[]);
  //     this.areasRetrieved = true;

  //   })
  //   // .get().toPromise()
  //   // .then((response) => {
  //   //   let areasList: Area[] = response.docs.map(ele => {
  //   //     let areaObj: Area = Object.assign({}, ele.data() as Area);
  //   //     this.areaLastDocs.next(ele);
  //   //     return areaObj;
  //   //   })
  //   // })
  // }

  // getCustomerServices(customerMonthId: string, customerId: string) {
  //   this.dbRef.collection(util.MONTHLY_CUSTOMERS_COLLECTION).doc(customerMonthId)
  //     .collection(util.CUSTOMERS_COLLECTION).doc(customerId)
  //     .collection(util.CUSTOMER_PRODUCTS_COLLECTION, ref => ref.orderBy('createdOn', 'desc'))
  //     .snapshotChanges()
  //     .subscribe((res) => {
  //       let servicesList = res.map((ele) => {
  //         let cusServiceObj: BuyModel = Object.assign({}, ele.payload.doc.data() as BuyModel);
  //         this.customerproductLastDocs.next(ele);
  //         return cusServiceObj;
  //       });
  //       this.customerproductSub.next(servicesList);
  //     }, (error) => {
  //       // console.log(">>> Something went wrong!! while fetching data ferom server");
  //       // console.log(error);
  //     })
  // }

  // getStaff() {
  //   if (!this.staffRetrieved) {
  //     this.dbRef.collectionGroup(util.STAFFS_COLLECTION, (ref) => ref.orderBy("createdOn", "desc").limit(this.docLimit))
  //       .get().toPromise()
  //       .then((response) => {
  //         if (response.docs.length != 0) {
  //           let staffList = response.docs.map((ele, idx) => {
  //             let staffObj: Staff = Object.assign({}, ele.data() as Staff);
  //             this.staffLastDocs.next(ele);
  //             return staffObj;
  //           });
  //           this.staffSub.next(staffList);
  //           this.staffRetrieved = true;
  //         }
  //       });
  //   }
  // }

  // getPackages() {
  //   if (!this.packageRetrieved)
  //   this.dbRef.collection(util.PACKAGES_COLLECTION, ref => ref.orderBy('createdOn', 'desc').limit(this.docLimit))
  //     .get().toPromise()
  //     .then((response) => {
  //       let packagesList: Packages[] = response.docs.map(ele => {
  //         let serviceCategoryObj: Packages = Object.assign({}, ele.data() as Packages);
  //         this.productCategoryLastDocs.next(ele);
  //         return serviceCategoryObj;
  //       })
  //       this.packagesSub.next(packagesList);
  //       this.packageRetrieved = true;

  //     })
  // }
}

import { DatePipe, formatDate } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import firebase from 'firebase/app';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Customers } from 'src/app/classes/customers';
import { DataService } from 'src/app/services/data.service';
import { StatsService } from 'src/app/services/stats.service';
import * as util from 'src/app/utils';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent implements OnInit {

  @ViewChild('monthYear') monthYear: ElementRef;

  customerForm: FormGroup;
  searchCustomerByMobileFB: FormGroup;
  searchCustomerByDateFB: FormGroup;
  selectedMonth: string;

  today: Date;
  selectedMonthYear: Date;
  fromDate: Date;
  toDate: Date;
  sort: firebase.firestore.OrderByDirection;

  monthlyId: string;
  tempImageFile: any = null;

  customersList: Customers[] = [];

  docLimit: number = 50;
  searching: number = 0;
  lastDocs: any;
  customerModel: Customers;
  customerSub: Subscription;

  loader: boolean = false;
  showLoadMore: boolean = false;
  updation: boolean = false;
  showDateRange: boolean = false;

  mobile: string;
  filterOption: number;
  customerFetchLoader: boolean = false;
  // Customer Details will be save for deletion operation
  cusDeleteObj: {
    id: string;
    monthId: string;
    imageUrl: string;
  };


  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private dbRef: AngularFirestore,
    private stgRef: AngularFireStorage,
    private toast: ToastrService,
    private data: DataService,
    private statsService: StatsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.today = new Date();
    this.selectedMonth = new DatePipe('en').transform(this.today, 'yyyy-MM')
    this.route.queryParams.subscribe(res => {
      // // console.log(res['fromDae']);
      if(res['fromDate'] == undefined){
        this.filterOption = 1;
        this.monthlyId = res['month'] || formatDate(this.today, 'yyyyMM', 'en-us');
        let month = parseInt(this.monthlyId.substr(4));
        let year = parseInt(this.monthlyId.substr(0, 4));
        this.selectedMonthYear = new Date(year, month, 0);

        // if(this.monthYear != undefined) {
        //   this.monthYear.nativeElement.value = null;
        // }
      } else {
        this.searching = 2;
        this.filterOption = 0;
        this.fromDate = new Date(res.fromDate);
        this.toDate = new Date(res.toDate);
        this.sort = res.sort as firebase.firestore.OrderByDirection || 'asc';
        this.fromDate.setHours(0, 0, 0);
        this.toDate.setHours(23, 59, 59);
        this.fetchCustomersOnDateRange();
      }


    });
    this.router.events.subscribe(e => {
      if(e instanceof NavigationStart || e instanceof NavigationEnd) {
        if(this.searching == 0) {
          this.data.getCustomers(this.monthlyId)
          this.getCustomers();
        }
      }
    })
   }

  ngOnInit(): void {

    // this.monthlyId = formatDate(this.today, 'yyyyMM', 'en-us');
    // // console.log(">>> " + this.monthlyId);
    // this.getCustomers();
    // this.getCustomers();

    if(this.searching != 2) {
      this.searchCustomerByDateFB = this.fb.group({
        fromDate: [null],
        toDate: [null],
        sort: ['asc']
      })
    } else {
      this.searchCustomerByDateFB = this.fb.group({
        fromDate: [formatDate(this.fromDate, "yyyy-MM-dd", 'en')],
        toDate: [formatDate(this.toDate, "yyyy-MM-dd", 'en')],
        sort: [this.sort]
      })
    }

  }

  fetchPreviousMonthCustomers() {
    this.today = new Date(this.today.getFullYear(), this.today.getMonth() - 1, 1);
    this.monthlyId = formatDate(this.today, "yyyyMM", "en-us");
    this.getCustomers();
  }

  getCustomers() {
    // this.data.getCustomers(this.monthlyId);
    this.customerSub = this.data.customersSub.subscribe(res => {
      if(res.length < this.docLimit) {
        this.showLoadMore = false;
      } else {
        this.showLoadMore = true;
      }

      if(res.length != 0) {
        this.customersList = res;
      } else {
        this.customersList = [];
      }

    });
  }

  loadMoreCustomers() {
    if(this.lastDocs == undefined) {
      this.data.customerLastDocs.subscribe(res => {
        if(res != null) {
          this.lastDocs = res;
        }
      });
    }
    this.dbRef.collection(util.MONTHLY_CUSTOMERS_COLLECTION).doc(this.monthlyId)
      .collection(util.CUSTOMERS_COLLECTION, ref => ref.orderBy("createdOn", "desc").startAfter(this.lastDocs).limit(this.docLimit))
      .get().toPromise()
      .then((response) => {
        if(response.docs.length < this.docLimit) {
          this.showLoadMore = false;
        } else {
          this.showLoadMore = true;
        }

        if(response.docs.length != 0) {
          response.docs.forEach((ele, idx) => {
            let cusObj: Customers = Object.assign({}, ele.data() as Customers);
            this.lastDocs = ele;
            this.data.customerLastDocs.next(ele);
            this.customersList.push(cusObj);
          });
          this.data.customersSub.next(this.customersList);
        } else {
          this.toast.show('No More Records', '');
        }
      })
  }

  openSearchModal() {
    if(this.searching != 2) {
      this.searchCustomerByDateFB = this.fb.group({
        fromDate: [null],
        toDate: [null],
        sort: ['asc']
      })
    } else {
      this.searchCustomerByDateFB = this.fb.group({
        fromDate: [formatDate(this.fromDate, "yyyy-MM-dd", 'en')],
        toDate: [formatDate(this.toDate, "yyyy-MM-dd", 'en')],
        sort: [this.sort]
      })
    }
  }

  getCustomerOnDateRange(form: FormGroup) {
    let formValues = { ...form.value };
    this.fromDate = new Date(formValues.fromDate);
    this.toDate = new Date(formValues.toDate);
    this.fromDate.setHours(0, 0, 0);
    this.toDate.setHours(23, 59, 59);
    this.sort = formValues.sort as firebase.firestore.OrderByDirection;
    this.fetchCustomersOnDateRange();
  }

  fetchCustomersOnDateRange() {
    this.dbRef.collectionGroup(util.CUSTOMERS_COLLECTION, ref =>
      ref.where("createdOn", ">=", this.fromDate).where('createdOn', '<=', this.toDate)
        .orderBy("createdOn", this.sort).limit(this.docLimit)
    ).get().toPromise()
    .then((response) => {
      if(response.docs.length < this.docLimit) {
        this.showLoadMore = false;
      } else {
        this.showLoadMore = true;
      }

      if(response.size != 0) {
        // // console.log(response.docs.map(e => e.data()));
        this.searching = 2;
        this.router.navigate([], {
          queryParams: {
            fromDate:  this.fromDate.toLocaleDateString(),
            toDate:  this.toDate.toLocaleDateString(),
            sort: this.sort
          }
        })
        this.customersList = response.docs.map(e => {
          this.lastDocs = e;
          return Object.assign({}, e.data() as Customers);
        })

      } else {
        let datePipe: DatePipe = new DatePipe('en-us');
        this.toast.info(`No Records found from ${datePipe.transform(this.fromDate, 'yyyy-MM-dd')} till ${datePipe.transform(this.toDate, 'yyyy-MM-dd')}`, "");
      }
      this.modalService.dismissAll();
    }, (error) => {
      // console.log(error);
      this.toast.warning("Something went wrong!! Please Try Again...")
    })
  }

  loadCustomersOnDateRange() {
    this.dbRef.collectionGroup(util.CUSTOMERS_COLLECTION, ref =>
      ref.where("createdOn", ">=", this.fromDate).where('createdOn', '<=', this.toDate)
        .orderBy("createdOn", this.sort).startAfter(this.lastDocs).limit(this.docLimit)
    ).get().toPromise()
    .then((response) => {
      if(response.docs.length < this.docLimit) {
        this.showLoadMore = false;
      } else {
        this.showLoadMore = true;
      }

      if(response.size != 0) {
        this.searching = 2;
        response.docs.forEach((cust, idx) => {
          this.customersList.push({ ...Object.assign({}, cust.data() as Customers) });
          this.lastDocs = cust;
        })

      } else {
        let datePipe: DatePipe = new DatePipe('en-us');
        this.toast.info(`No Records found from ${datePipe.transform(this.fromDate, 'yyyy-MM-dd')} till ${datePipe.transform(this.toDate, 'yyyy-MM-dd')}`, "");
      }
      this.modalService.dismissAll();
    }, (error) => {
      // console.log(error);
      this.toast.warning("Something went wrong!! Please Try Again...")
    })
  }


  getCustomerOnMobile(form: FormGroup | string, newUserModal, viewUserModal) {
    this.customerFetchLoader = true;
    let formValues: string = form instanceof FormGroup ? form.value['mobile'] : form;
    if(!new RegExp("[0-9]{10}").test(formValues)) {
      this.customerFetchLoader = false;
      this.toast.warning("Invalid Mobile", "", {
        timeOut: 4000,
        positionClass: 'toast-top-right'
      })
      return;
    }
    this.dbRef.collectionGroup(util.CUSTOMERS_COLLECTION, ref => ref.where("mobile", "==", formValues))
      .get().toPromise()
      .then((res) => {
        // this.modalService.dismissAll();
        this.customerFetchLoader = false;
        if(res.size != 0) {
          let cust = Object.assign({}, res.docs[0].data() as Customers);
          this.viewInformationDetailed(cust.customerId, cust.monthlyCustomerId);
          // this.viewCustomerDetails(viewUserModal, Object.assign({}, res.docs[0].data() as Customers));
          // this.searching = 1;
        } else {
          this.toast.info(`No Customer Record Found related to MOBILE (${formValues})`, '', {
            timeOut: 1000
          });
        }
      })
  }

  clearFilter() {
    if(this.searching == 2) {
      // unsetting the fromDate and toDate filter annd deleting them completly using delete operator
      this.fromDate = undefined;
      this.toDate = undefined;
      delete(this.fromDate);
      delete(this.toDate);
      this.searchCustomerByDateFB.reset();
      this.router.navigate([], { queryParams: { month: new DatePipe('en').transform(this.today, 'yyyyMM')}, replaceUrl: true });
      this.data.customerLastDocs.subscribe(res => { if(res != null) this.lastDocs = res; }).unsubscribe();
    } else {
      this.getCustomers();
    }
    this.searching = 0;
  }

  fetchParticularMonthCustomers(month: string) {
    this.router.navigate([], { queryParams: { month: month.replace('-', "") }, queryParamsHandling: 'merge' });
  }

  viewInformationDetailed(customerId: string, customerMonthId: string) {
    this.router.navigate([customerId, "services"], { relativeTo: this.route, queryParamsHandling: 'preserve' });
  }

  viewCustomerDetails(modal, customerObj: Customers) {
    this.customerModel = customerObj;
    this.modalService.open(modal, { size: 'lg' });
  }

  openModal(modal, customer: Customers = null, mobile?: string) {
    this.modalService.open(modal, { size: 'sm' });
    this.initialiseModal(customer, mobile);
  }

  openDeleteModal(modal, customer: Customers) {
    this.modalService.open(modal, { size: 'sm' });
    this.cusDeleteObj = {
      id: customer.customerId,
      monthId: customer.monthlyCustomerId,
      imageUrl: customer.imageUrl
    }
  }

  initialiseModal(customerObj: Customers, mobile?) {
    if(customerObj == null) {
      this.updation = false;
      this.customerForm = this.fb.group({
        name: ['', [Validators.required]],
        email: [''],
        monthlyCustomerId: [this.monthlyId],
        customerId: [this.dbRef.createId()],
        authId: [''],
        address: [''],
        mobile: [mobile, [Validators.required, Validators.pattern("[0-9]{10}")]],
        active: [true],
        gender: [0],
        imageUrl: [''],
        createdOn: [firebase.firestore.Timestamp.now()]
      });
      // // console.log(">>> doc: ", this.customerForm.get('customerId').value);

    } else {
      this.updation = true;
      this.customerForm = this.fb.group({
        name: [customerObj.name, [Validators.required]],
        email: [customerObj.email],
        monthlyCustomerId: [customerObj.monthlyCustomerId],
        customerId: [customerObj.customerId],
        authId: [customerObj.authId],
        address: [customerObj.address],
        mobile: [customerObj.mobile, [Validators.required, Validators.pattern("[0-9]{10}")]],
        active: [customerObj.active],
        gender: [customerObj.gender || 0],
        imageUrl: [customerObj.imageUrl],
        createdOn: [customerObj.createdOn]
      });
    }
  }

  checkImageFileType(files) {
    this.tempImageFile = files[0];
    if (
      this.tempImageFile.type == "image/png" ||
      this.tempImageFile.type == "image/jpeg" ||
      this.tempImageFile.type == "image/jpg"
    ) {
      // // console.log("File Ok");
    } else {
      // // console.log("File not Ok");
      this.tempImageFile = null;
      this.toast.show("Invalid Image Format. Only .jpg/.jpeg/.png supported", "");
    }
  }

  async registeredCustomer(form: FormGroup) {
    this.loader = true;
    let customerObj: Customers = { ...form.value };

    if(!this.updation) {
      this.loader = false;
      let check = await this.data.checkMobileExists(util.CUSTOMERS_COLLECTION, customerObj.mobile);
      if(check) {
        this.toast.warning("Mobile Already Exists!! Use Another One", "", {
          timeOut: 4000,
          positionClass: 'toast-top-right'
        })
        return;
      }
    }

    if (this.tempImageFile != null) {
      const file = this.tempImageFile;
      const FilePath = "customers/" + this.tempImageFile.name;
      const FileRef = this.stgRef.ref(FilePath);
      await this.stgRef.upload(FilePath, file);
      customerObj.imageUrl = await FileRef.getDownloadURL().toPromise();
    }

    this.dbRef.collection(util.MONTHLY_CUSTOMERS_COLLECTION).doc(this.monthlyId)
      .collection(util.CUSTOMERS_COLLECTION).doc(customerObj.customerId)
      .set(customerObj, { merge: true })
      .then(() => {
        this.loader = false;
        if(this.updation) {
          let index = this.customersList.findIndex(x => x.customerId == customerObj.customerId);
          this.customersList[index] = { ...customerObj };
          this.toast.show("User Updated Successfully", "");
        } else {
          this.customersList.splice(0, 0, customerObj);
          this.dbRef.collection(util.MONTHLY_CUSTOMERS_COLLECTION).doc(this.monthlyId)
          .set({
            monthlyId: this.monthlyId,
            customersCount: firebase.firestore.FieldValue.increment(1)
          }, { merge: true })
          this.toast.show("User Registered Successfully", "");
          this.statsService.maintainGlobalStats(util.CUSTOMERS_COLLECTION,true)
        }
        this.updation = false;
        this.tempImageFile = null;
        this.modalService.dismissAll()
      }, (error) => {
        // console.log(">>> Error", error);
        this.loader = false;
        this.toast.warning("Something went wrong!! Please Try Again", "");
      })
  }

  async deleteCustomer() {
    if(this.cusDeleteObj.imageUrl != '') {
      await this.stgRef.refFromURL(this.customerModel.imageUrl);
    }
    this.dbRef.collection(util.MONTHLY_CUSTOMERS_COLLECTION).doc(this.cusDeleteObj.monthId)
      .collection(util.CUSTOMERS_COLLECTION).doc(this.cusDeleteObj.id)
      .delete()
      .then(() => {
        let index = this.customersList.findIndex(x => x.customerId == this.cusDeleteObj.id);
        this.customersList.splice(index, 1);
        this.modalService.dismissAll()
        this.toast.show("User Deleted Successfully", "");
        this.dbRef.collection(util.MONTHLY_CUSTOMERS_COLLECTION).doc(this.cusDeleteObj.monthId)
        .set({
          monthlyId: this.monthlyId,
          customersCount: firebase.firestore.FieldValue.increment(-1)
        }, { merge: true })
        this.statsService.maintainGlobalStats(util.CUSTOMERS_COLLECTION,false)
      }, (error) => {
        // console.log(">>> Error", error);
        this.loader = false;
        this.toast.warning("Something went wrong!! Please Try Again", "");
      })
  }
}

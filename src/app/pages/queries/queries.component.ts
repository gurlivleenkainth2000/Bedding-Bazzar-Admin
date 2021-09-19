import { Component, OnInit, Query } from '@angular/core';

import { Queries } from 'src/app/classes/queries';
import * as util from 'src/app/utils';
import { Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AngularFirestore } from '@angular/fire/firestore';
import { ToastrService } from 'ngx-toastr';
import { formatDate, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, NavigationEnd, NavigationStart } from '@angular/router';
import firebase from 'firebase/app';
import { DataService } from 'src/app/services/data.service';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-queries',
  templateUrl: './queries.component.html',
  styleUrls: ['./queries.component.scss']
})
export class QueriesComponent implements OnInit {

  queryForm: FormGroup;
  searchCustomerByMobileFB: FormGroup;
  searchCustomerByDateFB: FormGroup;

  monthlyId: string;
  queriesList: Queries[] = [];
  tempList: Queries[] = [];
  queriesListSub: Subscription;

  todayDate: Date;
  fromDate: Date;
  toDate: Date;
  selectedMonthYear: Date;

  searched: boolean = false;
  loader: boolean = false;
  searching: number = 0;
  queryModal: Queries;

  lastDocs: any;
  docLimit: number = 50;
  showLoadMore: boolean = false;
  sort: firebase.firestore.OrderByDirection;

  selectedMonth: string;

  constructor(
    private modalService: NgbModal,
    private dbRef: AngularFirestore,
    private toast: ToastrService,
    private router: Router,
    private route: ActivatedRoute,
    private data: DataService,
    private fb: FormBuilder
  ) {
    this.todayDate = new Date();
    this.selectedMonth = new DatePipe('en').transform(this.todayDate, "yyyy-MM")
    this.route.queryParams.subscribe(res => {
      // // console.log(res['fromDae']);
      if (res['fromDate'] == undefined) {
        this.monthlyId = res['month'] || formatDate(this.todayDate, 'yyyyMM', 'en-us');
        let month = parseInt(this.monthlyId.substr(4));
        let year = parseInt(this.monthlyId.substr(0, 4));
        this.selectedMonthYear = new Date(year, month, 0);

        // if(this.monthYear != undefined) {
        //   this.monthYear.nativeElement.value = null;
        // }
      } else {
        this.searching = 2;
        this.fromDate = new Date(res.fromDate);
        this.toDate = new Date(res.toDate);
        this.fromDate.setHours(0, 0, 0);
        this.toDate.setHours(23, 59, 59);
        this.fetchQueriesOnDateRange();
      }
    });

    this.router.events.subscribe(e => {
      if (e instanceof NavigationStart || e instanceof NavigationEnd) {
        if (this.searching == 0) {
          this.data.getQueries(this.monthlyId);
          this.getQueries();
        }
      }
    })

  }

  ngOnInit(): void {

   }

  getQueries() {
    this.queriesListSub = this.data.queriesSub.subscribe(response => {
      if (response.length < this.docLimit) {
        this.showLoadMore = false;
      } else {
        this.showLoadMore = true;
      }

      if(response.length != 0) {
        this.queriesList = response
      } else {
        this.queriesList = [];
      }
    })
  }

  loadMore() {
    this.dbRef
      .collection(util.MONTHLY_QUERIES_COLLECTION).doc(formatDate(this.todayDate, 'yyyyMM', 'en-us'))
      .collection(
        util.QUERIES_COLLECTION,
        ref => ref.where("date", ">=", this.fromDate).where('date', '<=', this.toDate)
          .orderBy('date', 'desc')
          .startAfter(this.lastDocs)
          .limit(this.docLimit)
      )
      .get()
      .toPromise()
      .then((response) => {
        if (response.docs.length < this.docLimit) {
          this.showLoadMore = false;
        } else {
          this.showLoadMore = true;
        }
        response.forEach(item => {
          this.queriesList.push(item.data() as Queries);
          this.lastDocs = item;
        });
      });
  }

  openSearchModal(modal) {
    this.modalService.open(modal, { size: 'sm' });
    this.searchCustomerByMobileFB = this.fb.group({
      mobile: [null]
    });

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

  getQueiresOnMobile(form: FormGroup) {
    let formValues = { ...form.value };
    // // console.log(formValues);
    this.dbRef.collectionGroup(util.QUERIES_COLLECTION, ref => ref.where("customerModel.mobile", "==", formValues.mobile))
      .get().toPromise()
      .then((res) => {
        if(res.size != 0) {
          // // console.log();
          this.queriesList = res.docs.map(e => Object.assign({}, e.data() as Queries));
          this.searching = 1;
        } else {
          this.toast.info(`No Queries Found related to MOBILE (${formValues.mobile})`)
        }
        this.modalService.dismissAll();
      })
  }

  getQueriesOnDateRange(form: FormGroup) {
    let formValues = { ...form.value };
    this.fromDate = new Date(formValues.fromDate);
    this.toDate = new Date(formValues.toDate);
    this.fromDate.setHours(0, 0, 0);
    this.toDate.setHours(23, 59, 59);
    this.sort = formValues.sort as firebase.firestore.OrderByDirection;
    this.fetchQueriesOnDateRange();
  }

  fetchParticularMonthQueries(month: string) {
    this.router.navigate([], { queryParams: { month: month.replace('-', "") }, queryParamsHandling: 'merge' });
  }

  fetchQueriesOnDateRange() {
    this.dbRef.collectionGroup(util.QUERIES_COLLECTION, ref =>
      ref.where("date", ">=", this.fromDate).where('date', '<=', this.toDate)
        .orderBy("date", this.sort).limit(this.docLimit)
    ).get().toPromise()
      .then((response) => {
        if (response.size != 0) {
          // // console.log(response.docs.map(e => e.data()));
          this.searching = 2;
          this.router.navigate([], {
            queryParams: {
              fromDate: this.fromDate.toLocaleDateString(),
              toDate: this.toDate.toLocaleDateString(),
              sort: this.sort
            }
          })
          this.queriesList = response.docs.map(e => {
            this.lastDocs = e;
            return Object.assign({}, e.data() as Queries);
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

  clearFilter() {
    if(this.searching == 2) {
      // unsetting the fromDate and toDate filter annd deleting them completly using delete operator
      this.fromDate = undefined;
      this.toDate = undefined;
      delete(this.fromDate)
      delete(this.toDate)
      this.router.navigate([], { queryParams: { month: new DatePipe('en').transform(this.todayDate, 'yyyyMM')}, replaceUrl: true })
    } else {
      this.getQueries();
    }
    this.searching = 0;
  }

  openReplyModal(modal, query: Queries) {
    this.modalService.open(modal, { size: 'sm' });
    this.queryForm = this.fb.group({
      query: [query.query],
      queryId: [query.queryId],
      answer: [query.answer],
      answerDate: [firebase.firestore.Timestamp.now()],
      monthlyQueryId: [query.monthlyQueryId],
      status: [true]
    });
  }

  async replyQuery(form: FormGroup) {
    this.loader = true;
    let queryObj: Queries = { ...form.value };
    this.dbRef.collection(util.MONTHLY_QUERIES_COLLECTION).doc(queryObj.monthlyQueryId)
    .collection(util.QUERIES_COLLECTION).doc(queryObj.queryId)
    .update(queryObj)
    .then(() => {
      let idx = this.queriesList.findIndex(x => x.queryId === queryObj.queryId);
      this.queriesList[idx].answerDate = queryObj.answerDate;
      this.queriesList[idx].answer = queryObj.answer;
      this.queriesList[idx].status = queryObj.status;

      this.dbRef.collection(util.MONTHLY_QUERIES_COLLECTION).doc(queryObj.monthlyQueryId)
        .update({ pending: firebase.firestore.FieldValue.increment(-1) });
      this.toast.show("Query Answered Successfully", "");
      this.modalService.dismissAll();
      this.loader = false;
    }, (error) => {
      console.error(">>> error: ", error);
      this.loader = false;
      this.toast.show("Something went wrong!! Please Try Again...", "");
    })
  }

}

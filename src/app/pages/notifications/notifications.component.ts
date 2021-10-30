import { Component, OnInit } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { FormBuilder, FormGroup } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from "ngx-toastr";
import firebase from "firebase/app";
import * as util from "./../../utils";
import { Notification } from "src/app/classes/notifications";
import { DataService } from "src/app/services/data.service";

@Component({
  selector: "app-notifications",
  templateUrl: "./notifications.component.html",
  styleUrls: ["./notifications.component.scss"],
})
export class NotificationsComponent implements OnInit {
  notificationForm: FormGroup;
  today: Date = new Date();
  notificationList: Notification[] = [];
  lastDocs: any;
  docLimit: number = 50;
  showLoadMore: boolean = false;
  notificationModel: Notification;
  loader: boolean = false;
  canWrite: boolean;

  constructor(
    private fb: FormBuilder,
    private afs: AngularFirestore,
    private modalService: NgbModal,
    private toast: ToastrService,
    private data: DataService
  ) {}

  ngOnInit(): void {
    this.canWrite = this.data.canWriteCheck();
    this.getNotifications();
  }

  openDeleteModal(modal, notification: Notification) {
    this.modalService.open(modal, { size: "sm" });
    this.notificationModel = notification;
  }

  openNotificationModal(modal, notification: Notification = null) {
    this.modalService.open(modal, { size: "sm" });
    this.initializeModal(notification);
  }

  initializeModal(notificationObj: Notification) {
    this.notificationForm = this.fb.group({
      title: [""],
      description: [""],
      notificationId: [this.afs.createId()],
      Date: [firebase.firestore.Timestamp.now()],
    });
  }

  sendNotification(form: FormGroup) {
    this.loader = true;
    let notificationObj: Notification = { ...form.value };
    this.afs
      .collection(util.NOTIFICATION_COLLECTION)
      .doc(notificationObj.notificationId)
      .set(notificationObj, { merge: true })
      .then(
        () => {
          this.loader = false;
          this.notificationList.splice(0, 0, notificationObj);
          this.toast.show("Notification Sent");
          this.modalService.dismissAll();
        },
        (error) => {
          // console.log(error);
          this.loader = false;
          this.toast.warning("Something went wrong! Please try again");
        }
      );
  }

  getNotifications() {
    this.afs
      .collection(util.NOTIFICATION_COLLECTION, (ref) =>
        ref.orderBy("Date", "desc").limit(this.docLimit)
      )
      .get()
      .toPromise()
      .then((response) => {
        if (response.docs.length < this.docLimit) {
          this.showLoadMore = false;
        } else {
          this.showLoadMore = true;
        }
        if (response.docs.length != 0) {
          response.docs.forEach((ele, idx) => {
            let notificationObj: Notification = Object.assign(
              {},
              ele.data() as Notification
            );
            this.lastDocs = ele;
            this.notificationList.push(notificationObj);
            // this.data.imagesLastDocs.next(ele);
          });
        }
      });
  }

  deleteNotification() {
    this.afs
      .collection(util.NOTIFICATION_COLLECTION)
      .doc(this.notificationModel.notificationId)
      .delete()
      .then(
        () => {
          let index = this.notificationList.findIndex(
            (x) => x.notificationId == this.notificationModel.notificationId
          );
          this.notificationList.splice(index, 1);
          this.modalService.dismissAll();
          this.toast.show("Notification Deleted Successfully !");
          // this.statsService.maintainGlobalStats(util.OFFERS_COLLECTION,false)
        },
        (error) => {
          // console.log(error);
          this.toast.warning("Something went wrong ! Please try again.");
        }
      );
  }
}

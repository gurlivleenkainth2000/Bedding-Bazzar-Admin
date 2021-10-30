import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Offers } from 'src/app/classes/offers';
import { DataService } from 'src/app/services/data.service';
import { StatsService } from 'src/app/services/stats.service';
import firebase from 'firebase/app';
import * as util from "src/app/utils"

@Component({
  selector: 'app-offers',
  templateUrl: './offers.component.html',
  styleUrls: ['./offers.component.scss']
})
export class OffersComponent implements OnInit {

  offerForm: FormGroup;
  today: Date = new Date();
  tempImageFile: any = null;
  offerList: Offers[] = [];
  lastDocs: any;
  docLimit: number = 50;
  updation: boolean = false;
  showLoadMore: boolean = false;
  offerModel: Offers;
  offerSub: Subscription;
  loader: boolean = false;
  imageUrl: string;
  canWrite: boolean = false;

  constructor(
    private fb: FormBuilder,
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    private modalService: NgbModal,
    private toast: ToastrService,
    private data: DataService,
    private statsService: StatsService
  ) { }

  ngOnInit(): void {
    this.canWrite = this.data.canWriteCheck();
    this.getOffers();
  }


  openOfferModal(modal, offer: Offers = null) {
    this.modalService.open(modal, { size: "sm" });
    this.initializeModal(offer);
  }

  viewImageModal(modal, imageUrl) {
    this.modalService.open(modal, { size: "lg" });
    this.imageUrl = imageUrl;
  }

  openDeleteModal(modal, offer: Offers) {
    this.modalService.open(modal, { size: "sm" });
    this.offerModel = offer;
  }


  initializeModal(offerObj: Offers) {
    if (offerObj == null) {
      this.updation = false;
      this.offerForm = this.fb.group({
        title: [""],
        description: [""],
        imageUrl: [""],
        active: [true],
        offerId: [this.afs.createId()],
        validTill: [""],
        createdOn: [firebase.firestore.Timestamp.now()],
      });
    } else {
      this.updation = true;
      this.offerForm = this.fb.group({
        title: [offerObj.title],
        description: [offerObj.description],
        imageUrl: [offerObj.imageUrl],
        offerId: [offerObj.offerId],
        active: [offerObj.active],
        validTill: [offerObj.validTill],
        createdOn: [offerObj.createdOn],
      });
    }
  }


  checkImageType(files) {
    this.tempImageFile = files[0];
    if (
      this.tempImageFile.type == "image/png" ||
      this.tempImageFile.type == "image/jpeg" ||
      this.tempImageFile.type == "image/jpg"
    ) {
    } else {
      this.tempImageFile = null;
      this.toast.show("Invalid Image Format. Only .jpg/.jpeg/.png supported");
    }
  }


  async uploadImage(form: FormGroup) {
    this.loader = true;
    let offerObj: Offers = { ...form.value };

    if (this.tempImageFile != null) {
      const file = this.tempImageFile;
      const FilePath = "offers/" + this.tempImageFile.name;
      const FileRef = this.storage.ref(FilePath);
      await this.storage.upload(FilePath, file);
      offerObj.imageUrl = await FileRef.getDownloadURL().toPromise();
    }

    this.afs
      .collection(util.OFFERS_COLLECTION)
      .doc(offerObj.offerId)
      .set(offerObj, { merge: true })
      .then(
        () => {
          this.loader = false;
          if (this.updation) {
            let index = this.offerList.findIndex(
              (x) => x.offerId == offerObj.offerId
            );
            this.offerList[index] = { ...offerObj };
            this.toast.show("Offer Updated Successfully");
          } else {
            this.offerList.splice(0, 0, offerObj);
            // this.afs.collection(util.SLIDER_IMAGES_COLLECTION).doc()
            // .set({sliderImageObj})
            this.toast.show("Offer added Successfully");
            this.statsService.maintainGlobalStats(util.OFFERS_COLLECTION,true)
          }
          this.updation = false;
          this.tempImageFile = null;
          this.modalService.dismissAll();
        },
        (error) => {
          // console.log(error);
          this.loader = false;
          this.toast.warning("Something went wrong! Please try again.");
        }
      );
  }


  getOffers() {
    this.afs
      .collection(util.OFFERS_COLLECTION, (ref) =>
        ref.orderBy("createdOn", "desc").limit(this.docLimit)
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
            let offerObj: Offers = Object.assign({}, ele.data() as Offers);
            this.lastDocs = ele;
            this.offerList.push(offerObj);
            this.data.imagesLastDocs.next(ele);
          });
        }
      });
  }


  async deleteOffer() {
    if (this.offerModel.imageUrl != "") {
      await this.storage.refFromURL(this.offerModel.imageUrl);
    }
    this.afs
      .collection(util.IMAGES_COLLECTION)
      .doc(this.offerModel.offerId)
      .delete()
      .then(
        () => {
          let index = this.offerList.findIndex(
            (x) => x.offerId == this.offerModel.offerId
          );
          this.offerList.splice(index, 1);
          this.modalService.dismissAll();
          this.toast.show("Offer Deleted Successfully !");
          this.statsService.maintainGlobalStats(util.OFFERS_COLLECTION,false)
        },
        (error) => {
          // console.log(error);
          this.toast.warning("Something went wrong ! Please try again.");
        }
      );
  }

}

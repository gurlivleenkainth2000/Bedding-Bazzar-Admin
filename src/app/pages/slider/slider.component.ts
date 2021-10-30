import { Component, OnInit } from "@angular/core";
import { sliderImages } from "src/app/classes/slider";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AngularFireStorage } from "@angular/fire/storage";
import { AngularFirestore } from "@angular/fire/firestore";
import { FormBuilder, FormGroup } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import * as util from "src/app/utils";
import firebase from "firebase/app";
import { DataService } from "src/app/services/data.service";
import { Subscription } from "rxjs";
import { StatsService } from "src/app/services/stats.service";

@Component({
  selector: "app-slider",
  templateUrl: "./slider.component.html",
  styleUrls: ["./slider.component.css"],
})
export class SliderComponent implements OnInit {
  imageForm: FormGroup;
  today: Date = new Date();
  tempSliderImageFile: any = null;
  sliderImagesList: sliderImages[] = [];
  lastDocs: any;
  docLimit: number = 50;
  updation: boolean = false;
  showLoadMore: boolean = false;
  loader: boolean = false;
  sliderImagesModal: sliderImages;
  sliderSub: Subscription;
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
  ) {}

  ngOnInit(): void {
    this.canWrite = this.data.canWriteCheck();

    if (this.data.sliderRetrieved) {
      this.data.sliderSub.subscribe((res) => {
        if (res != null) {
          this.sliderImagesList = res;
        }
      });
    } else {
      this.getSliderImages();
    }
  }

  getSliderImages() {
    this.data.sliderRetrieved = true;
    this.afs.collection(util.SLIDER_IMAGES_COLLECTION, (ref) =>
        ref.orderBy("createdOn", "desc").limit(this.docLimit)
      )
      .get().toPromise()
      .then((response) => {
        if (response.docs.length < this.docLimit) {
          this.showLoadMore = false;
        } else {
          this.showLoadMore = true;
        }
        if (response.docs.length != 0) {
          response.docs.forEach((ele, idx) => {
            let sliderbj: sliderImages = Object.assign(
              {},
              ele.data() as sliderImages
            );
            this.lastDocs = ele;
            this.sliderImagesList.push(sliderbj);
            this.data.sliderLastDocs.next(ele);
          });
          this.data.sliderSub.next(this.sliderImagesList);
        }
      });
  }

  loadMoresSliderImages() {
    if (this.lastDocs == undefined) {
      this.data.sliderLastDocs.subscribe((res) => {
        if (res != null) {
          this.lastDocs = res;
        }
      });
    }
    this.afs.collection(util.SLIDER_IMAGES_COLLECTION, (ref) =>
        ref
          .orderBy("createdOn", "desc")
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
        if (response.docs.length != 0) {
          response.docs.forEach((ele, idx) => {
            let sliderObj: sliderImages = Object.assign(
              {},
              ele.data() as sliderImages
            );
            this.lastDocs = ele;
            this.sliderImagesList.push(sliderObj);
            this.data.sliderLastDocs.next(ele);
          });
          this.data.sliderSub.next(this.sliderImagesList);
        } else {
          this.toast.info("No More Records", "");
        }
      });
  }

  viewImageModal(modal, imageUrl) {
    this.modalService.open(modal, { size: 'lg' });
    this.imageUrl = imageUrl;
  }

  openImageModal(modal, sliderImage: sliderImages = null) {
    this.modalService.open(modal, { size: "sm" });
    this.initializeModal(sliderImage);
  }

  openDeleteModal(modal, sliderImage: sliderImages) {
    this.modalService.open(modal, { size: "sm" });
    this.sliderImagesModal = sliderImage;
  }

  initializeModal(sliderImageObj: sliderImages) {
    if (sliderImageObj == null) {
      this.updation = false;
      this.imageForm = this.fb.group({
        title: [""],
        description: [""],
        imageUrl: [""],
        active: [true],
        imageId: [this.afs.createId()],
        createdOn: [firebase.firestore.Timestamp.now()],
      });
    } else {
      this.updation = true;
      this.imageForm = this.fb.group({
        title: [sliderImageObj.title],
        description: [sliderImageObj.description],
        imageUrl: [sliderImageObj.imageUrl],
        imageId: [sliderImageObj.imageId],
        active: [sliderImageObj.active],
        createdOn: [sliderImageObj.createdOn],
      });
    }
  }

  checkImageType(files) {
    this.tempSliderImageFile = files[0];
    if (
      this.tempSliderImageFile.type == "image/png" ||
      this.tempSliderImageFile.type == "image/jpeg" ||
      this.tempSliderImageFile.type == "image/jpg"
    ) {
    } else {
      this.tempSliderImageFile = null;
      this.toast.show("Invalid Image Format. Only .jpg/.jpeg/.png supported");
    }
  }

  async uploadImage(form: FormGroup) {
    this.loader = true;
    let sliderImageObj: sliderImages = { ...form.value };

    if (this.tempSliderImageFile != null) {
      const file = this.tempSliderImageFile;
      const FilePath = "sliderImages/" + this.tempSliderImageFile.name;
      const FileRef = this.storage.ref(FilePath);
      await this.storage.upload(FilePath, file);
      sliderImageObj.imageUrl = await FileRef.getDownloadURL().toPromise();
    }

    this.afs
      .collection(util.SLIDER_IMAGES_COLLECTION)
      .doc(sliderImageObj.imageId)
      .set(sliderImageObj, { merge: true })
      .then(
        () => {
          if (this.updation) {
            let index = this.sliderImagesList.findIndex(
              (x) => x.imageId == sliderImageObj.imageId
            );
            this.sliderImagesList[index] = { ...sliderImageObj };
            this.toast.show("Image Updated Successfully");
          } else {
            this.sliderImagesList.splice(0, 0, sliderImageObj);
            // this.afs.collection(util.SLIDER_IMAGES_COLLECTION).doc()
            // .set({sliderImageObj})
            this.toast.show("Image added Successfully");
            this.statsService.maintainGlobalStats(util.SLIDER_IMAGES_COLLECTION,true)
          }
          this.updation = false;
          this.loader = false;
          this.tempSliderImageFile = null;
          this.modalService.dismissAll();
        },
        (error) => {
          // console.log(error);
          this.loader = false;
          this.toast.warning("Something went wrong! Please try again.");
        }
      );
  }

  async deleteSliderImage() {
    if (this.sliderImagesModal.imageUrl != "") {
      await this.storage.refFromURL(this.sliderImagesModal.imageUrl);
    }
    this.afs
      .collection(util.SLIDER_IMAGES_COLLECTION)
      .doc(this.sliderImagesModal.imageId)
      .delete()
      .then(
        () => {
          let index = this.sliderImagesList.findIndex(
            (x) => x.imageId == this.sliderImagesModal.imageId
          );
          this.sliderImagesList.splice(index, 1);
          this.modalService.dismissAll();
          this.toast.show("Image Deleted Successfully !");
          this.statsService.maintainGlobalStats(util.SLIDER_IMAGES_COLLECTION,false)
        },
        (error) => {
          // console.log(error);
          this.toast.warning("Something went wrong ! Please try again.");
        }
      );
  }
}

import { Component, OnInit } from "@angular/core";
import { Images } from "src/app/classes/images";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AngularFireStorage } from "@angular/fire/storage";
import { AngularFirestore } from "@angular/fire/firestore";
import { FormBuilder, FormGroup } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import * as util from "src/app/utils";
import firebase from "firebase/app";
import { DataService } from "src/app/services/data.service";
import { Subscription } from "rxjs";
import { sliderImages } from "src/app/classes/slider";
import { StatsService } from "src/app/services/stats.service";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-images",
  templateUrl: "./images.component.html",
  styleUrls: ["./images.component.css"],
})
export class ImagesComponent implements OnInit {
  imageForm: FormGroup;
  today: Date = new Date();
  tempImageFile: any = null;
  imageList: Images[] = [];
  lastDocs: any;
  docLimit: number = 50;
  updation: boolean = false;
  showLoadMore: boolean = false;
  imageModal: Images;
  imagesSub: Subscription;
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
    private statsService: StatsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.canWrite = this.data.canWriteCheck();

    if (this.data.imagesRetrieved) {
      this.imagesSub = this.data.imagessSub.subscribe((res) => {
        if (res != null) {
          this.imageList = res;
        }
      });
    } else {
      this.getImages();
    }
  }

  getImages() {
    this.data.imagesRetrieved = true;
    this.afs
      .collection(util.IMAGES_COLLECTION, (ref) =>
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
            let sliderbj: Images = Object.assign({}, ele.data() as Images);
            this.lastDocs = ele;
            this.imageList.push(sliderbj);
            this.data.imagesLastDocs.next(ele);
          });
          this.data.imagessSub.next(this.imageList);
        }
      });
  }

  loadMoresSliderImages() {
    if (this.lastDocs == undefined) {
      this.data.imagesLastDocs.subscribe((res) => {
        if (res != null) {
          this.lastDocs = res;
        }
      });
    }
    this.afs
      .collection(util.IMAGES_COLLECTION, (ref) =>
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
            let imageObj: Images = Object.assign({}, ele.data() as Images);
            this.lastDocs = ele;
            this.imageList.push(imageObj);
            this.data.imagesLastDocs.next(ele);
          });
          this.data.imagessSub.next(this.imageList);
        } else {
          this.toast.info("No More Records", "");
        }
      });
  }

  viewImageModal(modal, imageUrl) {
    this.modalService.open(modal, { size: "lg" });
    this.imageUrl = imageUrl;
  }

  openImageModal(modal, sliderImage: Images = null) {
    this.modalService.open(modal, { size: "sm" });
    this.initializeModal(sliderImage);
  }

  openDeleteModal(modal, sliderImage: Images) {
    this.modalService.open(modal, { size: "sm" });
    this.imageModal = sliderImage;
  }

  initializeModal(sliderImageObj: Images) {
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
    let imageObj: Images = { ...form.value };

    if (this.tempImageFile != null) {
      const file = this.tempImageFile;
      const FilePath = "images/" + this.tempImageFile.name;
      const FileRef = this.storage.ref(FilePath);
      await this.storage.upload(FilePath, file);
      imageObj.imageUrl = await FileRef.getDownloadURL().toPromise();
    }

    this.afs
      .collection(util.IMAGES_COLLECTION)
      .doc(imageObj.imageId)
      .set(imageObj, { merge: true })
      .then(
        () => {
          this.loader = false;
          if (this.updation) {
            let index = this.imageList.findIndex(
              (x) => x.imageId == imageObj.imageId
            );
            this.imageList[index] = { ...imageObj };
            this.toast.show("Image Updated Successfully");
          } else {
            this.imageList.splice(0, 0, imageObj);
            // this.afs.collection(util.SLIDER_IMAGES_COLLECTION).doc()
            // .set({sliderImageObj})
            this.toast.show("Image added Successfully");
            this.statsService.maintainGlobalStats(util.IMAGES_COLLECTION,true)
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

  async deleteImage() {
    if (this.imageModal.imageUrl != "") {
      await this.storage.refFromURL(this.imageModal.imageUrl);
    }
    this.afs
      .collection(util.IMAGES_COLLECTION)
      .doc(this.imageModal.imageId)
      .delete()
      .then(
        () => {
          let index = this.imageList.findIndex(
            (x) => x.imageId == this.imageModal.imageId
          );
          this.imageList.splice(index, 1);
          this.modalService.dismissAll();
          this.toast.show("Image Deleted Successfully !");
          this.statsService.maintainGlobalStats(util.IMAGES_COLLECTION,false)
        },
        (error) => {
          // console.log(error);
          this.toast.warning("Something went wrong ! Please try again.");
        }
      );
  }
}

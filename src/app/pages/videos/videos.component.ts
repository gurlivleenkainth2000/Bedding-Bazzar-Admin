import { Component, OnInit } from "@angular/core";
import { Videos } from "src/app/classes/videos";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AngularFireStorage } from "@angular/fire/storage";
import { AngularFirestore } from "@angular/fire/firestore";
import { FormBuilder, FormGroup } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import * as util from "src/app/utils";
import firebase from "firebase/app";
import { DomSanitizer } from "@angular/platform-browser";
import { DataService } from "src/app/services/data.service";
import { Subscription } from "rxjs";
import { StatsService } from "src/app/services/stats.service";

@Component({
  selector: "app-videos",
  templateUrl: "./videos.component.html",
  styleUrls: ["./videos.component.css"],
})
export class VideosComponent implements OnInit {
  videoForm: FormGroup;
  today: Date = new Date();
  tempImageFile: any = null;
  videoList: Videos[] = [];
  lastDocs: any;
  docLimit: number = 50;
  updation: boolean = false;
  showLoadMore: boolean = false;
  videoModal: Videos;
  videoSub: Subscription;
  videoUrl: string;
  loader: boolean = false;
  canWrite: boolean = false;

  constructor(
    private fb: FormBuilder,
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    private modalService: NgbModal,
    private toast: ToastrService,
    private sanitizer: DomSanitizer,
    private data: DataService,
    private statsService: StatsService
  ) {}

  ngOnInit(): void {
    this.canWrite = this.data.canWriteCheck();
    if(this.data.videosRetrieved) {
      this.videoSub = this.data.videosSub.subscribe(list => {
        if(list.length != 0) {
          this.videoList = list;
        }
      })
    } else {
      this.getVideos();
    }
  }

  openVideoModal(modal, video: Videos = null) {
    this.modalService.open(modal, { size: "sm" });
    this.initializeModal(video);
  }

  openDeleteModal(modal, video: Videos) {
    this.modalService.open(modal, { size: "sm" });
    this.videoModal = video;
  }

  openViewVideoModal(modal, videoUrl: string) {
    this.modalService.open(modal, { size: "lg" });
    this.videoUrl = videoUrl;
  }

  getVideos() {
    this.data.videosRetrieved = true;
    this.afs
      .collection(util.VIDEOS_COLLECTION, ref => ref.orderBy('createdOn', 'desc').limit(this.docLimit))
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
            let videoObj: Videos = Object.assign({}, ele.data() as Videos);
            this.lastDocs = ele;
            this.videoList.push(videoObj);
            this.data.videosLastDocs.next(ele);
          });
          this.data.videosSub.next(this.videoList);
        }
      });
  }

  loadMoreVideos() {
    if (this.lastDocs == undefined) {
      this.data.videosLastDocs.subscribe((res) => {
        if (res != null) {
          this.lastDocs = res;
        }
      });
    }
    this.afs
      .collection(util.VIDEOS_COLLECTION, (ref) =>
        ref.orderBy('createdOn', 'desc').startAfter(this.lastDocs).limit(this.docLimit)
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
            let videoObj: Videos = Object.assign({}, ele.data() as Videos);
            this.lastDocs = ele;
            this.videoList.push(videoObj);
            this.data.videosLastDocs.next(ele);
          });
          this.data.videosSub.next(this.videoList);
        } else {
          this.toast.info("No More Records", "");
        }
      });
  }

  initializeModal(videoObj: Videos) {
    if (videoObj == null) {
      this.updation = false;
      this.videoForm = this.fb.group({
        title: [""],
        description: [""],
        videoUrl: [""],
        active: [true],
        videoId: [this.afs.createId()],
        createdOn: [firebase.firestore.Timestamp.now()],
      });
    } else {
      this.updation = true;
      this.videoForm = this.fb.group({
        title: [videoObj.title],
        description: [videoObj.description],
        videoUrl: [videoObj.videoUrl],
        videoId: [videoObj.videoId],
        active: [videoObj.active],
      });
    }
  }

  async uploadVideo(form: FormGroup) {
    this.loader = true;
    let videoObj: Videos = { ...form.value };

    let videoEmbedUrl = "";
    if (videoObj.videoUrl != undefined || videoObj.videoUrl != "") {
      var regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
      var match = videoObj.videoUrl.match(regExp);
      if (match && match[2].length == 11) {
        videoEmbedUrl =
          "https://www.youtube.com/embed/" +
          match[2] +
          "?autoplay=1&enablejsapi=1";
        videoObj.videoUrl = videoEmbedUrl;
      } else {
        // this.loader.loader$.next(false);
        // this.errorMsgModal = "Enter Valid Youtube Video Url !!!";
        this.toast.show("Enter valid Youtube Video Url");

        return;
      }
    }
    // if(this.tempImageFile != null){
    //   const file = this.tempImageFile;
    //   const FilePath = "videos/" + this.tempImageFile.name;
    //   const FileRef = this.storage.ref(FilePath);
    //   await this.storage.upload(FilePath, file);
    //   videoObj.videoUrl = await FileRef.getDownloadURL().toPromise();
    // }

    this.afs
      .collection(util.VIDEOS_COLLECTION)
      .doc(videoObj.videoId)
      .set(videoObj, { merge: true })
      .then(
        () => {
          if (this.updation) {
            let index = this.videoList.findIndex(
              (x) => x.videoId == videoObj.videoId
            );
            this.videoList[index] = { ...videoObj };
            this.toast.show("Video Updated Successfully");
          } else {
            this.videoList.splice(0, 0, videoObj);
            // this.afs.collection(util.SLIDER_IMAGES_COLLECTION).doc()
            // .set({sliderImageObj})
            this.toast.show("Video added Successfully");
            this.statsService.maintainGlobalStats(util.VIDEOS_COLLECTION,true)

          }
          this.loader = false;
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

  async deleteVideo() {
    // if(this.videoModal.videoUrl != ''){
    //   await this.storage.refFromURL(this.videoModal.videoUrl);
    // }
    this.afs
      .collection(util.VIDEOS_COLLECTION)
      .doc(this.videoModal.videoId)
      .delete()
      .then(
        () => {
          let index = this.videoList.findIndex(
            (x) => x.videoId == this.videoModal.videoId
          );
          this.videoList.splice(index, 1);
          this.modalService.dismissAll();
          this.toast.show("Video Deleted Successfully !");
          this.statsService.maintainGlobalStats(util.VIDEOS_COLLECTION,false)
        },
        (error) => {
          // console.log(error);
          this.toast.warning("Something went wrong !! Please try again.");
        }
      );
  }
}

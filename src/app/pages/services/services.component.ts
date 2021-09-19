import { formatDate } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { AngularFireStorage } from "@angular/fire/storage";
import { FormBuilder, FormGroup } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from "ngx-toastr";
import { Services } from "src/app/classes/services";
import * as util from "./../../utils";
import firebase from "firebase/app";
import { Subscription } from "rxjs";
import { DataService } from "src/app/services/data.service";
import { ActivatedRoute, Router } from "@angular/router";
import { StatsService } from "src/app/services/stats.service";
import { Category } from "src/app/classes/category";
import * as XSLX from "xlsx";
import * as FileSaver from 'file-saver';

@Component({
  selector: "app-services",
  templateUrl: "./services.component.html",
  styleUrls: ["./services.component.scss"],
})
export class ServicesComponent implements OnInit {
  serviceForm: FormGroup;
  today: Date = new Date();
  monthlyId: string;
  tempImageFile: any = null;

  servicesList: Services[] = [];
  categories: Category[] = [];

  docLimit: number = 50;
  lastDocs: any;
  loader: boolean = false;
  showLoadMore: boolean = false;
  updation: boolean = false;
  servicesModel: Services;
  imageUrl: string;
  servicesSub: Subscription;
  categorySub: Subscription;
  serviceDetailCardBool: boolean = false;


  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private dbRef: AngularFirestore,
    private stgRef: AngularFireStorage,
    private toast: ToastrService,
    private data: DataService,
    private statsService: StatsService,
    private router: Router,
    private route: ActivatedRoute,
    private storage: AngularFireStorage

  ) { }

  ngOnInit(): void {
    this.monthlyId = formatDate(this.today, "yyyyMM", "en-us");


    this.data.getCategories();
    this.categorySub = this.data.serviceCategorySub.subscribe((res) => {
      if(res.length != 0) {
        this.categories = res;
      }
    })

    this.data.getServices();
    this.data.servicesSub.subscribe((response) => {
      if (response.length < this.docLimit) {
        this.showLoadMore = false;
      } else {
        this.showLoadMore = true;
      }

      if (response.length != 0) {
        this.servicesList = response;
      }
    });
  }

  exportServices() {
    const workSheet: XSLX.WorkSheet = XSLX.utils.json_to_sheet(this.servicesList.map((service) => ({
      "Service Name": service.serviceName,
      "Service Description": service.description,
      "Service Duration": service.sessionDuration,
      "Service Price": service.price,
      "Created On": service.createdOn.toDate().toLocaleString()
    })));
    const workbook: XSLX.WorkBook = { Sheets: { 'services': workSheet }, SheetNames: ['services'] };
    const excelBuffer: any = XSLX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    FileSaver.saveAs(data, 'Services.xlsx')
  }

  // getServices() {
  //   this.data.serviceRetrieved = true;
  //   this.dbRef.collection(util.SERVICES_COLLECTION, (ref) =>
  //       ref.orderBy("createdOn", "desc").limit(this.docLimit)
  //     )
  //     .get().toPromise()
  //     .then((response) => {
  //       if (response.docs.length < this.docLimit) {
  //         this.showLoadMore = false;
  //       } else {
  //         this.showLoadMore = true;
  //       }

  //       if (response.docs.length != 0) {
  //         response.docs.forEach((ele, idx) => {
  //           let cusObj: Services = Object.assign({}, ele.data() as Services);
  //           this.lastDocs = ele;
  //           this.servicesList.push(cusObj);
  //           this.data.serviceLastDocs.next(ele);
  //         });
  //         this.data.servicesSub.next(this.servicesList);
  //       }
  //     });
  // }

  async loadMoreServiceServices() {
    if (this.lastDocs == undefined) {
      this.data.serviceLastDocs.subscribe(res => {
        if (res != null) {
          this.lastDocs = res;
        }
      });
    }
    this.dbRef.collection(util.SERVICES_COLLECTION, (ref) =>
      ref
        .orderBy("createdOn", "desc")
        .startAfter(this.lastDocs)
        .limit(this.data.docLimit)
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
            let cusObj: Services = Object.assign({}, ele.data() as Services);
            this.lastDocs = ele;
            this.servicesList.push(cusObj);
            this.data.serviceLastDocs.next(ele);
          });
          this.data.servicesSub.next(this.servicesList);
        } else {
          this.toast.info('No More Records', '');
        }
      });
  }

  viewServiceStats(serviceId: string, serviceName?: string) {
    this.router.navigate([serviceId, "stats"], { queryParams: { name: serviceName }, queryParamsHandling: "merge", relativeTo: this.route })
  }

  viewServiceDetails(modal, serviceObj: Services) {
    this.servicesModel = serviceObj;
    this.modalService.open(modal, { size: 'sm' });
  }

  openModal(modal, customer: Services = null) {
    this.modalService.open(modal, { size: "sm" });
    this.initialiseModal(customer);
  }

  openImageModal(modal, imageUrl) {
    this.modalService.open(modal, { size: "lg" });
    this.imageUrl = imageUrl;
  }

  openDeleteModal(modal, customer: Services) {
    this.modalService.open(modal, { size: "sm" });
    this.servicesModel = customer;
  }

  initialiseModal(serviceObj: Services) {
    if (serviceObj == null) {
      this.updation = false;
      this.serviceForm = this.fb.group({
        serviceName: [""],
        serviceId: [this.dbRef.createId()],
        numberOfSitting: [1],
        price: [""],
        imageUrl: [""],
        sessionDuration: [""],
        description: [""],
        category: [null],
        active: [true],
        createdOn: [firebase.firestore.Timestamp.now()],
      });
      // // console.log(">>> doc: ", this.ServiceServiceForm.get('ServiceserviceId').value);
    } else {
      this.updation = true;
      this.serviceForm = this.fb.group({
        serviceName: [serviceObj.serviceName],
        serviceId: [serviceObj.serviceId],
        numberOfSitting: [serviceObj.numberOfSitting],
        price: [serviceObj.price],
        imageUrl: [serviceObj.imageUrl],
        description: [serviceObj.description],
        sessionDuration: [serviceObj.sessionDuration],
        category: [serviceObj.category],
        active: [serviceObj.active],
        createdOn: [serviceObj.createdOn],
      });
      this.onSelectOption(serviceObj.category);
    }
  }

  onSelectOption(category: Category) {
    this.serviceForm.patchValue({
      category: this.categories.find(x => x.categoryId === category.categoryId)
    })
  }
  compareByCategoryId(category1: Category, category2: Category) {
    return category1 && category2 && category1.categoryId === category2.categoryId;
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
      this.toast.show("Invalid Image Format. Only .jpg/.jpeg/.png supported");
    }
  }

  async registeredService(form: FormGroup) {
    this.loader = true;
    let serviceObj: Services = { ...form.value };

    if (this.tempImageFile != null) {
      const file = this.tempImageFile;
      const FilePath = "services/" + this.tempImageFile.name;
      const FileRef = this.storage.ref(FilePath);
      await this.storage.upload(FilePath, file);
      serviceObj.imageUrl = await FileRef.getDownloadURL().toPromise();
    }


    this.dbRef
      .collection(util.SERVICES_COLLECTION)
      .doc(serviceObj.serviceId)
      .set(serviceObj, { merge: true })
      .then(
        () => {
          this.loader = false;
          if (this.updation) {
            let index = this.servicesList.findIndex(
              (x) => x.serviceId == serviceObj.serviceId
            );
            this.servicesList[index] = { ...serviceObj };
            this.toast.show("Service Updated Successfully");
          } else {
            this.servicesList.splice(0, 0, serviceObj);
            this.toast.show("Service Registered Successfully", "");
            this.statsService.maintainGlobalStats(util.SERVICES_COLLECTION, true)
          }

          this.updation = false;
          this.tempImageFile = null;
          this.modalService.dismissAll();
        },
        (error) => {
          // console.log(">>> Error", error);
          this.loader = false;
          this.toast.warning("Something went wrong!! Please Try Again");
        }
      );
  }


  async deleteService() {
    this.dbRef
      .collection(util.SERVICES_COLLECTION)
      .doc(this.servicesModel.serviceId)
      .delete()
      .then(
        () => {
          let index = this.servicesList.findIndex(
            (x) => x.serviceId == this.servicesModel.serviceId
          );
          this.servicesList.splice(index, 1);
          this.modalService.dismissAll();
          this.toast.show("Service Deleted Successfully");
          this.statsService.maintainGlobalStats(util.SERVICES_COLLECTION, false)
        },
        (error) => {
          // console.log(">>> Error", error);
          this.loader = false;
          this.toast.warning("Something went wrong!! Please Try Again");
        }
      );
  }
}

import { formatDate } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { AngularFireStorage } from "@angular/fire/storage";
import { FormBuilder, FormGroup } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from "ngx-toastr";
import { Products } from "src/app/classes/products";
import * as util from "./../../utils";
import firebase from "firebase/app";
import { combineLatest, Subscription } from "rxjs";
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

  productForm: FormGroup;
  today: Date = new Date();
  monthlyId: string;

  selectedImageIdx: number = 0;
  thumbnailImageIdx: number = 0;
  tempImageFiles: any[] = [];

  productModel: Products;
  productsList: Products[] = [];
  categories: Category[] = [];

  docLimit: number = 50;
  lastDocs: any;

  imageUrl: string;

  subjectSub: Subscription;

  loader: boolean = false;
  updation: boolean = false;
  showLoadMore: boolean = false;
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
    this.data.getProducts();

    this.subjectSub = combineLatest([this.data.productCategorySub, this.data.productSub])
      .subscribe(([categories, products]) => {
        if (categories.length != 0) this.categories = categories;
        if (products.length < this.docLimit) {
          this.showLoadMore = false;
        } else {
          this.showLoadMore = true;
        }
  
        if (products.length != 0) {
          this.productsList = products;
        }
      });
  }

  exportServices() {
    const workSheet: XSLX.WorkSheet = XSLX.utils.json_to_sheet(this.productsList.map((service) => ({
      "Product Name": service.productName,
      "Product Description": service.description,
      "Product Price": service.price,
      "Created On": service.createdOn.toDate().toLocaleString()
    })));
    const workbook: XSLX.WorkBook = { Sheets: { 'services': workSheet }, SheetNames: ['services'] };
    const excelBuffer: any = XSLX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    FileSaver.saveAs(data, 'Services.xlsx')
  }

  async loadMoreServiceServices() {
    if (this.lastDocs == undefined) {
      this.data.productLastDocs.subscribe(res => {
        if (res != null) {
          this.lastDocs = res;
        }
      });
    }
    this.dbRef.collection(util.PRODUCTS_COLLECTION, (ref) =>
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
            let cusObj: Products = Object.assign({}, ele.data() as Products);
            this.lastDocs = ele;
            this.productsList.push(cusObj);
            this.data.productLastDocs.next(ele);
          });
          this.data.productSub.next(this.productsList);
        } else {
          this.toast.info('No More Records', '');
        }
      });
  }

  viewServiceDetails(modal, productObj: Products) {
    this.productModel = productObj;
    this.modalService.open(modal, { size: 'sm' });
  }

  openModal(modal, customer: Products = null) {
    this.tempImageFiles = []; 
    this.initialiseModal(customer);
    this.modalService.open(modal, { size: "xl" });
  }

  openImageModal(modal, imageUrls: string[], thumbnailImageIdx) {
    this.tempImageFiles = [...imageUrls];
    this.thumbnailImageIdx = thumbnailImageIdx;
    this.modalService.open(modal, { 
      size: "xl",
      scrollable: true 
    });
  }

  openDeleteModal(modal, customer: Products) {
    this.modalService.open(modal, { size: "sm" });
    this.productModel = customer;
  }

  initialiseModal(productObj: Products) {
    if (productObj == null) {
      this.updation = false;
      this.productForm = this.fb.group({
        productId: [this.dbRef.createId()],
        productName: [null],
        price: [null],
        imageUrls: this.fb.array([]),
        thumbnailImage: [null],
        description: [null],
        category: [null],
        active: [true],
        showOnHomePage: [false],
        createdOn: [firebase.firestore.Timestamp.now()],
      });
    } else {
      this.updation = true;
      this.productForm = this.fb.group({
        productId: [productObj.productId],
        productName: [productObj.productName],
        price: [productObj.price],
        imageUrls: [productObj.imageUrls],
        thumbnailImage: [productObj.thumbnailImage],
        description: [productObj.description],
        category: [productObj.category],
        active: [productObj.active],
        showOnHomePage: [productObj.showOnHomePage],
        createdOn: [productObj.createdOn],
      });
      this.onSelectOption(productObj.category);
      this.tempImageFiles = productObj.imageUrls || [];
    }
  }

  onSelectOption(category: Category) {
    this.productForm.patchValue({
      category: this.categories.find(x => x.categoryId === category.categoryId)
    })
  }

  compareByCategoryId(category1: Category, category2: Category) {
    return category1 && category2 && category1.categoryId === category2.categoryId;
  }

  checkImageFileType(files) {
    let fileList: File[] = Object.assign([], files);
    fileList.forEach((file: any, idx: number) => {
      if (
        file.type == "image/png" ||
        file.type == "image/jpeg" ||
        file.type == "image/jpg"
      ) {
        this.tempImageFiles.push(file);
      } else {
        this.toast.warning("Only .png/.jpeg/.jpg file format accepted!!", file.name + " will not accepted.");
      }
    });
  }

  removeImage(idx) {
    this.tempImageFiles.splice(idx, 1);
  }

  getFileNameFromFirebaseDownloadedUrl(url: string) {
    return this.stgRef.storage.refFromURL(url).name;
  }

  changeThumbnailImageIdx(idx) {
    this.productForm.patchValue({
      thumbnailImage: idx
    })
  }

  async uploadImages(productId) {
    let imageDownloadedUrl: string[] = [];
    for await (let file of this.tempImageFiles) {
      if (file instanceof File) {
        const FilePath = "product-images/" + productId + "/" + file.name;
        const FileRef = this.stgRef.ref(FilePath);
        await this.stgRef.upload(FilePath, file);
        imageDownloadedUrl.push(await FileRef.getDownloadURL().toPromise());
      } else {
        imageDownloadedUrl.push(file);
      }
    }
    return imageDownloadedUrl;
  }

  async registeredService(form: FormGroup) {
    this.loader = true;
    let productObj: Products = { ...form.value };
    productObj.imageUrls = await this.uploadImages(productObj.productId);

    this.dbRef
      .collection(util.PRODUCTS_COLLECTION)
      .doc(productObj.productId)
      .set(productObj, { merge: true })
      .then(
        () => {
          this.loader = false;
          if (this.updation) {
            let index = this.productsList.findIndex(
              (x) => x.productId == productObj.productId
            );
            this.productsList[index] = { ...productObj };
            this.toast.show("Product Updated Successfully");
          } else {
            this.productsList.splice(0, 0, productObj);
            this.toast.show("Product Added Successfully", "");
            this.statsService.maintainGlobalStats(util.PRODUCTS_COLLECTION, true)
          }

          this.updation = false;
          delete this.tempImageFiles;
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
      .collection(util.PRODUCTS_COLLECTION)
      .doc(this.productModel.productId)
      .delete()
      .then(
        () => {
          let index = this.productsList.findIndex(
            (x) => x.productId == this.productModel.productId
          );
          this.productsList.splice(index, 1);
          this.modalService.dismissAll();
          this.toast.show("Product Deleted Successfully");
          this.statsService.maintainGlobalStats(util.PRODUCTS_COLLECTION, false)
        },
        (error) => {
          // console.log(">>> Error", error);
          this.loader = false;
          this.toast.warning("Something went wrong!! Please Try Again");
        }
      );
  }

  openImage(url) {
    window.open(url, "_blank")
  }
}

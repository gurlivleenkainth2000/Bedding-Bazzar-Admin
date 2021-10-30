import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Category } from "src/app/classes/category";
import { DataService } from 'src/app/services/data.service';
import { StatsService } from 'src/app/services/stats.service';
import * as util from "src/app/utils";
import firebase from "firebase/app";
import { Products } from 'src/app/classes/products';

@Component({
  selector: 'app-service-category',
  templateUrl: './service-category.component.html',
  styleUrls: ['./service-category.component.scss']
})
export class ServiceCategoryComponent implements OnInit {

  serviceCategoryForm: FormGroup;
  today: Date = new Date();
  serviceCategoryList: Category[] = [];
  docLimit: number = 50;
  lastDocs: any;
  loader: boolean = false;
  updation: boolean = false;
  showLoadMore: boolean = false;
  serviceCategoryModel: Category;
  servicesList: Products[] = [];
  categoryId: string;


  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private dbRef: AngularFirestore,
    private toast: ToastrService,
    private data: DataService,
    private statsService: StatsService,
    private router: Router,
    private route: ActivatedRoute

  ) { }

  ngOnInit(): void {

    this.data.getCategories();
    this.data.productCategorySub.subscribe((response) =>{
      if (response.length < this.docLimit) {
        this.showLoadMore = false;
      } else {
        this.showLoadMore = true;
      }

      if (response.length != 0) {
        this.serviceCategoryList = response;
      }

    })

    // this.getServices();
    // // console.log(this.servicesList);

  }

  openCategoryModal(modal, category: Category = null){
    this.modalService.open(modal, {size: "sm"});
    this.initialiseModal(category)
  }

 openServiceModal(modal, category: Category){
    // await this.getServices(category);
    this.modalService.open(modal, {size: "lg"});
  }

  initialiseModal(serviceCategoryObj: Category) {
    if (serviceCategoryObj == null) {
      this.updation = false;
      this.serviceCategoryForm = this.fb.group({
        categoryName: [""],
        categoryId: [this.dbRef.createId()],
        active: [true],
        createdOn: [firebase.firestore.Timestamp.now()],
      });
      // // console.log(">>> doc: ", this.ServiceServiceForm.get('ServiceserviceId').value);
    } else {
      this.updation = true;
      this.serviceCategoryForm = this.fb.group({
        categoryName: [serviceCategoryObj.categoryName],
        categoryId: [serviceCategoryObj.categoryId],
        active: [serviceCategoryObj.active],
        createdOn: [serviceCategoryObj.createdOn],
      });
    }
  }

  async registeredCategory(form: FormGroup) {
    this.loader = true;
    let serviceCategoryObj: Category = { ...form.value };

    this.dbRef
      .collection(util.PRODUCT_CATEGORY_COLLECTION)
      .doc(serviceCategoryObj.categoryId)
      .set(serviceCategoryObj, { merge: true })
      .then(
        () => {
          this.loader = false;
          if (this.updation) {
            let index = this.serviceCategoryList.findIndex(
              (x) => x.categoryId == serviceCategoryObj.categoryId
            );
            this.serviceCategoryList[index] = { ...serviceCategoryObj };
            this.toast.show("Category Updated Successfully");
          } else {
            this.serviceCategoryList.splice(0, 0, serviceCategoryObj);
            this.toast.show("Category Registered Successfully", "");
            this.statsService.maintainGlobalStats(util.PRODUCT_CATEGORY_COLLECTION,true)
          }

          this.updation = false;
          this.modalService.dismissAll();
        },
        (error) => {
          // console.log(">>> Error", error);
          this.loader = false;
          this.toast.warning("Something went wrong!! Please Try Again");
        }
      );
  }

  getServices(category: Category, modal){
    this.dbRef.collection(util.PRODUCTS_COLLECTION,(ref) => ref.where("category.categoryId", "==", category.categoryId  )  )
    .get().toPromise()
    .then((value) => {
      this.servicesList = value.docs.map(e => Object.assign({}, e.data() as Products))
      this.modalService.open(modal, {size: "lg"});
    // this.serviceCategoryModel = category

      // value.docs.forEach((ele) => {
      //   let serviceObj: Products = Object.assign({}, ele.data() as Services)
      //   this.servicesList.push(serviceObj);
      // })
    })
  }

  async deleteCategory() {
    this.dbRef
      .collection(util.PRODUCT_CATEGORY_COLLECTION)
      .doc(this.serviceCategoryModel.categoryId)
      .delete()
      .then(
        () => {
          let index = this.serviceCategoryList.findIndex(
            (x) => x.categoryId == this.serviceCategoryModel.categoryId
          );
          this.serviceCategoryList.splice(index, 1);
          this.modalService.dismissAll();
          this.toast.show("Category Deleted Successfully");
          this.statsService.maintainGlobalStats(util.PRODUCT_CATEGORY_COLLECTION,false)
        },
        (error) => {
          // console.log(">>> Error", error);
          this.loader = false;
          this.toast.warning("Something went wrong!! Please Try Again");
        }
      );
  }

}

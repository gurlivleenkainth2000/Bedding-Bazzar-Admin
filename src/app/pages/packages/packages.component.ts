import { AfterViewChecked, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Category } from 'src/app/classes/category';
import { Packages } from 'src/app/classes/packages';
import { Services } from 'src/app/classes/services';
import { DataService } from 'src/app/services/data.service';
import firebase from 'firebase/app';
import * as util from './../../utils';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-packages',
  templateUrl: './packages.component.html',
  styleUrls: ['./packages.component.scss']
})
export class PackagesComponent implements OnInit {

  activeId: string;
  tempImageFile: any;
  packageForm: FormGroup;
  serviceFormGroup: FormGroup;

  selectedCategoryIdx: number;
  selectedServiceIdx: number;

  loader: boolean = false;

  updation: boolean = false;
  showLoadMore: boolean = false;
  showServiceCard: boolean = false;

  docLimit: number = 50;
  lastDocs: any;

  categories: Category[] = [];
  services: Services[] = [];
  packages: Packages[] = [];
  packageModel: Packages;

  categorySub: Subscription;
  serviceSub: Subscription;
  packageSub: Subscription;

  constructor(
    private fb: FormBuilder,
    private dbRef: AngularFirestore,
    private stgRef: AngularFireStorage,
    private data: DataService,
    private modalService: NgbModal,
    private toast: ToastrService,
    private changeRef: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {

    this.getData();
  }

  openPackageModal(modal, packageObj: Packages = null) {
    this.modalService.open(modal, { size: 'xl' });
    this.initialiseForm(packageObj);
  }

  openPackageDeleteModal(modal, packObj: Packages) {
    this.modalService.open(modal, { size: 'sm' });
    this.packageModel = packObj;
  }

  initialiseForm(packageObj: Packages) {
    if(packageObj == null) {
      this.updation = false;
      this.packageForm = this.fb.group({
        packageId: [this.dbRef.createId()],
        name: [""],
        description: [""],
        imageUrl: [""],
        price: [0],
        services: this.fb.array([]),
        validity: [null],
        active: [true],
        createdOn: [firebase.firestore.Timestamp.now()]
      });
    } else {
      this.updation = true;
      this.packageForm = this.fb.group({
        packageId: [packageObj.packageId],
        name: [packageObj.name],
        description: [packageObj.description],
        imageUrl: [packageObj.imageUrl],
        price: [packageObj.price],
        services: this.fb.array(packageObj.services.map(e => this.initialiseFormGroup(e)) || []),
        validity: [packageObj.validity],
        active: [packageObj.active],
        createdOn: [packageObj.createdOn]
      });
    }
  }

  getData() {
    this.data.getCategories();
    this.categorySub = this.data.serviceCategorySub.subscribe(res => {
      if(res.length != 0) {
        this.categories = res;
      }
    });

    this.data.getPackages();
    this.packageSub = this.data.packagesSub.subscribe(res => {
      if (res.length < this.docLimit) {
        this.showLoadMore = false;
      } else {
        this.showLoadMore = true;
      }
      if(res.length != 0) {
        this.packages = res;
      }
    });
  }

  viewPackageStats(packageId: string, packageName?: string) {
    this.router.navigate([packageId, "stats"], { queryParams: { name: packageName }, queryParamsHandling: "merge", relativeTo: this.route });
  }

  getServiceControl() {
    return this.packageForm.get('services') as FormArray;
  }

  onNavSelected(categoryId, idx) {
    this.selectedCategoryIdx = idx;
    delete(this.selectedServiceIdx);
    // // console.log(">>> On Nav Selection: ", categoryId);
    this.dbRef.collection(
      util.SERVICES_COLLECTION,
      ref => ref.where('category.categoryId', '==', categoryId)
    )
    .get().toPromise()
    .then((value) => {
      this.services = value.docs.map(e => Object.assign({}, e.data() as Services))
      // // console.log(">>> Services: ", this.services);

    })
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

  onServiceSelect(idx, serviceObj: Services) {
    this.selectedServiceIdx = idx;
    this.showServiceCard = true;
    this.serviceFormGroup = this.initialiseFormGroup(serviceObj);
  }

  initialiseFormGroup(serviceObj: Services) {
    return this.fb.group({
      serviceName: [serviceObj.serviceName],
      serviceId: [serviceObj.serviceId],
      description: [serviceObj.description],
      price: [serviceObj.price],
      sessionDuration: [serviceObj.sessionDuration],
      numberOfSitting: [serviceObj.numberOfSitting || 1],
      active: [serviceObj.active || true],
      category: this.fb.group({
        categoryId: serviceObj.category.categoryId,
        categoryName: serviceObj.category.categoryName,
        active: serviceObj.category.active,
        createdOn: serviceObj.category.createdOn,
      })
    });
  }

  addControlToService(form: FormGroup) {
    let formValues: Services = { ...form.value };
    let idx = this.getServiceControl().controls.findIndex(x => x.get('serviceId').value === formValues.serviceId);
    if(idx == -1) {
      this.getServiceControl().push(form);
      this.packageForm.patchValue({
        price: this.packageForm.get('price').value + (formValues.price * formValues.numberOfSitting)
      })
      delete(this.selectedServiceIdx);
      this.showServiceCard = false;
    } else {
      this.toast.info(`${formValues.serviceName} already added`)
    }
  }

  removeControl(idx) {
    this.getServiceControl().removeAt(idx);
    let price = this.getServiceControl().controls.reduce((previous, next) => previous + (next.value.price * next.value.numberOfSitting), 0)
    this.packageForm.patchValue({
      price: price
    })
  }

  async savePackage(form: FormGroup) {
    this.loader = true;
    let packageObj: Packages = { ...form.value };
    packageObj.services = packageObj.services.map(e => e).sort((a, b) => {
      if(a.category.categoryName < b.category.categoryName ) return -1;
      if(a.category.categoryName > b.category.categoryName ) return 1;
      return 0;
    })
    packageObj['servicesHashcode'] = packageObj.services.map(e => e.serviceId);
    packageObj['serviceCategoriesHashcode'] = Array.from(new Set(packageObj.services.map(e => e.category.categoryId)));

    if (this.tempImageFile != null) {
      const file = this.tempImageFile;
      const FilePath = "packages/" + this.tempImageFile.name;
      const FileRef = this.stgRef.ref(FilePath);
      await this.stgRef.upload(FilePath, file);
      packageObj.imageUrl = await FileRef.getDownloadURL().toPromise();
    }

    this.dbRef.collection(util.PACKAGES_COLLECTION).doc(packageObj.packageId)
      .set(packageObj, { merge: true })
      .then(() => {
        if(this.updation) {
          let idx = this.packages.findIndex(x => x.packageId === packageObj.packageId);
          this.packages[idx] = { ...packageObj };
        } else {
          this.packages.splice(0,0, packageObj)
        }
        this.loader = false;
        this.modalService.dismissAll();
        this.toast.show("Package Added / Updated Successfully", "");
      }, (error) => {
        this.loader = false;
        this.toast.show("Something Went Wrong!! Please Try Again", "");
      })
  }

  async deletePackage() {
    if(this.packageModel.imageUrl != '') {
      await this.stgRef.refFromURL(this.packageModel.imageUrl);
    }

    this.dbRef
      .collection(util.SERVICES_COLLECTION)
      .doc(this.packageModel.packageId)
      .delete()
      .then(
        () => {
          let index = this.packages.findIndex(
            (x) => x.packageId == this.packageModel.packageId
          );
          this.packages.splice(index, 1);
          this.modalService.dismissAll();
          this.toast.show("Package Deleted Successfully");
        },
        (error) => {
          // console.log(">>> Error", error);
          this.loader = false;
          this.toast.warning("Something went wrong!! Please Try Again");
        }
      );
  }

}

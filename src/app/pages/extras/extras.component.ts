import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireFunctions } from "@angular/fire/functions";
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Extras } from "src/app/classes/extras";
import { DataService } from 'src/app/services/data.service';
import * as util from 'src/app/utils'
class Areas {
  name: string;
  areaId: string
} @Component({
  selector: 'app-extras',
  templateUrl: './extras.component.html',
  styleUrls: ['./extras.component.scss']
})
export class ExtrasComponent implements OnInit {

  area: Areas;
  areasList: Areas[] = []
  extrasModal: Extras;
  extraList: Extras[] = [];
  // wipeInput: string;

  keys: string[] = [];
  showButtonsonKeys: string[] = [
    "creditCharges",
    // "bannerText",
    "enquiryMobile"
  ];
  titleObj = {
    imageSection: 'Image Section',
    serviceSection: 'Service Section',
    slideShowSection: 'Slide Show Section',
    videoSection: 'Video Section',
    offersSection: 'Offers',
    // bannerText: "Banner Text",
    enquiryMobile: "Enquiry Mobile",
    creditCharges: "Credit Charges (%)"
  }

  name: string;
  type: number;
  key: string;

  modalForm: FormGroup;
  canWrite: boolean;


  constructor(
    private afs: AngularFirestore,
    private fb: FormBuilder,
    private toast: ToastrService,
    private modalService: NgbModal,
    private data: DataService,
    private fns: AngularFireFunctions
  ) { }

  ngOnInit(): void {

    this.getExtras();
    this.keys = Object.keys(this.titleObj);
  }

  getExtras() {
    this.afs.collection('extra').doc("extra")
      .snapshotChanges()
      .subscribe((response) => {
        this.extrasModal = Object.assign({}, response.payload.data() as Extras)
        // // console.log(">>> ", this.extrasModal);

      })

  }

  editButtonToggle = (key, all: boolean) => (all ? this.keys : this.showButtonsonKeys).some(x => x === key);

  openModal(modal, value, key) {
    delete (this.type);
    this.modalService.open(modal);
    // this.type = key === "bannerText" || key === "creditCharges" ? 1 : 0;
    switch (key) {
      case "enquiryMobile": {
        this.type = 0;
        break;
      }
      case "bannerText": {
        this.type = 1;
        break;
      }
      case "creditCharges": {
        this.type = 2;
        break;
      }
    }

    this.modalForm = this.fb.group({
      key: key,
      value: value
    });
  }

  changeStatus(key, value) {
    this.afs.collection('extra').doc('extra').update({
      [key]: value
    })
    this.toast.show("Status Changed")
  }

  updateValue(fb: FormGroup) {
    let value = { ...fb.value };
    // console.log(">>> value: ", value);
    this.changeStatus(value.key, value.value);
    this.modalService.dismissAll();
  }

  // changeStatus(key, value) {
  //   this.afs.

  // this.afs.collection("extra").doc("extra").set({
  //   imageSection:
  //  }, { merge: true })

  // openWipeAllModal(modal) {
  //   this.modalService.open(modal, { size: "sm" })
  // }

  // wipeAll() {
  //   if (this.wipeInput.toLowerCase() == "wipe all") {

  //       // this.afs.collectionGroup(util.CUSTOMER_SERVICES_COLLECTION ,ref => ref.where("","",""))


  //     this.toast.success("Done");

  //   delete this.wipeInput;
  //   this.modalService.dismissAll();
  //   }else{
  //     this.toast.error("Incorrect Input")
  //   }

  // }

}

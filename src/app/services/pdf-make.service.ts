import { formatDate } from "@angular/common";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AngularFireStorage } from "@angular/fire/storage";
import { locale } from "moment";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { BuyModel } from "../classes/buy-model";
import { Payments } from "../classes/payments";
import { Staff } from "../classes/staff";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Injectable({
  providedIn: "root",
})
export class PdfMakeService {
  constructor() {}

  getImageFromUrl(imageUrl) {
    return new Promise((resolve, reject) => {
      let image = new Image();
      image.setAttribute("crossOrigin", "anonymous");
      image.onerror = (error) => {
        // console.log(error);
        reject(error);
      };
      image.style.borderRadius = "50%";
      image.onload = () => {
        let canvas = document.createElement("canvas");
        canvas.height = image.height;
        canvas.width = image.width;
        canvas.style.borderRadius = "50%";
        let ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);

        let dataUrl = canvas.toDataURL("image/png");
        resolve(dataUrl);
      };
      image.src = imageUrl;
    });
  }

  async getQRCode(staffObj: Staff) {
    const pdf = pdfMake.createPdf({
      pageSize: {
        height: 300,
        width: 200,
      },
      pageOrientation: "portrait",
      content: [
        {
          image: await this.getImageFromUrl(
            "./../../assets/img/yogaSutraLogo.png"
          ),
          width: 120,
          height: 40,
          alignment: "center",
        },
        {
          qr: staffObj.staffId,
          eccLevel: "Q",
          alignment: "center",
          version: 2,
          fit: "120",
          margin: [0, 24, 0, 24],
        },
        {
          text: staffObj.name,
          fontSize: 18,
          alignment: "center",
        },
      ],
    });
    pdf.download("QRCODE-" + staffObj.name.replace(/ /g, ""));
  }

  async getPaymentReceipt(paymentObj: Payments, buyModel: BuyModel) {

    const formmater = (payment: any) => new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(payment);

    const body = buyModel.services.map((e, idx) => ([
      { text: idx + 1, alignment: 'left', margin: [0, 2] },
      { text: e.serviceName, alignment: 'left', margin: [0, 2] },
      { text: e.numberOfSitting, alignment: 'right', margin: [0, 2] },
      { text: formmater(e.price), alignment: 'right', margin: [0, 2] }
    ]));

    const pdf = pdfMake.createPdf({
      header: (currentPage, pageCount, pageSize) => {
        return [
          {
            canvas: [
              {
                type: "rect",
                x: 40,
                y: 20,
                w: pageSize.width - 75,
                h: 0,
                lineWidth: 15,
                lineColor: "#000",
              },
            ],
          },
        ];
      },
      footer: (currentPage, pageCount, pageSize) => {
        return [
          {
            text: "Thank You for Purchasing Our Services",
            alignment: "center",
            bold: true,
            fontSize: 12,
            color: "#a0a0a0",
            margin: [0, -16, 0, 0],
          },
          {
            canvas: [
              {
                type: "rect",
                x: 40,
                y: 10,
                w: pageSize.width - 75,
                h: 0,
                lineWidth: 15,
                lineColor: "#000",
              },
            ],
          },
        ];
      },
      pageSize: "A4",
      // pageOrientation: "landscape",
      content: [
        {
          image: await this.getImageFromUrl(
            "./../../assets/img/yogaSutraLogo.png"
          ),
          width: 120,
          height: 40,
        },
        {
          margin: [0, 10],
          layout: "noBorders",
          table: {
            headerRows: 1,
            widths: ["*", "*"],
            body: [
              [
                { text: "Yoga Sutra Ludhiana", bold: true, alignment: "left" },
                {
                  text:
                    "Date: " +
                    formatDate(
                      paymentObj.timestamp.toDate(),
                      "dd-MM-yyyy hh:mm:ss aa",
                      "en-us"
                    ),
                  alignment: "right",
                },
              ],
              [
                {
                  text: "61-62 3rd floor, Under Club 69. Agar Nagar Enclave, Pushap Vihar, Canal Road, 141012 Ludhiana, Punjab, India",
                  alignment: "left",
                },
                {
                  text: "Receipt #: " + paymentObj.transactionId,
                  alignment: "right",
                },
              ],
              [
                { text: "contact@yogasutra.in", alignment: "left" },
                {
                  text: "Name: " + paymentObj.customerName,
                  alignment: "right",
                },
              ],
              [
                { text: "+91 98147 23248", alignment: "left" },
                { text: paymentObj.customerMobile, alignment: "right" },
              ],
            ],
          },
        },
        {
          canvas: [
            {
              type: "rect",
              x: 0,
              y: 0,
              w: 512,
              h: 0,
              lineWidth: 1,
              lineColor: "#e8e8e8",
            },
          ],
          margin: [0, 10]
        },
        buyModel.signal ? { text: buyModel.packageName, margin: [0, 2] } : {},
        buyModel.signal ? { text: buyModel.description, margin: [0, 2], color: "#778899", alignment: 'justify' } : {},
        {
          text: 'Services',
          margin: [0,10, 0, 0],
        },
        {
          margin: [0, 4, 0, 0],
          layout: "headerLineOnly",
          table: {
            headerRows: 1,
            widths: ["auto", "*", "*", 100],
            body: [
              [
                {
                  text: "Sr. No",
                  alignment: "left",
                  color: "#a0a0a0"
                },
                {
                  text: "Name",
                  alignment: "left",
                  color: "#a0a0a0"
                },
                {
                  text: "Total Sessions",
                  alignment: "right",
                  color: "#a0a0a0"
                },
                {
                  text: "Price",
                  alignment: "right",
                  color: "#a0a0a0"
                },
              ],
              ...body,
              [
                {},
                {},
                {
                  text: paymentObj.signal ? "Package" : "Service" + " Price",
                  alignment: "right",
                  bold: true,
                  margin: [0, 12, 0, 0]
                },
                {
                  text: formmater(paymentObj.price),
                  alignment: "right",
                  bold: true,
                  margin: [0, 12, 0, 0],
                }
              ],
              [
                {},
                {},
                {
                  text: "Discount Price",
                  alignment: "right",
                  bold: true,
                  margin: [0, 4, 0, 0]
                },
                {
                  text: formmater(buyModel.discountPrice),
                  alignment: "right",
                  bold: true,
                  margin: [0, 4, 0, 0],
                }
              ],
              [
                {},
                {},
                {
                  text: "Received Amount",
                  alignment: "right",
                  bold: true,
                  margin: [0, 8, 0, 0]
                },
                {
                  text: formmater(paymentObj.amountPay),
                  alignment: "right",
                  bold: true,
                  margin: [0, 8, 0, 0],
                }
              ],
              [
                {},
                {},
                {
                  text: "Charges " + new Intl.NumberFormat('en-IN', { style: 'percent', maximumFractionDigits: 1 }).format((paymentObj.chargePercentage || 0) / 100),
                  alignment: "right",
                  bold: true,
                  margin: [0, 4, 0, 0]
                },
                {
                  text: formmater(paymentObj.charges || 0),
                  alignment: "right",
                  bold: true,
                  margin: [0, 4, 0, 0],
                }
              ],
              [
                {},
                {},
                {
                  text: "Total Amount",
                  alignment: "right",
                  bold: true,
                  margin: [0, 4, 0, 0]
                },
                {
                  text: formmater(paymentObj.amountPay + (paymentObj.charges || 0)),
                  alignment: "right",
                  bold: true,
                  margin: [0, 4, 0, 0],
                }
              ]
            ],
          },
        },
      ],
    });
    pdf.download(
      paymentObj.customerName.replace(/ /g, "") + "-" + paymentObj.transactionId
    );
  }
}

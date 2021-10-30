import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import * as util from "src/app/utils";
import Chart from 'chart.js';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

class Stats {
  id: string;
  name: string;
  value: string;
}
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  globalStat: any;
  today: Date;

  myDashboardChart: any;
  myPaymentChart: any;

  staffStats: Stats[] = [];
  serviceStats: Stats[] = [];
  areaStats: Stats[] = [];
  packageServicesStats: Stats[] = [];

  selectedDateForDailyVisitsStats: Date;
  selectedMonthYearForMonthlyStats: Date;

  selectedDate: string;
  selectedMonth: string;

  constructor(
    private dbRef: AngularFirestore,
    private toast: ToastrService
  ) {
    this.today = new Date();
   }


  ngOnInit() {
    this.selectedDate = new DatePipe('en').transform(this.today, "yyyy-MM-dd");
    this.selectedMonth = new DatePipe('en').transform(this.today, "yyyy-MM");
    // this.getStatsGlobal();
    // this.getMontlyStats();
    // this.getDailyVisitsStats();
  }

  // getStatsGlobal() {
  //   this.dbRef.collection(util.STATS_GLOBAL_COLLECTION).doc(util.STATS_GLOBAL_COLLECTION)
  //   .valueChanges()
  //   .subscribe(res => {
  //     this.globalStat = Object.assign({}, res);
  //   })
  // }

  // getDailyVisitsStats(dateSelectorBool: boolean = false, date?: Date) {
  //   let datePipe = new DatePipe('en-us')
  //   let monthId = datePipe.transform(date || this.today, 'yyyyMM');
  //   let monthDayId = datePipe.transform(date || this.today, 'yyyyMMdd');

  //   this.dbRef.collection(util.STATS_MONTHLY_VISITS_COLLECTION).doc(monthId)
  //     .collection(util.STATS_DAILY_VISITS_COLLECTION).doc(monthDayId)
  //     .valueChanges()
  //     .subscribe(res => {
  //       if(res != undefined) {
  //         if(dateSelectorBool) this.selectedDateForDailyVisitsStats = date;
  //         if(date === this.today) delete(this.selectedDateForDailyVisitsStats);

  //         let areaKeys = Object.keys(res['areaIdNameMap'] || []);
  //         let serviceKeys = Object.keys(res['serviceIdNameMap'] || []);
  //         let staffKeys = Object.keys(res['staffIdNameMap'] || []);
  //         let packageServiceKeys = Object.keys(res['pServiceIdNameMap'] || []);

  //         this.areaStats = areaKeys.map((key) => ({
  //           id: key,
  //           name: res['areaIdNameMap'][key],
  //           value: res['areaIdCountMap'][key]
  //         }));
  //         this.serviceStats = serviceKeys.map((key) => ({
  //           id: key,
  //           name: res['serviceIdNameMap'][key],
  //           value: res['serviceIdCountMap'][key]
  //         }));
  //         this.staffStats = staffKeys.map((key) => ({
  //           id: key,
  //           name: res['staffIdNameMap'][key],
  //           value: res['staffIdCountMap'][key]
  //         }));
  //         this.packageServicesStats = packageServiceKeys.map((key) => ({
  //           id: key,
  //           name: String(res['pServiceIdNameMap'][key]).replace(":", " "),
  //           value: res['pServiceIdCountMap'][key]
  //         }));
  //       } else {
  //         if(dateSelectorBool) {
  //           this.toast.info(`No Record Found for ${datePipe.transform(date, "dd MMMM yyyy")}`, "");
  //         }
  //       }
  //     })
  // }

  // getMontlyStats(monthYear?: Date) {
  //   let monthId = new DatePipe('en-us').transform(monthYear || this.today, "yyyyMM");
  //   this.dbRef.collection(util.STATS_MONTHLY_COLLECTION)
  //     .doc(monthId)
  //     .valueChanges()
  //     .subscribe((res) => {
  //       // console.log(">>> Res: ", res);
  //       this.setBarChart(res || null, monthId);
  //       this.selectedMonthYearForMonthlyStats = monthYear;
  //     }, (error) => {
  //       console.log(">>> Error: ", error);
  //     })
  // }

  setBarChart(res, monthId) {

    const getPaddedKey = (key) => String(key).padStart(2, '0');

    if(this.myDashboardChart != undefined) this.myDashboardChart.destroy();
    if(this.myPaymentChart != undefined) this.myPaymentChart.destroy();

    let canvas = <HTMLCanvasElement>document.getElementById("dashboardChart");
    let ctx = canvas.getContext("2d") || null;

    let paymentStatsCanvas = <HTMLCanvasElement>document.getElementById("paymentStatsChart");
    let paymentStatsCtx = paymentStatsCanvas.getContext("2d") || null;

    let fromDate = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
    let toDate = new Date(this.today.getFullYear(), this.today.getMonth() + 1, 0);

    let labels = [];
    for(let i = fromDate.getDate(); i <= toDate.getDate(); i++) {
      let date = new Date();
      date.setDate(i);
      labels.push(date.getDate().toString().padStart(2, '0'));
    }

    let customerDailyMapValue = Array(toDate.getDate()).fill(Number(0));
    let packageDailyMapValue = Array(toDate.getDate()).fill(Number(0));
    let serviceDailyMapValue = Array(toDate.getDate()).fill(Number(0));
    let paymentDailyMapValue = Array(toDate.getDate()).fill(Number(0));

    if(res != null) {
      Object.keys(res['customerDailyMap'] || []).map(e => Number(e)).forEach((key, idx) => {
        customerDailyMapValue[key - 1] = res['customerDailyMap'][getPaddedKey(key)] || 0;
      });
      Object.keys(res['packageDailyMap'] || []).map(e => Number(e)).forEach((key, idx) => {
        packageDailyMapValue[key - 1] = res['packageDailyMap'][getPaddedKey(key)] || 0;
      });
      Object.keys(res['serviceDailyMap'] || []).map(e => Number(e)).forEach((key, idx) => {
        serviceDailyMapValue[key - 1] = res['serviceDailyMap'][getPaddedKey(key)] || 0;
      });
      Object.keys(res['paymentDailyMap'] || []).map(e => Number(e)).forEach((key, idx) => {
        paymentDailyMapValue[key - 1] = res['paymentDailyMap'][getPaddedKey(key)] || 0;
      });
    }

    this.myDashboardChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [...labels],
        datasets: [
          {
            label: "Customers",
            data: [ ...customerDailyMapValue ],
            backgroundColor: "#58508d",

          },
          {
            label: "Services",
            data: [ ...serviceDailyMapValue ],
            backgroundColor: "#ff6361",

          },
          {
            label: "Packages",
            data: [ ...packageDailyMapValue ],
            backgroundColor: "#ffa600",

          }
        ]
      },
      options: {
        // responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: true,
          position: "right",
          labels: {
            usePointStyle: true,
          }
        },
        tooltips: {
          enabled: true,
          mode: "index",
          intersect: false,
          callbacks: {
            title: (item, data) => {
              let label = item[0].xLabel.padStart(2, "0") || "";
              let month = monthId.substr(4);
              let year = monthId.substr(0, 4);
              return `${year}-${month}-${label}`;
            },
          },
        },
        scales: {
          yAxes: [{
            gridLines: {
              color: '#fff',
              zeroLineColor: "#f1f1f1",
            },
            ticks: {
              beginAtZero: true
            }
          }],
          xAxes: [{
            gridLines: {
              color: '#fff',
              zeroLineColor: "#f1f1f1",
            },
            ticks: {
              beginAtZero: true
            }
          }]
        },
      }
    });

    this.myPaymentChart = new Chart(paymentStatsCtx, {
      type: "line",
      data: {
        labels: [...labels],
        datasets: [{
          label: "Received",
          data: [ ...paymentDailyMapValue ],
          fill: false,
          borderWidth: 2,
          pointRadius: 2,
          borderColor: "#0277BD",
          pointBackgroundColor: "#0277BD"
        }]
      },
      options: {
        // responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: true,
          position: "right",
          labels: {
            usePointStyle: true,
          }
        },
        tooltips: {
          enabled: true,
          mode: "index",
          intersect: false,
          callbacks: {
            title: (item, data) => {
              let label = item[0].xLabel.padStart(2, "0") || "";
              let month = monthId.substr(4);
              let year = monthId.substr(0, 4);
              return `${year}-${month}-${label}`;
            },
            label: (item, data) => {
              let label = data.datasets[0].label;
              let yLabel = item.yLabel;
              return label + ":  ₹ " + yLabel;
            }
          },
        },
        scales: {
          yAxes: [{
            gridLines: {
              color: '#fff',
              zeroLineColor: "#f1f1f1",
            },
            ticks: {
              beginAtZero: true
            }
          }],
          xAxes: [{
            gridLines: {
              color: '#fff',
              zeroLineColor: "#f1f1f1",
            },
            ticks: {
              beginAtZero: true
            }
          }]
        },
      }
    });

    this.myDashboardChart.update();
    this.myPaymentChart.update();
  }

}





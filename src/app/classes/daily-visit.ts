export class DailyVisitModel {
  dailyVisitId: string;
  customerId: string;
  customerMonthId: string;
  customerName: string;
  customerMobile: string;
  serviceIdList: string[];
  areaIdList: string[];
  visitModelList: VisitModel[];
  areaVisitModelList: AreaVisitModel[];
  date: firebase.default.firestore.Timestamp;
}

export class VisitModel {
  startDateTime: firebase.default.firestore.Timestamp;
  endDateTime: firebase.default.firestore.Timestamp;
  buyModelId: string;
  serviceId: string;
  serviceName: string;
  packageId: string;
  packageName: string;
  staffId: string;
  staffName: string;
  roomId: string;
  roomName: string;
  signal: number; // 0 -> started | 1 -> ended
  serviceType: number; // 0 -> service | 1 -> package
  startFrom: number; // 0 -> App | 1 -> Admin
  endFrom: number;
  sessionDuration: number;
  duration: number;
  underTime: boolean;
  startAdminStaffId: string;
  endAdminStaffId: string;
  startAdminStaffName: string;
  endAdminStaffName: string;
}

export class AreaVisitModel {
  startDateTime: firebase.default.firestore.Timestamp;
  endDateTime: firebase.default.firestore.Timestamp;
  areaId: string;
  areaName: string;
  signal: number;
  startFrom: number;
  endFrom: number;
  startAdminStaffId: string;
  endAdminStaffId: string;
  startAdminStaffName: string;
  endAdminStaffName: string;
  duration: number;
}

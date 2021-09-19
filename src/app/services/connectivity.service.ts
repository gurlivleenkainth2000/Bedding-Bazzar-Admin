import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ConnectivityService {

  public onlineOffline;
  isConnected$ = new Subject<boolean>();

  constructor() {
    setInterval(() => {
      this.onlineOffline = navigator.onLine;
      this.isConnected$.next(this.onlineOffline);
    }, 1000);
  }
}

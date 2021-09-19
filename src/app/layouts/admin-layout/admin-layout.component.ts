import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ConnectivityService } from 'src/app/services/connectivity.service';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit {

  isConnected: boolean = true;
  constructor(
    private connectivityService: ConnectivityService,
    private changeDetector: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.connectivityService.isConnected$.subscribe((result) => {
      this.isConnected = result;
      this.changeDetector.detectChanges();
    });
  }

}

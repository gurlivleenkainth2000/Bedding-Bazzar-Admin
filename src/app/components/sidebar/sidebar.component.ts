import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

declare interface RouteInfo {
  path: string;
  title: string;
  icon: string;
  class: string;
  children: RouteInfo[];
}
export const ROUTES: RouteInfo[] = [
  { path: '/customers', title: 'Customers', icon: 'groups', class: '', children: [] },
  { path: '/product-categories', title: 'Product Categories', icon: 'category', class: '', children: [] },
  { path: '/products', title: 'Products', icon: 'miscellaneous_services', class: '', children: [] },
  { path: '/queries', title: 'Queries', icon: 'query_builder', class: '', children: [] },
  { path: '/images', title: 'Images', icon: 'collections', class: '',children:[] },
  { path: '/slider-images', title: 'Slider Images', icon: 'image', class: '', children: [] },
  { path: '/videos', title: 'Videos', icon: 'video_library', class: '', children: [] },
  { path: '/offers', title: 'Offers', icon: 'local_offer', class: '', children: [] },
  { path: '/notifications', title: 'Notifications', icon: 'notifications_active', class: '', children: [] }
];

@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.scss"],
})
export class SidebarComponent implements OnInit {
  public menuItems: any[];
  public isCollapsed = true;

  constructor(private router: Router) {}

  ngOnInit() {
    this.menuItems = ROUTES.filter((menuItem) => menuItem);
    this.router.events.subscribe((event) => {
      this.isCollapsed = true;
    });
  }
}

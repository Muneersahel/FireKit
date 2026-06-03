import { Component, inject, OnInit } from "@angular/core";
import { Router, RouterOutlet } from "@angular/router";
import { ElectronApiService } from "./core/electron-api.service";

@Component({
  selector: "fk-root",
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly electron = inject(ElectronApiService);

  ngOnInit(): void {
    if (!this.electron.isAvailable()) return;
    this.electron.api.app.onNavigate((route) => {
      void this.router.navigateByUrl(route);
    });
  }
}

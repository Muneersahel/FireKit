import { Component, OnInit, inject } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { lucideChevronLeft, lucideChevronRight } from "@ng-icons/lucide";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmIconImports } from "@spartan-ng/helm/icon";
import { AppNavigationService } from "../core/app-navigation.service";
import { WindowChromeService } from "../core/window-chrome.service";
import { SidebarToggleComponent } from "./sidebar-toggle.component";

/** Sidebar-top toolbar: traffic lights (or spacer) + toggle + history. Codex-style. */
@Component({
  selector: "fk-app-sidebar-chrome",
  standalone: true,
  imports: [HlmIconImports, HlmButtonImports, SidebarToggleComponent],
  providers: [
    provideIcons({
      lucideChevronLeft,
      lucideChevronRight,
    }),
  ],
  template: `
    <div
      class="fk-sidebar-chrome"
      [class.fk-sidebar-chrome--mac]="chrome.isMac()"
      [class.fk-sidebar-chrome--custom-traffic]="
        chrome.showCustomTrafficLights()
      "
    >
      @if (chrome.showCustomTrafficLights()) {
        <div
          class="fk-sidebar-chrome__traffic"
          role="group"
          aria-label="Window"
        >
          <button
            type="button"
            class="fk-sidebar-chrome__traffic-btn fk-sidebar-chrome__traffic-btn--close"
            aria-label="Close"
            (click)="chrome.close()"
          ></button>
          <button
            type="button"
            class="fk-sidebar-chrome__traffic-btn fk-sidebar-chrome__traffic-btn--minimize"
            aria-label="Minimize"
            (click)="chrome.minimize()"
          ></button>
          <button
            type="button"
            class="fk-sidebar-chrome__traffic-btn fk-sidebar-chrome__traffic-btn--maximize"
            aria-label="Maximize"
            (click)="chrome.maximize()"
          ></button>
        </div>
      } @else if (chrome.isMac()) {
        <div class="fk-sidebar-chrome__traffic-spacer" aria-hidden="true"></div>
      }

      <div class="fk-sidebar-chrome__tools">
        <fk-sidebar-toggle buttonClass="fk-sidebar-chrome__icon-btn size-7" />

        <div class="fk-sidebar-chrome__nav" role="group" aria-label="History">
          <button
            hlmBtn
            variant="ghost"
            size="icon"
            type="button"
            class="fk-sidebar-chrome__icon-btn"
            aria-label="Go back"
            [disabled]="!nav.canGoBack()"
            (click)="nav.goBack()"
          >
            <ng-icon hlm name="lucideChevronLeft" size="sm" />
          </button>
          <button
            hlmBtn
            variant="ghost"
            size="icon"
            type="button"
            class="fk-sidebar-chrome__icon-btn"
            aria-label="Go forward"
            [disabled]="!nav.canGoForward()"
            (click)="nav.goForward()"
          >
            <ng-icon hlm name="lucideChevronRight" size="sm" />
          </button>
        </div>
      </div>

      <div class="fk-sidebar-chrome__drag" aria-hidden="true"></div>
    </div>
  `,
})
export class AppSidebarChromeComponent implements OnInit {
  readonly chrome = inject(WindowChromeService);
  readonly nav = inject(AppNavigationService);

  ngOnInit(): void {
    void this.chrome.init();
  }
}

import { Component, OnInit, inject } from "@angular/core";
import { WindowChromeService } from "../core/window-chrome.service";

/** Top drag strip + macOS traffic-light clearance for frameless onboarding. */
@Component({
  selector: "fk-onboarding-chrome",
  standalone: true,
  template: `
    <header
      class="fk-onboarding-chrome"
      [class.fk-onboarding-chrome--mac]="chrome.isMac()"
      [class.fk-onboarding-chrome--custom-traffic]="
        chrome.showCustomTrafficLights()
      "
    >
      @if (chrome.showCustomTrafficLights()) {
        <div
          class="fk-onboarding-chrome__traffic"
          role="group"
          aria-label="Window"
        >
          <button
            type="button"
            class="fk-onboarding-chrome__traffic-btn fk-onboarding-chrome__traffic-btn--close"
            aria-label="Close"
            (click)="chrome.close()"
          ></button>
          <button
            type="button"
            class="fk-onboarding-chrome__traffic-btn fk-onboarding-chrome__traffic-btn--minimize"
            aria-label="Minimize"
            (click)="chrome.minimize()"
          ></button>
          <button
            type="button"
            class="fk-onboarding-chrome__traffic-btn fk-onboarding-chrome__traffic-btn--maximize"
            aria-label="Maximize"
            (click)="chrome.maximize()"
          ></button>
        </div>
      } @else if (chrome.isMac()) {
        <div
          class="fk-onboarding-chrome__traffic-spacer"
          aria-hidden="true"
        ></div>
      }
      <div class="fk-onboarding-chrome__drag" aria-hidden="true"></div>
    </header>
  `,
})
export class OnboardingChromeComponent implements OnInit {
  readonly chrome = inject(WindowChromeService);

  ngOnInit(): void {
    void this.chrome.init();
  }
}

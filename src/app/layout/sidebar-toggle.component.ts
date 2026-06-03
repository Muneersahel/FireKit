import { Component, inject, input } from "@angular/core";
import { provideIcons } from "@ng-icons/core";
import { lucidePanelLeft, lucidePanelLeftClose } from "@ng-icons/lucide";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmIconImports } from "@spartan-ng/helm/icon";
import { HlmSidebarService } from "@spartan-ng/helm/sidebar";

@Component({
  selector: "fk-sidebar-toggle",
  standalone: true,
  imports: [HlmButtonImports, HlmIconImports],
  providers: [provideIcons({ lucidePanelLeft, lucidePanelLeftClose })],
  template: `
    <button
      hlmBtn
      variant="ghost"
      size="icon"
      type="button"
      [class]="buttonClass() + ' shrink-0'"
      [attr.aria-label]="
        sidebar.state() === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'
      "
      (click)="sidebar.toggleSidebar()"
    >
      @if (sidebar.state() === "expanded") {
        <ng-icon hlm name="lucidePanelLeftClose" size="sm" />
      } @else {
        <ng-icon hlm name="lucidePanelLeft" size="sm" />
      }
    </button>
  `,
})
export class SidebarToggleComponent {
  readonly sidebar = inject(HlmSidebarService);

  /** Optional extra classes (e.g. size-9 for collapsed rail). */
  readonly buttonClass = input<string>("fk-sidebar-toggle size-7");
}

import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { provideIcons } from "@ng-icons/core";
import { lucideChevronDown, lucidePlus } from "@ng-icons/lucide";
import type { ProjectMeta } from "@shared/ipc";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmIconImports } from "@spartan-ng/helm/icon";

@Component({
  selector: "fk-project-menu",
  standalone: true,
  imports: [HlmButtonImports, HlmIconImports, RouterLink],
  providers: [provideIcons({ lucideChevronDown, lucidePlus })],
  template: `
    <div class="fk-project-menu relative w-full">
      @if (compact()) {
        <button
          hlmBtn
          variant="ghost"
          size="icon"
          type="button"
          class="fk-project-menu__icon size-9"
          [attr.aria-expanded]="open()"
          aria-haspopup="menu"
          [attr.aria-label]="'Project: ' + activeLabel()"
          [title]="activeLabel()"
          (click)="toggle($event)"
        >
          <span class="fk-project-menu__badge">{{ activeInitials() }}</span>
        </button>
      } @else {
        <button
          hlmBtn
          variant="outline"
          type="button"
          class="fk-project-menu__trigger w-full justify-between font-mono text-xs"
          [attr.aria-expanded]="open()"
          aria-haspopup="menu"
          (click)="toggle($event)"
        >
          <span class="truncate">{{ activeLabel() }}</span>
          <ng-icon
            hlm
            name="lucideChevronDown"
            size="sm"
            class="text-muted-foreground shrink-0"
          />
        </button>
      }

      @if (open()) {
        <div
          class="fk-project-menu__panel"
          [class.fk-project-menu__panel--compact]="compact()"
          role="menu"
          aria-label="Select project"
        >
          <p class="fk-project-menu__title">Project</p>
          <ul class="fk-project-menu__list">
            @for (p of projects(); track p.id) {
              <li>
                <button
                  type="button"
                  role="menuitem"
                  class="fk-project-menu__item"
                  [class.fk-project-menu__item--active]="p.id === value()"
                  (click)="pick(p.id)"
                >
                  <span class="truncate font-medium">{{ p.displayName }}</span>
                  <span
                    class="text-muted-foreground truncate font-mono text-[10px]"
                    >{{ p.projectId }}</span
                  >
                </button>
              </li>
            }
          </ul>
          <a
            hlmBtn
            variant="outline"
            size="sm"
            routerLink="/projects/new"
            class="fk-project-menu__add mt-2 w-full gap-1.5"
            (click)="close()"
          >
            <ng-icon hlm name="lucidePlus" size="sm" />
            Add project
          </a>
        </div>
      }
    </div>
  `,
})
export class ProjectMenuComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  /** Icon-only trigger for collapsed sidebar rail. */
  readonly compact = input(false);

  readonly projects = input.required<ProjectMeta[]>();
  readonly value = input<string | null>(null);
  readonly valueChange = output<string>();

  readonly open = signal(false);

  readonly activeProject = computed(
    () => this.projects().find((p) => p.id === this.value()) ?? null,
  );

  readonly activeLabel = computed(
    () => this.activeProject()?.displayName ?? "Select project",
  );

  readonly activeInitials = computed(() => {
    const name = this.activeProject()?.displayName?.trim();
    if (!name) return "FK";
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.open.update((v) => !v);
  }

  pick(id: string): void {
    this.valueChange.emit(id);
    this.open.set(false);
  }

  close(): void {
    this.open.set(false);
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}

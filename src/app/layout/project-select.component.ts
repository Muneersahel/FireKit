import { Component, computed, input, output } from "@angular/core";
import type { ProjectMeta } from "@shared/ipc";
import { BrnSelectImports } from "@spartan-ng/brain/select";
import { HlmSelectImports } from "@spartan-ng/helm/select";

@Component({
  selector: "fk-project-select",
  standalone: true,
  imports: [BrnSelectImports, HlmSelectImports],
  template: `
    <hlm-select
      class="fk-project-select block w-full"
      [value]="selectedValue()"
      [itemToString]="labelForValue"
      (valueChange)="onSelect($event)"
    >
      <hlm-select-trigger size="sm" class="fk-project-select__trigger w-full">
        <hlm-select-value placeholder="Select project" />
      </hlm-select-trigger>
      <ng-template hlmSelectPortal>
        <hlm-select-content>
          @for (p of projects(); track p.id) {
            <hlm-select-item [value]="p.id">{{
              p.displayName
            }}</hlm-select-item>
          }
        </hlm-select-content>
      </ng-template>
    </hlm-select>
  `,
})
export class ProjectSelectComponent {
  readonly projects = input.required<ProjectMeta[]>();
  readonly value = input<string | null>(null);
  readonly valueChange = output<string>();

  readonly selectedValue = computed((): string | null => {
    const id = this.value();
    return id && id.length > 0 ? id : null;
  });

  /** Maps stored project id → label shown in the trigger. */
  protected readonly labelForValue = (id: string | null): string => {
    if (!id) return "";
    return this.projects().find((p) => p.id === id)?.displayName ?? id;
  };

  onSelect(next: string | null | undefined): void {
    if (!next || next === this.value()) return;
    this.valueChange.emit(next);
  }
}

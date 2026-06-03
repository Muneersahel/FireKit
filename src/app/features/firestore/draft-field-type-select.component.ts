import { Component, input, linkedSignal, output } from "@angular/core";
import { BrnSelectImports } from "@spartan-ng/brain/select";
import { HlmSelectImports } from "@spartan-ng/helm/select";
import { DRAFT_VALUE_TYPES, type DraftValueType } from "./draft-field.types";

@Component({
  selector: "fk-draft-field-type-select",
  standalone: true,
  imports: [BrnSelectImports, HlmSelectImports],
  template: `
    <hlm-select
      class="block w-full"
      [(value)]="selected"
      (valueChange)="onSelect($event)"
    >
      <hlm-select-trigger size="sm" class="w-full font-mono text-xs">
        <hlm-select-value placeholder="Type" />
      </hlm-select-trigger>
      <hlm-select-content hlmSelectPortal>
        @for (t of types; track t) {
          <hlm-select-item [value]="t">{{ t }}</hlm-select-item>
        }
      </hlm-select-content>
    </hlm-select>
  `,
})
export class DraftFieldTypeSelectComponent {
  readonly value = input.required<DraftValueType>();
  readonly valueChange = output<DraftValueType>();

  protected readonly types = DRAFT_VALUE_TYPES;
  readonly selected = linkedSignal(() => this.value());

  onSelect(next: DraftValueType | null): void {
    if (next == null || next === this.value()) return;
    this.valueChange.emit(next);
  }
}

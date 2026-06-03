import { Component, input, linkedSignal, output } from "@angular/core";
import { BrnSelectImports } from "@spartan-ng/brain/select";
import { HlmSelectImports } from "@spartan-ng/helm/select";

const BOOLEAN_VALUES = ["true", "false"] as const;

@Component({
  selector: "fk-draft-field-boolean-select",
  standalone: true,
  imports: [BrnSelectImports, HlmSelectImports],
  template: `
    <hlm-select
      class="block w-full"
      [(value)]="selected"
      (valueChange)="onSelect($event)"
    >
      <hlm-select-trigger size="sm" class="w-full font-mono text-xs">
        <hlm-select-value placeholder="Value" />
      </hlm-select-trigger>
      <hlm-select-content hlmSelectPortal>
        @for (v of values; track v) {
          <hlm-select-item [value]="v">{{ v }}</hlm-select-item>
        }
      </hlm-select-content>
    </hlm-select>
  `,
})
export class DraftFieldBooleanSelectComponent {
  readonly value = input.required<string>();
  readonly valueChange = output<string>();

  protected readonly values = BOOLEAN_VALUES;
  readonly selected = linkedSignal(() => this.value() || "true");

  onSelect(next: string | null): void {
    if (next == null || next === this.value()) return;
    this.valueChange.emit(next);
  }
}

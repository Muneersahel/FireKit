import { NgTemplateOutlet } from "@angular/common";
import { Component, input, signal } from "@angular/core";
import {
  formatPrimitive,
  valueKind,
  valueKindLabel,
  type FirestoreValueKind,
} from "./firestore-value.utils";

interface TreeChild {
  key: string;
  value: unknown;
}

type ParentKind = "none" | "array" | "object";

@Component({
  selector: "fk-firestore-value-tree",
  standalone: true,
  imports: [FirestoreValueTreeComponent, NgTemplateOutlet],
  template: `
    @if (wrapAsRoot()) {
      <article class="fk-fs-doc-field">
        @if (isBranch()) {
          <ng-container *ngTemplateOutlet="branchBlock" />
        } @else {
          <ng-container *ngTemplateOutlet="leafBlock" />
        }
      </article>
    } @else if (parentKind() === "object") {
      <article class="fk-fs-object-prop">
        @if (isBranch()) {
          <ng-container *ngTemplateOutlet="branchBlock" />
        } @else {
          <ng-container *ngTemplateOutlet="leafBlock" />
        }
      </article>
    } @else {
      @if (isBranch()) {
        <ng-container *ngTemplateOutlet="branchBlock" />
      } @else {
        <ng-container *ngTemplateOutlet="leafBlock" />
      }
    }

    <ng-template #branchBlock>
      <div
        class="fk-fs-doc-field__branch"
        [class.fk-fs-doc-field__branch--embedded]="parentKind() !== 'none'"
      >
        @if (showNodeHeader()) {
          <button
            type="button"
            class="fk-fs-doc-field__branch-toggle"
            [attr.aria-expanded]="expanded()"
            (click)="expanded.set(!expanded())"
          >
            <span class="fk-fs-doc-field__key" [title]="displayKey()">{{
              displayKey()
            }}</span>
            <span class="fk-fs-doc-field__branch-meta">
              @if (branchSummary()) {
                <span class="fk-fs-doc-field__summary">{{
                  branchSummary()
                }}</span>
              }
              <span class="fk-fs-kind" [class]="kindClass(branchKind())">
                {{ valueKindLabel(branchKind()) }}
              </span>
              @if (branchExtraBadge()) {
                <span class="fk-fs-doc-field__count">{{
                  branchExtraBadge()
                }}</span>
              }
              <span class="fk-fs-doc-field__chevron" aria-hidden="true">{{
                expanded() ? "▾" : "▸"
              }}</span>
            </span>
          </button>
        } @else {
          <button
            type="button"
            class="fk-fs-doc-field__branch-toggle fk-fs-doc-field__branch-toggle--compact"
            [attr.aria-expanded]="expanded()"
            (click)="expanded.set(!expanded())"
          >
            <span
              class="fk-fs-doc-field__branch-meta fk-fs-doc-field__branch-meta--start"
            >
              @if (branchSummary()) {
                <span class="fk-fs-doc-field__summary">{{
                  branchSummary()
                }}</span>
              }
              @if (branchExtraBadge()) {
                <span class="fk-fs-doc-field__count">{{
                  branchExtraBadge()
                }}</span>
              }
              <span class="fk-fs-doc-field__chevron" aria-hidden="true">{{
                expanded() ? "▾" : "▸"
              }}</span>
            </span>
          </button>
        }
        @if (expanded()) {
          <div [class]="childrenContainerClass()">
            @for (child of children(); track child.key) {
              @if (branchKind() === "array") {
                <article class="fk-fs-array-item">
                  <div class="fk-fs-array-item__header">
                    <span class="fk-fs-array-item__index">{{ child.key }}</span>
                    <span
                      class="fk-fs-kind"
                      [class]="kindClass(valueKind(child.value))"
                    >
                      {{ valueKindLabel(valueKind(child.value)) }}
                    </span>
                  </div>
                  <div class="fk-fs-array-item__body">
                    <fk-firestore-value-tree
                      [nodeKey]="child.key"
                      [value]="child.value"
                      [depth]="depth() + 1"
                      [parentKind]="'array'"
                    />
                  </div>
                </article>
              } @else {
                <fk-firestore-value-tree
                  [nodeKey]="child.key"
                  [value]="child.value"
                  [depth]="depth() + 1"
                  [parentKind]="'object'"
                />
              }
            }
          </div>
        }
      </div>
    </ng-template>

    <ng-template #leafBlock>
      <div
        class="fk-fs-doc-field__leaf"
        [class.fk-fs-doc-field__leaf--embedded]="parentKind() !== 'none'"
      >
        @if (showNodeHeader()) {
          <div class="fk-fs-doc-field__leaf-head">
            <span class="fk-fs-doc-field__key" [title]="displayKey()">{{
              displayKey()
            }}</span>
            <span class="fk-fs-kind" [class]="kindClass(leafKind())">
              {{ valueKindLabel(leafKind()) }}
            </span>
          </div>
        }
        <p
          class="fk-fs-doc-field__value"
          [class.fk-fs-doc-field__value--null]="leafKind() === 'null'"
          [class.fk-fs-doc-field__value--bool]="leafKind() === 'boolean'"
          [class.fk-fs-doc-field__value--number]="leafKind() === 'number'"
          [title]="leafTitle()"
        >
          {{ formatPrimitive(value()) }}
        </p>
      </div>
    </ng-template>
  `,
})
export class FirestoreValueTreeComponent {
  readonly nodeKey = input<string>("value");
  readonly value = input.required<unknown>();
  readonly depth = input(0);
  readonly parentKind = input<ParentKind>("none");

  readonly expanded = signal(this.depth() === 0);
  readonly valueKindLabel = valueKindLabel;
  readonly valueKind = valueKind;

  wrapAsRoot(): boolean {
    return this.depth() === 0 && this.parentKind() === "none";
  }

  showNodeHeader(): boolean {
    return this.parentKind() !== "array";
  }

  displayKey(): string {
    return this.nodeKey();
  }

  isBranch(): boolean {
    const kind = valueKind(this.value());
    return kind === "array" || kind === "object" || kind === "timestamp";
  }

  branchKind(): FirestoreValueKind {
    return valueKind(this.value());
  }

  branchExtraBadge(): string | null {
    const kind = this.branchKind();
    if (kind === "array") {
      const n = (this.value() as unknown[]).length;
      return `${n} item${n === 1 ? "" : "s"}`;
    }
    if (kind === "object") {
      const n = Object.keys(this.value() as object).length;
      return `${n} key${n === 1 ? "" : "s"}`;
    }
    return null;
  }

  branchSummary(): string | null {
    if (this.branchKind() === "timestamp") {
      return formatPrimitive(this.value());
    }
    return null;
  }

  childrenContainerClass(): string {
    if (this.branchKind() === "array") {
      return "fk-fs-doc-field__children fk-fs-doc-field__children--array";
    }
    if (this.branchKind() === "object" || this.branchKind() === "timestamp") {
      return "fk-fs-doc-field__children fk-fs-doc-field__children--object";
    }
    return "fk-fs-doc-field__children";
  }

  children(): TreeChild[] {
    const val = this.value();
    const kind = valueKind(val);

    if (kind === "array") {
      return (val as unknown[]).map((item, index) => ({
        key: `[${index}]`,
        value: item,
      }));
    }

    if (kind === "object" || kind === "timestamp") {
      const record = val as Record<string, unknown>;
      return Object.keys(record)
        .sort((a, b) => a.localeCompare(b))
        .map((key) => ({ key, value: record[key] }));
    }

    return [];
  }

  leafKind(): FirestoreValueKind {
    return valueKind(this.value());
  }

  leafTitle(): string {
    return this.formatPrimitive(this.value());
  }

  kindClass(kind: FirestoreValueKind): string {
    return `fk-fs-kind--${kind}`;
  }

  formatPrimitive = formatPrimitive;
}

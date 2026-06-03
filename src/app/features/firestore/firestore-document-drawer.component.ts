import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HlmAlertImports } from "@spartan-ng/helm/alert";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmInputImports } from "@spartan-ng/helm/input";
import { HlmLabelImports } from "@spartan-ng/helm/label";
import { HlmNativeSelectImports } from "@spartan-ng/helm/native-select";
import { HlmSpinnerImports } from "@spartan-ng/helm/spinner";
import { HlmTextareaImports } from "@spartan-ng/helm/textarea";
import { ElectronApiService } from "../../core/electron-api.service";
import { ProjectContextService } from "../../core/project-context.service";
import { DeleteConfirmDialogComponent } from "./delete-confirm-dialog.component";
import {
  createDraftFieldRow,
  DRAFT_VALUE_TYPES,
  parseDraftValue,
  type DraftFieldRow,
  type DraftValueType,
} from "./draft-field.types";
import { FirestoreNavService } from "./firestore-nav.service";
import {
  buildSubcollectionPath,
  documentIdFromPath,
} from "./firestore-path.utils";
import { FirestoreValueTreeComponent } from "./firestore-value-tree.component";
import {
  formatJson,
  valueKind,
  valueKindLabel,
  type FirestoreValueKind,
} from "./firestore-value.utils";

export interface DocumentDrawerState {
  path: string;
  isNew?: boolean;
}

type DrawerPanel = "fields" | "json";

@Component({
  selector: "fk-firestore-document-drawer",
  standalone: true,
  host: {
    class: "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
  },
  imports: [
    NgTemplateOutlet,
    FormsModule,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    HlmNativeSelectImports,
    HlmTextareaImports,
    HlmAlertImports,
    HlmSpinnerImports,
    FirestoreValueTreeComponent,
    DeleteConfirmDialogComponent,
  ],
  template: `
    @if (drawer(); as state) {
      @if (isPage()) {
        <div
          class="fk-doc-page"
          role="main"
          [attr.aria-label]="'Document ' + state.path"
        >
          <header class="fk-doc-page__toolbar">
            <button
              hlmBtn
              variant="ghost"
              size="sm"
              type="button"
              class="fk-doc-page__back"
              (click)="requestClose()"
            >
              <span class="fk-doc-page__back-icon" aria-hidden="true">←</span>
              Back
            </button>

            <div class="fk-doc-page__identity">
              <h1 class="fk-doc-page__title" [title]="docId()">
                {{ docId() }}
              </h1>
              @if (isNew()) {
                <span class="fk-doc-page__badge">New</span>
              }
            </div>

            <div class="fk-doc-page__actions">
              <button
                hlmBtn
                size="sm"
                type="button"
                [disabled]="loading() || saving()"
                (click)="save()"
              >
                @if (saving()) {
                  <hlm-spinner class="mr-2 size-4" />
                }
                Save
              </button>
              @if (!isNew()) {
                <button
                  hlmBtn
                  variant="destructive"
                  size="sm"
                  type="button"
                  [disabled]="loading() || saving()"
                  (click)="openDeleteDialog()"
                >
                  Delete
                </button>
              }
            </div>
          </header>

          <div class="fk-doc-page__layout">
            <aside class="fk-doc-page__rail" aria-label="Document details">
              <div class="fk-doc-page__rail-scroll">
                <ng-container *ngTemplateOutlet="metaRail" />
              </div>
            </aside>

            <div class="fk-doc-page__workspace">
              <ng-container *ngTemplateOutlet="documentWorkspace" />
            </div>
          </div>

          <fk-delete-confirm-dialog
            [open]="confirmDelete()"
            [detail]="state.path"
            [busy]="saving()"
            (confirm)="confirmRemove()"
            (cancel)="cancelDeleteDialog()"
          />
        </div>
      } @else {
        <div
          class="fk-doc-drawer fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="'Document ' + state.path"
        >
          <button
            type="button"
            class="fk-doc-drawer__backdrop absolute inset-0"
            aria-label="Close document panel"
            (click)="requestClose()"
          ></button>

          <aside class="fk-doc-drawer__panel relative z-10">
            <header class="fk-doc-drawer__header">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <p class="fk-doc-drawer__eyebrow">Document</p>
                  <h2 class="fk-doc-drawer__title" [title]="docId()">
                    {{ docId() }}
                  </h2>
                  <p class="fk-doc-drawer__path" [title]="state.path">
                    {{ state.path }}
                  </p>
                </div>
                <button
                  hlmBtn
                  variant="ghost"
                  size="icon"
                  type="button"
                  class="shrink-0"
                  aria-label="Close"
                  (click)="requestClose()"
                >
                  ✕
                </button>
              </div>
              <ng-container *ngTemplateOutlet="metaRail" />
            </header>

            <ng-container *ngTemplateOutlet="documentWorkspace" />

            <footer class="fk-doc-drawer__footer">
              <button
                hlmBtn
                size="sm"
                type="button"
                [disabled]="loading() || saving()"
                (click)="save()"
              >
                @if (saving()) {
                  <hlm-spinner class="mr-2 size-4" />
                }
                Save
              </button>
              @if (!isNew()) {
                <button
                  hlmBtn
                  variant="destructive"
                  size="sm"
                  type="button"
                  [disabled]="loading() || saving()"
                  (click)="openDeleteDialog()"
                >
                  Delete
                </button>
              }
              <button
                hlmBtn
                variant="ghost"
                size="sm"
                class="ml-auto"
                type="button"
                (click)="requestClose()"
              >
                Close
              </button>
            </footer>

            <fk-delete-confirm-dialog
              [open]="confirmDelete()"
              [detail]="state.path"
              [busy]="saving()"
              (confirm)="confirmRemove()"
              (cancel)="cancelDeleteDialog()"
            />
          </aside>
        </div>
      }

      <ng-template #metaRail>
        @if (!loading() && fieldEntries().length > 0) {
          <section class="fk-doc-page__rail-block" aria-label="Field summary">
            <p class="fk-doc-page__rail-label">Summary</p>
            <div class="fk-doc-drawer__stats fk-doc-page__stats">
              <span class="fk-doc-drawer__stat">
                <span class="fk-doc-drawer__stat-value tabular-nums">{{
                  fieldEntries().length
                }}</span>
                fields
              </span>
              @for (chip of typeSummary(); track chip.kind) {
                <span class="fk-fs-kind" [class]="kindClass(chip.kind)">
                  {{ chip.count }} {{ valueKindLabel(chip.kind) }}
                </span>
              }
            </div>
          </section>
        }

        @if (createTime() || updateTime()) {
          <section class="fk-doc-page__rail-block" aria-label="Timestamps">
            <p class="fk-doc-page__rail-label">Timestamps</p>
            <dl class="fk-doc-drawer__meta fk-doc-page__meta">
              @if (createTime(); as created) {
                <div class="fk-doc-drawer__meta-row">
                  <dt>Created</dt>
                  <dd [title]="formatMetaTime(created)">
                    {{ formatMetaTime(created) }}
                  </dd>
                </div>
              }
              @if (updateTime(); as updated) {
                <div class="fk-doc-drawer__meta-row">
                  <dt>Updated</dt>
                  <dd [title]="formatMetaTime(updated)">
                    {{ formatMetaTime(updated) }}
                  </dd>
                </div>
              }
            </dl>
          </section>
        }

        @if (!isNew()) {
          <section
            class="fk-doc-page__rail-block fk-doc-drawer__subcols"
            aria-label="Subcollections"
          >
            <p class="fk-doc-drawer__subcols-label">Subcollections</p>
            @if (loadingSubcollections()) {
              <p class="text-muted-foreground text-xs">Loading…</p>
            } @else if (subcollections().length === 0) {
              <p class="text-muted-foreground text-xs">None on this document</p>
            } @else {
              <div class="fk-doc-drawer__subcols-list">
                @for (name of subcollections(); track name) {
                  <button
                    hlmBtn
                    variant="outline"
                    size="sm"
                    type="button"
                    class="font-mono text-xs"
                    (click)="openSubcollection(name)"
                  >
                    {{ name }}
                  </button>
                }
              </div>
            }
          </section>
        }
      </ng-template>

      <ng-template #documentWorkspace>
        <div class="fk-doc-workspace" [class.fk-doc-workspace--page]="isPage()">
          <div
            class="fk-doc-drawer__tabs"
            [class.fk-doc-page__tabs]="isPage()"
            role="tablist"
            aria-label="Document view"
          >
            <button
              type="button"
              role="tab"
              class="fk-doc-drawer__tab"
              [class.fk-doc-drawer__tab--active]="panel() === 'fields'"
              [attr.aria-selected]="panel() === 'fields'"
              (click)="panel.set('fields')"
            >
              Fields
            </button>
            <button
              type="button"
              role="tab"
              class="fk-doc-drawer__tab"
              [class.fk-doc-drawer__tab--active]="panel() === 'json'"
              [attr.aria-selected]="panel() === 'json'"
              (click)="panel.set('json')"
            >
              JSON
            </button>
          </div>

          <div
            class="fk-doc-drawer__body min-h-0 flex-1 overflow-auto"
            [class.fk-doc-page__scroll]="isPage()"
          >
            @if (loading()) {
              <div class="fk-doc-drawer__loading">
                <hlm-spinner class="size-5" />
                <span>Loading document…</span>
              </div>
            } @else {
              @if (error()) {
                <div hlmAlert variant="destructive" class="mb-4">
                  <p hlmAlertDescription>{{ error() }}</p>
                </div>
              }

              @if (panel() === "fields") {
                <section
                  class="fk-doc-drawer__fields"
                  aria-label="Document fields"
                >
                  @if (isNew()) {
                    <div class="fk-doc-new-fields">
                      <div class="fk-doc-new-fields__intro">
                        <p class="fk-doc-new-fields__title">
                          Add document fields
                        </p>
                        <p class="fk-doc-new-fields__hint">
                          Enter a name and value for each field. Use JSON type
                          for objects and arrays.
                        </p>
                      </div>

                      <div
                        class="fk-doc-new-fields__rows"
                        role="list"
                        aria-label="New field rows"
                      >
                        @for (row of displayDraftFields(); track row.id) {
                          <div class="fk-doc-new-fields__row" role="listitem">
                            <div class="fk-doc-new-fields__row-grid">
                              <div class="fk-doc-new-fields__field">
                                <label
                                  hlmLabel
                                  class="fk-doc-new-fields__label"
                                  [for]="'field-name-' + row.id"
                                  >Name</label
                                >
                                <input
                                  hlmInput
                                  class="font-mono text-xs"
                                  [id]="'field-name-' + row.id"
                                  placeholder="e.g. email"
                                  [ngModel]="row.name"
                                  (ngModelChange)="
                                    updateDraftField(row.id, { name: $event })
                                  "
                                />
                              </div>
                              <div class="fk-doc-new-fields__field">
                                <label hlmLabel class="fk-doc-new-fields__label"
                                  >Type</label
                                >
                                <hlm-native-select
                                  size="sm"
                                  class="fk-doc-new-fields__select w-full font-mono text-xs"
                                  [value]="row.valueType"
                                  (valueChange)="
                                    onDraftTypeChange(row.id, $event)
                                  "
                                >
                                  @for (t of draftValueTypes; track t) {
                                    <option [value]="t">{{ t }}</option>
                                  }
                                </hlm-native-select>
                              </div>
                            </div>
                            <div class="fk-doc-new-fields__field">
                              <label
                                hlmLabel
                                class="fk-doc-new-fields__label"
                                [for]="'field-value-' + row.id"
                                >Value</label
                              >
                              @if (row.valueType === "json") {
                                <textarea
                                  hlmTextarea
                                  class="fk-doc-new-fields__json-input font-mono text-xs"
                                  [id]="'field-value-' + row.id"
                                  placeholder='{ "key": "value" } or ["a","b"]'
                                  rows="3"
                                  [ngModel]="row.value"
                                  (ngModelChange)="
                                    updateDraftField(row.id, { value: $event })
                                  "
                                ></textarea>
                              } @else if (row.valueType === "null") {
                                <input
                                  hlmInput
                                  class="text-muted-foreground font-mono text-xs"
                                  [id]="'field-value-' + row.id"
                                  value="null"
                                  disabled
                                />
                              } @else if (row.valueType === "boolean") {
                                <hlm-native-select
                                  size="sm"
                                  class="fk-doc-new-fields__select w-full font-mono text-xs"
                                  [value]="row.value || 'true'"
                                  (valueChange)="
                                    updateDraftField(row.id, {
                                      value: $event ?? 'true',
                                    })
                                  "
                                >
                                  <option value="true">true</option>
                                  <option value="false">false</option>
                                </hlm-native-select>
                              } @else {
                                <input
                                  hlmInput
                                  class="font-mono text-xs"
                                  [id]="'field-value-' + row.id"
                                  [placeholder]="
                                    valuePlaceholder(row.valueType)
                                  "
                                  [ngModel]="row.value"
                                  (ngModelChange)="
                                    updateDraftField(row.id, { value: $event })
                                  "
                                />
                              }
                            </div>
                            @if (draftFields().length > 1) {
                              <button
                                hlmBtn
                                variant="ghost"
                                size="sm"
                                type="button"
                                class="fk-doc-new-fields__remove"
                                (click)="removeDraftField(row.id)"
                              >
                                Remove
                              </button>
                            }
                          </div>
                        }
                      </div>

                      <button
                        hlmBtn
                        variant="outline"
                        size="sm"
                        type="button"
                        class="fk-doc-new-fields__add"
                        (click)="addDraftField()"
                      >
                        + Add field
                      </button>

                      @if (fieldEntries().length > 0) {
                        <div class="fk-doc-new-fields__preview">
                          <p class="fk-doc-new-fields__preview-title">
                            Preview
                          </p>
                          <div class="fk-doc-drawer__field-list">
                            @for (entry of fieldEntries(); track entry.key) {
                              <fk-firestore-value-tree
                                [nodeKey]="entry.key"
                                [value]="entry.value"
                              />
                            }
                          </div>
                        </div>
                      }
                    </div>
                  } @else if (fieldEntries().length === 0) {
                    <div class="fk-doc-drawer__empty">
                      <p class="fk-doc-drawer__empty-title">No fields</p>
                      <p class="text-muted-foreground text-sm">
                        This document has no fields.
                      </p>
                    </div>
                  } @else {
                    <div
                      class="fk-doc-drawer__field-list"
                      [class.fk-doc-page__field-list]="isPage()"
                    >
                      @for (entry of fieldEntries(); track entry.key) {
                        <fk-firestore-value-tree
                          [nodeKey]="entry.key"
                          [value]="entry.value"
                        />
                      }
                    </div>
                  }
                </section>
              } @else {
                <section
                  class="fk-doc-drawer__json space-y-3"
                  aria-label="Edit JSON"
                >
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-muted-foreground text-xs">
                      Edit the full document as JSON. Invalid JSON cannot be
                      saved.
                    </p>
                    <button
                      hlmBtn
                      variant="outline"
                      size="sm"
                      type="button"
                      (click)="syncJsonFromTree()"
                    >
                      Reset from loaded
                    </button>
                  </div>
                  <textarea
                    hlmTextarea
                    class="fk-doc-drawer__json-editor font-mono text-xs leading-relaxed"
                    [class.fk-doc-page__json-editor]="isPage()"
                    [(ngModel)]="jsonText"
                    spellcheck="false"
                  ></textarea>
                </section>
              }
            }
          </div>
        </div>
      </ng-template>
    }
  `,
})
export class FirestoreDocumentDrawerComponent {
  readonly drawer = input<DocumentDrawerState | null>(null);
  readonly collectionPath = input("");
  readonly presentation = input<"drawer" | "page">("drawer");
  readonly close = output<void>();
  readonly saved = output<void>();
  readonly browseCollection = output<string>();

  private readonly electron = inject(ElectronApiService);
  private readonly ctx = inject(ProjectContextService);
  private readonly nav = inject(FirestoreNavService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly confirmDelete = signal(false);
  readonly isNew = signal(false);
  readonly createTime = signal<string | undefined>(undefined);
  readonly updateTime = signal<string | undefined>(undefined);
  readonly panel = signal<DrawerPanel>("fields");
  readonly subcollections = signal<string[]>([]);
  readonly loadingSubcollections = signal(false);

  readonly valueKindLabel = valueKindLabel;

  jsonText = "{}";
  private data = signal<Record<string, unknown>>({});
  readonly draftFields = signal<DraftFieldRow[]>([createDraftFieldRow()]);
  protected readonly draftValueTypes = DRAFT_VALUE_TYPES;

  readonly displayDraftFields = computed(() => {
    const rows = this.draftFields();
    return rows.length > 0 ? rows : [createDraftFieldRow()];
  });

  readonly isPage = computed(() => this.presentation() === "page");

  readonly docId = computed(() => {
    const path = this.drawer()?.path ?? "";
    return path.split("/").filter(Boolean).pop() ?? path;
  });

  readonly fieldEntries = computed(() => {
    const record = this.data();
    return Object.keys(record)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => ({ key, value: record[key] }));
  });

  readonly typeSummary = computed(() => {
    const counts = new Map<FirestoreValueKind, number>();
    for (const { value } of this.fieldEntries()) {
      const kind = valueKind(value);
      counts.set(kind, (counts.get(kind) ?? 0) + 1);
    }
    const order: FirestoreValueKind[] = [
      "string",
      "number",
      "boolean",
      "timestamp",
      "array",
      "object",
      "null",
    ];
    return order
      .filter((kind) => counts.has(kind))
      .map((kind) => ({ kind, count: counts.get(kind)! }));
  });

  constructor() {
    effect(() => {
      const state = this.drawer();
      if (!state) return;
      this.panel.set("fields");
      void this.load(state.path, !!state.isNew);
    });
  }

  kindClass(kind: FirestoreValueKind): string {
    return `fk-fs-kind--${kind}`;
  }

  formatMetaTime(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  requestClose(): void {
    this.cancelDeleteDialog();
    this.close.emit();
  }

  openSubcollection(subcollectionId: string): void {
    const coll = this.collectionPath();
    const docPath = this.drawer()?.path;
    if (!coll || !docPath) return;
    const target = buildSubcollectionPath(
      coll,
      documentIdFromPath(docPath),
      subcollectionId,
    );
    this.nav.navigateToCollection(target);
    this.browseCollection.emit(target);
  }

  openDeleteDialog(): void {
    this.confirmDelete.set(true);
  }

  cancelDeleteDialog(): void {
    this.confirmDelete.set(false);
  }

  syncJsonFromTree(): void {
    this.jsonText = formatJson(this.data());
    this.error.set(null);
  }

  valuePlaceholder(type: DraftValueType): string {
    if (type === "number") return "e.g. 42";
    if (type === "string") return "e.g. hello@example.com";
    return "";
  }

  addDraftField(): void {
    this.draftFields.update((rows) => [...rows, createDraftFieldRow()]);
  }

  removeDraftField(id: string): void {
    this.draftFields.update((rows) => {
      const next = rows.filter((r) => r.id !== id);
      return next.length ? next : [createDraftFieldRow()];
    });
    this.syncDataFromDraft();
  }

  updateDraftField(id: string, patch: Partial<DraftFieldRow>): void {
    this.draftFields.update((rows) =>
      rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
    if (this.isNew()) {
      this.syncDataFromDraft();
    }
  }

  onDraftTypeChange(id: string, valueType: string | null): void {
    if (
      !valueType ||
      !DRAFT_VALUE_TYPES.includes(valueType as DraftValueType)
    ) {
      return;
    }
    const typed = valueType as DraftValueType;

    this.draftFields.update((rows) =>
      rows.map((r) => {
        if (r.id !== id) return r;
        const next: DraftFieldRow = { ...r, valueType: typed };
        if (typed === "boolean") next.value = "true";
        else if (typed === "null") next.value = "";
        else if (typed === "json" && !r.value.trim()) next.value = "{}";
        else if (typed === "number" && r.valueType !== "number") {
          next.value = r.value.trim() || "0";
        }
        return next;
      }),
    );
    this.syncDataFromDraft();
  }

  syncDataFromDraft(): void {
    if (!this.isNew()) return;

    const record: Record<string, unknown> = {};
    const errors: string[] = [];

    for (const row of this.draftFields()) {
      const name = row.name.trim();
      if (!name) continue;

      if (record[name] !== undefined) {
        errors.push(`Duplicate field name "${name}"`);
        continue;
      }

      try {
        record[name] = parseDraftValue(row);
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }

    this.data.set(record);
    this.jsonText = formatJson(record);
    this.error.set(errors.length ? errors.join(". ") : null);
  }

  async load(path: string, isNew: boolean): Promise<void> {
    const projectId = this.ctx.activeProjectId();
    if (!projectId) return;

    this.loading.set(true);
    this.error.set(null);
    this.confirmDelete.set(false);
    this.isNew.set(isNew);
    this.subcollections.set([]);

    try {
      if (isNew) {
        this.draftFields.set([createDraftFieldRow()]);
        this.data.set({});
        this.jsonText = "{}";
        this.createTime.set(undefined);
        this.updateTime.set(undefined);
        this.syncDataFromDraft();
      } else {
        const doc = await this.electron.api.firestore.get({
          projectId,
          documentPath: path,
        });
        if (doc) {
          this.data.set(doc.data);
          this.jsonText = formatJson(doc.data);
          this.createTime.set(doc.createTime);
          this.updateTime.set(doc.updateTime);
        } else {
          this.data.set({});
          this.jsonText = "{}";
          this.error.set("Document not found");
        }
        await this.loadSubcollections(path);
      }
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.loading.set(false);
    }
  }

  private async loadSubcollections(documentPath: string): Promise<void> {
    const projectId = this.ctx.activeProjectId();
    if (!projectId) return;
    this.loadingSubcollections.set(true);
    try {
      const names = await this.electron.api.firestore.listSubcollections({
        projectId,
        documentPath,
      });
      this.subcollections.set(names);
    } catch {
      this.subcollections.set([]);
    } finally {
      this.loadingSubcollections.set(false);
    }
  }

  async save(): Promise<void> {
    const projectId = this.ctx.activeProjectId();
    const path = this.drawer()?.path;
    if (!projectId || !path) return;

    let data: Record<string, unknown>;

    if (this.isNew() && this.panel() === "fields") {
      this.syncDataFromDraft();
      data = this.data();
      if (Object.keys(data).length === 0) {
        this.error.set("Add at least one field with a name");
        return;
      }
      if (this.error()) return;
    } else {
      try {
        data = JSON.parse(this.jsonText) as Record<string, unknown>;
      } catch {
        this.error.set("Invalid JSON");
        this.panel.set("json");
        return;
      }
    }

    this.saving.set(true);
    this.error.set(null);
    try {
      await this.electron.api.firestore.upsert({
        projectId,
        documentPath: path,
        data,
        merge: !this.isNew(),
      });
      this.data.set(data);
      this.isNew.set(false);
      this.saved.emit();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.saving.set(false);
    }
  }

  async confirmRemove(): Promise<void> {
    const projectId = this.ctx.activeProjectId();
    const path = this.drawer()?.path;
    if (!projectId || !path) return;

    this.saving.set(true);
    this.error.set(null);
    try {
      await this.electron.api.firestore.delete({
        projectId,
        documentPath: path,
      });
      this.cancelDeleteDialog();
      this.saved.emit();
      this.requestClose();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.saving.set(false);
    }
  }
}

import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import type {
  FirestoreDocumentDto,
  FirestoreFilter,
  FirestoreWhereOp,
  IndexSearchHit,
} from "@shared/ipc";
import { HlmAlertImports } from "@spartan-ng/helm/alert";
import { HlmBadgeImports } from "@spartan-ng/helm/badge";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmCardImports } from "@spartan-ng/helm/card";
import { HlmInputImports } from "@spartan-ng/helm/input";
import { HlmLabelImports } from "@spartan-ng/helm/label";
import { HlmNativeSelectImports } from "@spartan-ng/helm/native-select";
import { HlmSeparatorImports } from "@spartan-ng/helm/separator";
import { HlmSkeletonImports } from "@spartan-ng/helm/skeleton";
import { HlmSpinnerImports } from "@spartan-ng/helm/spinner";
import { HlmTableImports } from "@spartan-ng/helm/table";
import { ElectronApiService } from "../../core/electron-api.service";
import { createFirestoreDocumentId } from "../../core/firestore-document-id";
import { ProjectContextService } from "../../core/project-context.service";
import { FirestoreFieldsTableComponent } from "./firestore-fields-table.component";
import { FirestoreNavService } from "./firestore-nav.service";
import { documentIdFromPath } from "./firestore-path.utils";
import { extractFieldColumns } from "./firestore-value.utils";

type DocumentViewMode = "fields" | "list";

const SKELETON_DOC_ROWS = 80;
@Component({
  selector: "fk-firestore-collection",
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    HlmButtonImports,
    HlmCardImports,
    HlmInputImports,
    HlmLabelImports,
    HlmNativeSelectImports,
    HlmTableImports,
    HlmBadgeImports,
    HlmAlertImports,
    HlmSeparatorImports,
    HlmSpinnerImports,
    HlmSkeletonImports,
    FirestoreFieldsTableComponent,
  ],
  template: `
    <section
      class="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden p-6"
    >
      @if (!activeId()) {
        <div
          class="flex flex-1 flex-col items-center justify-center px-6 text-center"
          role="status"
        >
          <div
            class="bg-muted/50 text-muted-foreground mb-4 flex size-12 items-center justify-center rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M3 5v14a9 3 0 0 0 18 0V5" />
              <path d="M3 12a9 3 0 0 0 18 0" />
            </svg>
          </div>
          <h3 class="text-base font-semibold">No project selected</h3>
          <p class="text-muted-foreground mt-2 max-w-sm text-sm">
            Connect a Firebase project to explore Firestore collections and
            documents.
          </p>
          <a hlmBtn class="mt-5" size="sm" routerLink="/settings"
            >Open settings</a
          >
        </div>
      } @else if (!nav.collectionPath()) {
        <div
          class="flex flex-1 flex-col items-center justify-center px-6 text-center"
          role="status"
        >
          <div
            class="bg-muted/50 text-muted-foreground mb-4 flex size-12 items-center justify-center rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h10" />
            </svg>
          </div>
          <h3 class="text-base font-semibold">Select a collection</h3>
          <p class="text-muted-foreground mt-2 max-w-sm text-sm">
            Choose a collection from the sidebar to query documents, apply
            filters, and search the local index.
          </p>
        </div>
      } @else {
        <div class="flex min-h-0 flex-1 overflow-hidden">
          <div
            class="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden"
          >
            <header
              class="flex shrink-0 flex-wrap items-start justify-between gap-4"
            >
              <div class="min-w-0">
                <p class="text-muted-foreground text-sm">
                  @if (viewMode() === "fields") {
                    Field columns from documents on this page · open a document
                    to edit or browse subcollections
                  } @else {
                    Document list · click a row to open the document page
                  }
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <div
                  class="border-border bg-muted/20 flex rounded-lg border p-0.5"
                  role="group"
                  aria-label="Document view mode"
                >
                  <button
                    hlmBtn
                    [variant]="viewMode() === 'fields' ? 'default' : 'ghost'"
                    size="sm"
                    class="h-8 rounded-md px-3"
                    type="button"
                    (click)="setViewMode('fields')"
                  >
                    Fields
                  </button>
                  <button
                    hlmBtn
                    [variant]="viewMode() === 'list' ? 'default' : 'ghost'"
                    size="sm"
                    class="h-8 rounded-md px-3"
                    type="button"
                    (click)="setViewMode('list')"
                  >
                    List
                  </button>
                </div>
                <button hlmBtn size="sm" type="button" (click)="createDoc()">
                  New document
                </button>
              </div>
            </header>

            <div
              class="border-border bg-muted/15 shrink-0 space-y-3 rounded-lg border p-3"
            >
              <div class="flex flex-wrap items-end gap-3">
                <div class="space-y-1">
                  <label hlmLabel class="text-xs">Page size</label>
                  <hlm-native-select
                    class="h-9 w-24"
                    [(ngModel)]="pageSize"
                    (ngModelChange)="resetPaginationAndReload()"
                  >
                    <option [ngValue]="25">25</option>
                    <option [ngValue]="50">50</option>
                    <option [ngValue]="100">100</option>
                  </hlm-native-select>
                </div>
                <div class="space-y-1">
                  <label hlmLabel class="text-xs">Order field</label>
                  <input
                    hlmInput
                    class="h-9 w-36 font-mono text-xs"
                    [(ngModel)]="orderField"
                    placeholder="__name__"
                  />
                </div>
                <div class="space-y-1">
                  <label hlmLabel class="text-xs">Direction</label>
                  <hlm-native-select class="h-9 w-24" [(ngModel)]="orderDir">
                    <option value="asc">asc</option>
                    <option value="desc">desc</option>
                  </hlm-native-select>
                </div>
                <button
                  hlmBtn
                  variant="secondary"
                  size="sm"
                  type="button"
                  (click)="resetPaginationAndReload()"
                >
                  Run query
                </button>
              </div>

              <div hlmSeparator></div>

              <div class="space-y-2">
                <p class="text-muted-foreground text-xs font-medium uppercase">
                  Filters
                </p>
                <div class="flex flex-wrap items-end gap-2">
                  <input
                    hlmInput
                    class="h-9 w-28 font-mono text-xs"
                    [(ngModel)]="filterField"
                    placeholder="field"
                  />
                  <hlm-native-select class="h-9 w-36" [(ngModel)]="filterOp">
                    @for (op of filterOps; track op) {
                      <option [value]="op">{{ op }}</option>
                    }
                  </hlm-native-select>
                  <input
                    hlmInput
                    class="h-9 min-w-32 flex-1 font-mono text-xs"
                    [(ngModel)]="filterValue"
                    placeholder="value"
                  />
                  <button
                    hlmBtn
                    variant="outline"
                    size="sm"
                    type="button"
                    (click)="applyFilter()"
                  >
                    Add
                  </button>
                  @if (filters().length) {
                    <button
                      hlmBtn
                      variant="ghost"
                      size="sm"
                      type="button"
                      (click)="clearFilters()"
                    >
                      Clear all
                    </button>
                  }
                </div>
                @if (filters().length) {
                  <div class="flex flex-wrap gap-1.5">
                    @for (f of filters(); track f.field + f.op + $index) {
                      <span
                        hlmBadge
                        variant="secondary"
                        class="font-mono text-xs"
                        >{{ f.field }} {{ f.op }}
                        {{ formatFilterValue(f.value) }}</span
                      >
                    }
                  </div>
                }
              </div>

              <div hlmSeparator></div>

              <div class="space-y-2">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p
                    class="text-muted-foreground text-xs font-medium uppercase"
                  >
                    Index search
                  </p>
                  @if (indexStatus(); as status) {
                    <span class="text-muted-foreground text-xs tabular-nums">
                      {{ status.indexedCount }} indexed
                      @if (status.syncing) {
                        <span hlmBadge variant="outline" class="ml-1"
                          >Syncing</span
                        >
                        <hlm-spinner class="ml-1 inline size-3" />
                      }
                    </span>
                  }
                </div>
                <div class="flex flex-wrap gap-2">
                  <div class="fk-search-input-wrap relative min-w-0 flex-1">
                    <input
                      hlmInput
                      class="h-9 w-full pr-9 font-mono text-xs"
                      [(ngModel)]="searchQuery"
                      placeholder="Search indexed documents…"
                      (ngModelChange)="onSearchQueryChange($event)"
                      (keydown.enter)="runSearch()"
                    />
                    @if (searchQuery) {
                      <button
                        type="button"
                        class="fk-search-input-clear"
                        aria-label="Clear search"
                        (click)="clearIndexSearch()"
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                    }
                  </div>
                  <button
                    hlmBtn
                    variant="outline"
                    size="sm"
                    type="button"
                    (click)="runSearch()"
                    [disabled]="!searchQuery.trim() || loadingDocs()"
                  >
                    Search
                  </button>
                  <button
                    hlmBtn
                    variant="outline"
                    size="sm"
                    type="button"
                    (click)="syncIndex()"
                  >
                    Sync index
                  </button>
                </div>
                @if (indexSearchActive()) {
                  <p class="text-muted-foreground text-xs">
                    Index search for “{{ searchQuery.trim() }}” —
                    <span class="tabular-nums">{{ searchTotal() }}</span>
                    matches. Use pagination below or
                    <span class="text-foreground">×</span> to return to live
                    Firestore data.
                  </p>
                }
              </div>
            </div>

            @if (error()) {
              <div hlmAlert variant="destructive" class="shrink-0">
                <p hlmAlertDescription>{{ error() }}</p>
              </div>
            }

            <section
              hlmCard
              class="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0"
            >
              @if (initialLoadingDocs()) {
                <div
                  class="fk-auth-table-panel min-h-0 flex-1"
                  aria-busy="true"
                >
                  <div class="fk-auth-table-header">
                    <table hlmTable class="fk-auth-table">
                      <colgroup>
                        <col style="width: 28%" />
                        <col style="width: 62%" />
                        <col style="width: 10%" />
                      </colgroup>
                      <thead hlmTHead>
                        <tr hlmTr>
                          <th hlmTh class="fk-auth-th fk-auth-cell">
                            Document ID
                          </th>
                          <th hlmTh class="fk-auth-th fk-auth-cell">Preview</th>
                          <th
                            hlmTh
                            class="fk-auth-th fk-auth-cell text-right"
                          ></th>
                        </tr>
                      </thead>
                    </table>
                  </div>
                  <div class="fk-auth-table-scroll">
                    <table hlmTable class="fk-auth-table">
                      <colgroup>
                        <col style="width: 28%" />
                        <col style="width: 62%" />
                        <col style="width: 10%" />
                      </colgroup>
                      <tbody hlmTBody>
                        @for (row of skeletonDocRows; track row) {
                          <tr hlmTr class="fk-auth-skeleton-row">
                            <td hlmTd class="fk-auth-cell">
                              <div hlmSkeleton class="h-3 w-24"></div>
                            </td>
                            <td hlmTd class="fk-auth-cell">
                              <div
                                hlmSkeleton
                                class="h-3 w-full max-w-md"
                              ></div>
                            </td>
                            <td hlmTd class="fk-auth-cell text-right">
                              <div hlmSkeleton class="ml-auto h-4 w-12"></div>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              } @else if (isEmptyDocs()) {
                <div
                  class="flex min-h-48 flex-1 flex-col items-center justify-center px-6 py-14 text-center"
                  role="status"
                >
                  <div
                    class="bg-muted/50 text-muted-foreground mb-4 flex size-12 items-center justify-center rounded-full"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      aria-hidden="true"
                    >
                      <path
                        d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"
                      />
                      <path d="M14 2v6h6" />
                    </svg>
                  </div>
                  <h3 class="text-base font-semibold">No documents</h3>
                  <p class="text-muted-foreground mt-2 max-w-md text-sm">
                    @if (indexSearchActive()) {
                      No indexed documents match “{{ searchQuery.trim() }}”.
                      Sync the index or try another term.
                    } @else if (filters().length) {
                      No documents match the current filters. Try adjusting
                      filters or clearing them.
                    } @else {
                      This collection has no documents on this page, or the
                      collection is empty.
                    }
                  </p>
                  <div class="mt-5 flex flex-wrap justify-center gap-2">
                    @if (indexSearchActive()) {
                      <button
                        hlmBtn
                        variant="outline"
                        size="sm"
                        type="button"
                        (click)="clearIndexSearch()"
                      >
                        Clear search
                      </button>
                    } @else if (filters().length) {
                      <button
                        hlmBtn
                        variant="outline"
                        size="sm"
                        type="button"
                        (click)="clearFilters()"
                      >
                        Clear filters
                      </button>
                    }
                    <button
                      hlmBtn
                      size="sm"
                      type="button"
                      (click)="createDoc()"
                    >
                      New document
                    </button>
                  </div>
                </div>
              } @else if (viewMode() === "fields") {
                <fk-firestore-fields-table
                  class="flex min-h-0 flex-1 flex-col"
                  [documents]="documents()"
                  [fields]="fieldColumns()"
                  [collectionPath]="nav.collectionPath()"
                  [initialLoading]="initialLoadingDocs()"
                  [refreshing]="refreshingDocs()"
                  [highlightedDocId]="highlightedDocId()"
                  (openDocument)="openDocument($event)"
                />
              } @else {
                <div
                  class="fk-auth-table-panel relative min-h-0 flex-1"
                  [attr.aria-busy]="refreshingDocs()"
                >
                  @if (refreshingDocs()) {
                    <div class="fk-auth-table-loading" aria-live="polite">
                      <div
                        class="bg-card border-border flex items-center gap-2 rounded-lg border px-3 py-2 shadow-sm"
                      >
                        <hlm-spinner class="size-4" />
                        <span class="text-sm">Loading documents…</span>
                      </div>
                    </div>
                  }
                  <div class="fk-auth-table-header">
                    <table hlmTable class="fk-auth-table">
                      <colgroup>
                        <col style="width: 32%" />
                        <col style="width: 68%" />
                      </colgroup>
                      <thead hlmTHead>
                        <tr hlmTr>
                          <th hlmTh class="fk-auth-th fk-auth-cell">
                            Document ID
                          </th>
                          <th hlmTh class="fk-auth-th fk-auth-cell">Preview</th>
                        </tr>
                      </thead>
                    </table>
                  </div>
                  <div
                    class="fk-auth-table-scroll"
                    [class.opacity-50]="refreshingDocs()"
                  >
                    <table hlmTable class="fk-auth-table">
                      <colgroup>
                        <col style="width: 32%" />
                        <col style="width: 68%" />
                      </colgroup>
                      <tbody hlmTBody>
                        @for (doc of documents(); track doc.id) {
                          <tr
                            hlmTr
                            class="fk-fs-data-row cursor-pointer"
                            [class.fk-auth-row-selected]="
                              highlightedDocId() === doc.id
                            "
                            (click)="openDocument(doc.path)"
                          >
                            <td
                              hlmTd
                              class="fk-auth-cell font-mono text-xs font-medium"
                            >
                              {{ doc.id }}
                            </td>
                            <td
                              hlmTd
                              class="fk-auth-cell text-muted-foreground truncate text-xs"
                              [title]="preview(doc)"
                            >
                              {{ preview(doc) }}
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              }

              <div
                hlmCardFooter
                class="bg-muted/20 border-border shrink-0 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3"
              >
                <div
                  class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
                >
                  @if (initialLoadingDocs()) {
                    <div hlmSkeleton class="h-3.5 w-28"></div>
                    <div hlmSkeleton class="h-3.5 w-32"></div>
                  } @else if (isEmptyDocs()) {
                    <span class="text-foreground font-medium">0 documents</span>
                    @if (!indexSearchActive()) {
                      <span
                        >Page {{ currentPage() }} · {{ pageSize }} per
                        page</span
                      >
                    }
                  } @else if (indexSearchActive()) {
                    <span class="text-foreground font-medium tabular-nums"
                      >{{ documents().length }} on page</span
                    >
                    <span class="tabular-nums"
                      >Page {{ currentPage() }} of {{ searchPageCount() }} ·
                      {{ searchTotal() }} matches</span
                    >
                    @if (viewMode() === "fields" && fieldColumns().length) {
                      <span class="tabular-nums"
                        >{{ fieldColumns().length }} fields</span
                      >
                    }
                    @if (hasMore()) {
                      <span class="hidden sm:inline">More on next page</span>
                    } @else if (currentPage() > 1) {
                      <span class="hidden sm:inline">Last page</span>
                    }
                  } @else {
                    <span class="text-foreground font-medium tabular-nums"
                      >{{ documents().length }} documents</span
                    >
                    @if (viewMode() === "fields" && fieldColumns().length) {
                      <span class="tabular-nums"
                        >{{ fieldColumns().length }} fields</span
                      >
                    }
                    <span class="tabular-nums"
                      >Page {{ currentPage() }} · {{ pageSize }} per page</span
                    >
                    @if (hasMore()) {
                      <span class="hidden sm:inline">More on next page</span>
                    } @else if (currentPage() > 1) {
                      <span class="hidden sm:inline">Last page</span>
                    }
                  }
                  @if (refreshingDocs()) {
                    <hlm-spinner class="size-3.5" />
                  }
                </div>

                @if (!initialLoadingDocs()) {
                  <nav
                    class="flex items-center gap-1"
                    [attr.aria-label]="
                      indexSearchActive()
                        ? 'Search results pagination'
                        : 'Document list pagination'
                    "
                  >
                    <button
                      hlmBtn
                      variant="outline"
                      size="sm"
                      type="button"
                      (click)="prevPage()"
                      [disabled]="currentPage() <= 1 || loadingDocs()"
                    >
                      Previous
                    </button>
                    @for (page of pageNumbers(); track page) {
                      <button
                        hlmBtn
                        [variant]="
                          page === currentPage() ? 'default' : 'outline'
                        "
                        size="sm"
                        class="min-w-9"
                        type="button"
                        (click)="goToPage(page - 1)"
                        [disabled]="loadingDocs()"
                      >
                        {{ page }}
                      </button>
                    }
                    @if (hasMore()) {
                      <span
                        class="text-muted-foreground px-1 text-xs"
                        aria-hidden="true"
                        >…</span
                      >
                    }
                    <button
                      hlmBtn
                      variant="outline"
                      size="sm"
                      type="button"
                      (click)="nextPage()"
                      [disabled]="!hasMore() || loadingDocs()"
                    >
                      Next
                    </button>
                  </nav>
                }
              </div>
            </section>
          </div>
        </div>
      }
    </section>
  `,
})
export class FirestoreCollectionComponent implements OnInit, OnDestroy {
  protected readonly skeletonDocRows = Array.from(
    { length: SKELETON_DOC_ROWS },
    (_, i) => i,
  );

  readonly nav = inject(FirestoreNavService);
  private readonly electron = inject(ElectronApiService);
  readonly ctx = inject(ProjectContextService);
  readonly documents = signal<FirestoreDocumentDto[]>([]);
  readonly filters = signal<FirestoreFilter[]>([]);
  readonly loadingDocs = signal(false);
  readonly hasMore = signal(false);
  readonly pageIndex = signal(0);
  readonly pageCursors = signal<(string | null)[]>([null]);
  readonly error = signal<string | null>(null);
  readonly indexSearchActive = signal(false);
  readonly searchTotal = signal(0);
  readonly indexStatus = signal<{
    indexedCount: number;
    syncing: boolean;
  } | null>(null);
  readonly viewMode = signal<DocumentViewMode>("fields");

  readonly highlightedDocId = computed(() => {
    const path = this.nav.documentPath();
    if (!path) return null;
    return documentIdFromPath(path);
  });

  collectionFilter = "";
  pageSize = 50;
  orderField = "";
  orderDir: "asc" | "desc" = "asc";
  filterField = "";
  filterOp: FirestoreWhereOp = "==";
  filterValue = "";
  searchQuery = "";

  readonly filterOps: FirestoreWhereOp[] = [
    "==",
    "!=",
    "<",
    "<=",
    ">",
    ">=",
    "array-contains",
    "in",
  ];

  readonly currentPage = computed(() => this.pageIndex() + 1);
  readonly searchPageCount = computed(() => {
    if (!this.indexSearchActive()) return 1;
    return Math.max(1, Math.ceil(this.searchTotal() / this.pageSize));
  });
  readonly pageNumbers = computed(() => {
    const count = this.indexSearchActive()
      ? this.searchPageCount()
      : this.pageCursors().length;
    return Array.from({ length: count }, (_, i) => i + 1);
  });
  readonly initialLoadingDocs = computed(
    () => this.loadingDocs() && this.documents().length === 0,
  );
  readonly refreshingDocs = computed(
    () => this.loadingDocs() && this.documents().length > 0,
  );
  readonly isEmptyDocs = computed(
    () =>
      !this.loadingDocs() &&
      this.documents().length === 0 &&
      !!this.nav.collectionPath(),
  );
  readonly fieldColumns = computed(() => extractFieldColumns(this.documents()));

  private progressUnsub: (() => void) | null = null;
  private lastSyncedCollectionPath = "";

  activeId = () => this.ctx.activeProjectId();

  constructor() {
    effect(() => {
      const path = this.nav.collectionPath();
      if (path === this.lastSyncedCollectionPath) return;
      this.lastSyncedCollectionPath = path;
      this.exitIndexSearchMode();
      this.resetPagination();
      if (path) {
        void this.reload();
        void this.refreshIndexStatus();
      } else {
        this.documents.set([]);
        this.indexStatus.set(null);
      }
    });
  }

  ngOnInit(): void {
    this.progressUnsub = this.electron.api.index.onProgress(() => {
      void this.refreshIndexStatus();
    });
  }

  ngOnDestroy(): void {
    this.progressUnsub?.();
  }

  formatFilterValue(value: unknown): string {
    if (Array.isArray(value)) return value.join(", ");
    return String(value);
  }

  setViewMode(mode: DocumentViewMode): void {
    this.viewMode.set(mode);
  }

  openDocument(path: string, isNew = false): void {
    this.nav.navigateToDocument(path, isNew);
  }

  onDocumentSaved(): void {
    if (this.indexSearchActive()) {
      void this.runSearch();
    } else {
      void this.reload();
    }
  }

  resetPagination(): void {
    this.pageIndex.set(0);
    this.pageCursors.set([null]);
  }

  resetPaginationAndReload(): void {
    if (this.indexSearchActive()) {
      this.exitIndexSearchMode();
    }
    this.resetPagination();
    void this.reload();
  }

  applyFilter(): void {
    if (!this.filterField) return;
    let value: unknown = this.filterValue;
    if (this.filterOp === "in" || this.filterOp === "array-contains-any") {
      value = this.filterValue.split(",").map((s) => s.trim());
    } else if (
      !Number.isNaN(Number(this.filterValue)) &&
      this.filterValue !== ""
    ) {
      value = Number(this.filterValue);
    }
    this.filters.update((f) => [
      ...f,
      { field: this.filterField, op: this.filterOp, value },
    ]);
    this.resetPaginationAndReload();
  }

  clearFilters(): void {
    this.filters.set([]);
    this.resetPaginationAndReload();
  }

  async reload(): Promise<void> {
    if (this.indexSearchActive()) {
      await this.reloadIndexSearch();
      return;
    }

    const projectId = this.activeId();
    const path = this.nav.collectionPath();
    if (!projectId || !path) return;

    const idx = this.pageIndex();
    const startAfterId = this.pageCursors()[idx] ?? undefined;

    this.loadingDocs.set(true);
    this.error.set(null);
    try {
      const result = await this.electron.api.firestore.query({
        projectId,
        collectionPath: path,
        limit: this.pageSize,
        orderBy: this.orderField
          ? { field: this.orderField, direction: this.orderDir }
          : undefined,
        filters: this.filters().length ? this.filters() : undefined,
        startAfterId,
      });
      this.documents.set(result.documents);
      this.hasMore.set(result.hasMore);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.loadingDocs.set(false);
    }
  }

  nextPage(): void {
    if (this.indexSearchActive()) {
      if (!this.hasMore()) return;
      this.pageIndex.update((i) => i + 1);
      void this.reload();
      return;
    }

    if (!this.hasMore()) return;
    const docs = this.documents();
    if (!docs.length) return;

    const lastId = docs[docs.length - 1].id;
    const nextIndex = this.pageIndex() + 1;
    this.pageCursors.update((tokens) => {
      const next = tokens.slice(0, nextIndex);
      next[nextIndex] = lastId;
      return next;
    });
    this.pageIndex.set(nextIndex);
    void this.reload();
  }

  prevPage(): void {
    const index = this.pageIndex();
    if (index <= 0) return;
    this.pageIndex.set(index - 1);
    void this.reload();
  }

  goToPage(index: number): void {
    if (index === this.pageIndex()) return;
    if (this.indexSearchActive()) {
      const max = this.searchPageCount() - 1;
      if (index < 0 || index > max) return;
      this.pageIndex.set(index);
      void this.reload();
      return;
    }
    const tokens = this.pageCursors();
    if (index < 0 || index >= tokens.length) return;
    this.pageIndex.set(index);
    void this.reload();
  }

  preview(doc: FirestoreDocumentDto): string {
    return JSON.stringify(doc.data).slice(0, 120);
  }

  createDoc(): void {
    const path = this.nav.collectionPath();
    if (!path) return;
    const id = createFirestoreDocumentId();
    this.openDocument(`${path}/${id}`, true);
  }

  onSearchQueryChange(value: string): void {
    if (!value.trim() && this.indexSearchActive()) {
      void this.clearIndexSearch();
    }
  }

  hitsToDocuments(hits: IndexSearchHit[]): FirestoreDocumentDto[] {
    return hits.map((h) => ({
      id: h.docId,
      path: h.path,
      data: h.data,
    }));
  }

  exitIndexSearchMode(): void {
    this.indexSearchActive.set(false);
    this.searchTotal.set(0);
    this.searchQuery = "";
    this.resetPagination();
  }

  async clearIndexSearch(): Promise<void> {
    if (!this.indexSearchActive() && !this.searchQuery.trim()) return;
    this.exitIndexSearchMode();
    await this.reload();
  }

  async reloadIndexSearch(): Promise<void> {
    const projectId = this.activeId();
    const path = this.nav.collectionPath();
    const query = this.searchQuery.trim();
    if (!projectId || !path || !query) return;

    this.loadingDocs.set(true);
    this.error.set(null);
    try {
      const offset = this.pageIndex() * this.pageSize;
      const result = await this.electron.api.index.search({
        projectId,
        collectionPath: path,
        query,
        limit: this.pageSize,
        offset,
      });
      this.documents.set(this.hitsToDocuments(result.hits));
      this.searchTotal.set(result.total);
      this.hasMore.set(offset + result.hits.length < result.total);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.loadingDocs.set(false);
    }
  }

  async runSearch(): Promise<void> {
    const projectId = this.activeId();
    const path = this.nav.collectionPath();
    const query = this.searchQuery.trim();
    if (!projectId || !path) return;
    if (!query) {
      await this.clearIndexSearch();
      return;
    }

    this.indexSearchActive.set(true);
    this.pageIndex.set(0);
    this.pageCursors.set([null]);
    await this.reloadIndexSearch();
  }

  async syncIndex(): Promise<void> {
    const projectId = this.activeId();
    const path = this.nav.collectionPath();
    if (!projectId || !path) return;
    try {
      await this.electron.api.index.syncStart({
        projectId,
        collectionPath: path,
        full: true,
      });
      void this.refreshIndexStatus();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    }
  }

  async refreshIndexStatus(): Promise<void> {
    const projectId = this.activeId();
    const path = this.nav.collectionPath();
    if (!projectId || !path) return;
    try {
      const status = await this.electron.api.index.syncStatus({
        projectId,
        collectionPath: path,
      });
      this.indexStatus.set({
        indexedCount: status.indexedCount,
        syncing: status.syncing,
      });
    } catch {
      /* ignore status errors while switching collections */
    }
  }
}

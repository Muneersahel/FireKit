import {
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink, RouterOutlet } from "@angular/router";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmInputImports } from "@spartan-ng/helm/input";
import { HlmSkeletonImports } from "@spartan-ng/helm/skeleton";
import { HlmSpinnerImports } from "@spartan-ng/helm/spinner";
import { ElectronApiService } from "../../core/electron-api.service";
import { ProjectContextService } from "../../core/project-context.service";
import { FirestoreBreadcrumbComponent } from "./firestore-breadcrumb.component";
import {
  FirestoreCollectionsCacheService,
  collectionListsEqual,
} from "./firestore-collections-cache.service";
import { FirestoreNavService } from "./firestore-nav.service";
import {
  isRootCollectionPath,
  parentCollectionPath,
  rootCollectionId,
} from "./firestore-path.utils";

const SKELETON_COLLECTION_ROWS = 60;

@Component({
  selector: "fk-firestore-shell",
  standalone: true,
  host: {
    class: "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
  },
  imports: [
    FormsModule,
    RouterLink,
    RouterOutlet,
    HlmButtonImports,
    HlmInputImports,
    HlmSpinnerImports,
    HlmSkeletonImports,
    FirestoreBreadcrumbComponent,
  ],
  template: `
    <div class="flex min-h-0 flex-1 overflow-hidden">
      <aside
        class="border-border bg-muted/10 flex w-60 shrink-0 flex-col border-r"
      >
        <div class="border-border shrink-0 border-b">
          <div class="flex h-10 items-center justify-between gap-2 px-3">
            <p
              class="text-muted-foreground text-[11px] font-semibold tracking-widest uppercase"
            >
              Collections
            </p>
            @if (refreshingCollections()) {
              <hlm-spinner
                class="size-3 shrink-0"
                aria-label="Updating collections"
              />
            }
          </div>
          @if (activeId()) {
            <div class="px-3 pb-2.5">
              <input
                hlmInput
                class="h-8 font-mono text-xs"
                placeholder="Filter…"
                [(ngModel)]="collectionFilter"
              />
            </div>
          }
        </div>

        @if (
          activeId() &&
          nav.collectionPath() &&
          !isRootCollectionPath(nav.collectionPath())
        ) {
          <div class="border-border border-b px-2 py-2">
            <button
              hlmBtn
              variant="ghost"
              size="sm"
              type="button"
              class="mb-1.5 h-7 w-full justify-start px-2 text-xs"
              (click)="navigateToParentCollection()"
            >
              ↑ Parent collection
            </button>
            <p
              class="text-muted-foreground truncate font-mono text-[10px]"
              [title]="nav.collectionPath()"
            >
              {{ nav.collectionPath() }}
            </p>
          </div>
        }

        <div class="min-h-0 flex-1 overflow-auto p-2">
          @if (!activeId()) {
            <p class="text-muted-foreground px-2 py-4 text-xs leading-relaxed">
              <a
                routerLink="/settings"
                class="text-primary underline-offset-4 hover:underline"
                >Choose a project</a
              >
              in the sidebar to browse collections.
            </p>
          } @else if (initialLoadingCollections()) {
            <ul class="space-y-1.5" aria-busy="true">
              @for (row of skeletonCollectionRows; track row) {
                <li><div hlmSkeleton class="h-8 w-full rounded-md"></div></li>
              }
            </ul>
          } @else if (collections().length === 0) {
            <div class="px-2 py-6 text-center">
              <p class="text-muted-foreground text-xs">No collections found.</p>
              <button
                hlmBtn
                variant="link"
                size="sm"
                class="mt-2 h-auto p-0"
                type="button"
                (click)="loadCollections()"
              >
                Refresh
              </button>
            </div>
          } @else if (filteredCollections().length === 0) {
            <p class="text-muted-foreground px-2 py-4 text-xs">
              No collections match “{{ collectionFilter }}”.
            </p>
          } @else {
            <ul
              class="fk-collection-list space-y-0.5"
              [class.fk-collection-list--refreshing]="refreshingCollections()"
            >
              @for (c of filteredCollections(); track c) {
                <li
                  class="fk-collection-list__item"
                  animate.enter="fk-collection-enter"
                  animate.leave="fk-collection-leave"
                >
                  <button
                    hlmBtn
                    variant="ghost"
                    size="sm"
                    class="h-8 w-full justify-start font-mono text-xs"
                    [class.bg-primary/15]="
                      rootCollectionId(nav.collectionPath()) === c
                    "
                    [class.text-primary]="
                      rootCollectionId(nav.collectionPath()) === c
                    "
                    type="button"
                    (click)="selectRootCollection(c)"
                  >
                    <span class="truncate">{{ c }}</span>
                  </button>
                </li>
              }
            </ul>
          }
        </div>

        @if (activeId()) {
          <div class="border-border border-t p-2">
            <button
              hlmBtn
              variant="outline"
              size="sm"
              class="w-full"
              type="button"
              [disabled]="loadingCollections()"
              (click)="loadCollections()"
            >
              Refresh collections
            </button>
          </div>
        }
      </aside>

      <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div class="border-border shrink-0 border-b px-6 py-3">
          <fk-firestore-breadcrumb />
        </div>
        <div class="fk-main min-h-0 flex-1 overflow-hidden">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
})
export class FirestoreShellComponent implements OnInit {
  protected readonly skeletonCollectionRows = Array.from(
    { length: SKELETON_COLLECTION_ROWS },
    (_, i) => i,
  );

  readonly nav = inject(FirestoreNavService);
  private readonly electron = inject(ElectronApiService);
  private readonly collectionsCache = inject(FirestoreCollectionsCacheService);
  readonly ctx = inject(ProjectContextService);

  readonly collections = signal<string[]>([]);
  readonly loadingCollections = signal(false);
  readonly collectionsFromCache = signal(false);

  collectionFilter = "";

  readonly filteredCollections = computed(() => {
    const q = this.collectionFilter.trim().toLowerCase();
    const cols = this.collections();
    if (!q) return cols;
    return cols.filter((c) => c.toLowerCase().includes(q));
  });

  readonly initialLoadingCollections = computed(
    () =>
      this.loadingCollections() &&
      this.collections().length === 0 &&
      !this.collectionsFromCache(),
  );

  readonly refreshingCollections = computed(
    () => this.loadingCollections() && this.collectionsFromCache(),
  );

  protected readonly isRootCollectionPath = isRootCollectionPath;
  protected readonly rootCollectionId = rootCollectionId;

  private collectionsFetchId = 0;

  activeId = () => this.ctx.activeProjectId();

  constructor() {
    effect(() => {
      const id = this.ctx.activeProjectId();
      if (!id) {
        this.collectionsFetchId++;
        this.collections.set([]);
        this.collectionsFromCache.set(false);
        this.loadingCollections.set(false);
        return;
      }
      void this.loadCollections();
    });
  }

  ngOnInit(): void {
    void this.loadCollections();
  }

  selectRootCollection(name: string): void {
    this.nav.navigateToCollection(name);
  }

  navigateToParentCollection(): void {
    const parent = parentCollectionPath(this.nav.collectionPath());
    if (parent) this.nav.navigateToCollection(parent);
  }

  async loadCollections(): Promise<void> {
    const id = this.activeId();
    if (!id) return;

    const fetchId = ++this.collectionsFetchId;
    const cached = this.collectionsCache.get(id);
    const fromCache = cached !== null;
    this.collectionsFromCache.set(fromCache);
    if (fromCache) {
      this.collections.set(cached);
    } else {
      this.collections.set([]);
    }

    this.loadingCollections.set(true);

    try {
      const cols = await this.electron.api.firestore.listCollections({
        projectId: id,
      });
      if (fetchId !== this.collectionsFetchId) return;

      if (!collectionListsEqual(this.collections(), cols)) {
        this.collections.set(cols);
      }
      this.collectionsCache.set(id, cols);
      this.collectionsFromCache.set(true);
    } catch {
      /* sidebar list is best-effort */
    } finally {
      if (fetchId === this.collectionsFetchId) {
        this.loadingCollections.set(false);
      }
    }
  }
}

import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import type { AuthUserDto } from "@shared/ipc";
import { HlmAlertImports } from "@spartan-ng/helm/alert";
import { HlmBadgeImports } from "@spartan-ng/helm/badge";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmCardImports } from "@spartan-ng/helm/card";
import { HlmInputImports } from "@spartan-ng/helm/input";
import { HlmLabelImports } from "@spartan-ng/helm/label";
import { HlmSeparatorImports } from "@spartan-ng/helm/separator";
import { HlmSkeletonImports } from "@spartan-ng/helm/skeleton";
import { HlmSpinnerImports } from "@spartan-ng/helm/spinner";
import { HlmTableImports } from "@spartan-ng/helm/table";
import { ElectronApiService } from "../../core/electron-api.service";
import { ProjectContextService } from "../../core/project-context.service";

const PAGE_SIZE = 50;
const SKELETON_ROW_COUNT = 80;

@Component({
  selector: "fk-auth-page",
  standalone: true,
  imports: [
    FormsModule,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    HlmCardImports,
    HlmTableImports,
    HlmBadgeImports,
    HlmAlertImports,
    HlmSeparatorImports,
    HlmSpinnerImports,
    HlmSkeletonImports,
  ],
  template: `
    <div class="flex min-h-0 flex-1 overflow-hidden">
      <section
        class="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden p-6"
      >
        <header
          class="flex shrink-0 flex-wrap items-start justify-between gap-4"
        >
          <div>
            <h2 class="text-lg font-semibold tracking-tight">Users</h2>
            <p class="text-muted-foreground text-sm">
              Firebase Authentication accounts for this project
            </p>
          </div>
          <button hlmBtn size="sm" type="button" (click)="openCreate()">
            Create user
          </button>
        </header>

        <div
          class="border-border bg-muted/15 flex shrink-0 flex-wrap items-center gap-2 rounded-lg border p-2"
        >
          <div class="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md">
            <div class="relative min-w-0 flex-1">
              <input
                hlmInput
                id="searchEmail"
                class="h-9 w-full"
                [class.pr-9]="searchEmail.trim() || searchMode()"
                [(ngModel)]="searchEmail"
                placeholder="Search by email…"
                (keydown.enter)="searchByEmail()"
              />
              @if (searchEmail.trim() || searchMode()) {
                <button
                  hlmBtn
                  variant="ghost"
                  size="icon"
                  class="text-muted-foreground absolute top-1/2 right-0.5 size-7 -translate-y-1/2"
                  type="button"
                  aria-label="Clear search"
                  (click)="clearSearch()"
                >
                  <span class="text-base leading-none" aria-hidden="true"
                    >×</span
                  >
                </button>
              }
            </div>
            <button
              hlmBtn
              variant="secondary"
              size="sm"
              type="button"
              (click)="searchByEmail()"
            >
              Search
            </button>
          </div>
          <button
            hlmBtn
            variant="outline"
            size="sm"
            type="button"
            (click)="refreshList()"
            [disabled]="loading()"
          >
            Refresh
          </button>
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
          @if (initialLoading()) {
            <div class="fk-auth-table-panel min-h-0 flex-1" aria-busy="true">
              <div class="fk-auth-table-header">
                <table hlmTable class="fk-auth-table">
                  <colgroup>
                    <col style="width: 34%" />
                    <col style="width: 44%" />
                    <col style="width: 14%" />
                    <col style="width: 8%" />
                  </colgroup>
                  <thead hlmTHead>
                    <tr hlmTr>
                      <th hlmTh class="fk-auth-th fk-auth-cell">Email</th>
                      <th hlmTh class="fk-auth-th fk-auth-cell">UID</th>
                      <th hlmTh class="fk-auth-th fk-auth-cell">Status</th>
                      <th hlmTh class="fk-auth-th fk-auth-cell text-right"></th>
                    </tr>
                  </thead>
                </table>
              </div>
              <div class="fk-auth-table-scroll">
                <table hlmTable class="fk-auth-table">
                  <colgroup>
                    <col style="width: 34%" />
                    <col style="width: 44%" />
                    <col style="width: 14%" />
                    <col style="width: 8%" />
                  </colgroup>
                  <tbody hlmTBody>
                    @for (row of skeletonRows; track row) {
                      <tr hlmTr class="fk-auth-skeleton-row">
                        <td hlmTd class="fk-auth-cell">
                          <div hlmSkeleton class="h-4 w-[88%]"></div>
                        </td>
                        <td hlmTd class="fk-auth-cell">
                          <div hlmSkeleton class="h-3 w-full max-w-[95%]"></div>
                        </td>
                        <td hlmTd class="fk-auth-cell">
                          <div hlmSkeleton class="h-5 w-14 rounded-full"></div>
                        </td>
                        <td hlmTd class="fk-auth-cell text-right">
                          <div hlmSkeleton class="ml-auto h-4 w-10"></div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          } @else if (isEmpty()) {
            <div
              class="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-14 text-center"
              role="status"
            >
              <div
                class="bg-muted/50 text-muted-foreground mb-5 flex size-14 items-center justify-center rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 class="text-base font-semibold tracking-tight">
                {{ emptyState().title }}
              </h3>
              <p
                class="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed"
              >
                {{ emptyState().description }}
              </p>
              <div
                class="mt-6 flex flex-wrap items-center justify-center gap-2"
              >
                @if (emptyState().showClearSearch) {
                  <button
                    hlmBtn
                    variant="outline"
                    size="sm"
                    type="button"
                    (click)="clearSearch()"
                  >
                    Clear search
                  </button>
                }
                @if (emptyState().showCreate) {
                  <button hlmBtn size="sm" type="button" (click)="openCreate()">
                    Create user
                  </button>
                }
                <button
                  hlmBtn
                  variant="secondary"
                  size="sm"
                  type="button"
                  (click)="refreshList()"
                >
                  Refresh
                </button>
              </div>
            </div>
          } @else {
            <div
              class="fk-auth-table-panel relative min-h-0 flex-1"
              [attr.aria-busy]="refreshing()"
            >
              @if (refreshing()) {
                <div class="fk-auth-table-loading" aria-live="polite">
                  <div
                    class="bg-card border-border flex items-center gap-2 rounded-lg border px-3 py-2 shadow-sm"
                  >
                    <hlm-spinner class="size-4" />
                    <span class="text-sm">Updating users…</span>
                  </div>
                </div>
              }
              <div class="fk-auth-table-header">
                <table hlmTable class="fk-auth-table">
                  <colgroup>
                    <col style="width: 34%" />
                    <col style="width: 44%" />
                    <col style="width: 14%" />
                    <col style="width: 8%" />
                  </colgroup>
                  <thead hlmTHead>
                    <tr hlmTr>
                      <th hlmTh class="fk-auth-th fk-auth-cell">Email</th>
                      <th hlmTh class="fk-auth-th fk-auth-cell">UID</th>
                      <th hlmTh class="fk-auth-th fk-auth-cell">Status</th>
                      <th hlmTh class="fk-auth-th fk-auth-cell text-right"></th>
                    </tr>
                  </thead>
                </table>
              </div>
              <div
                class="fk-auth-table-scroll"
                [class.opacity-50]="refreshing()"
              >
                <table hlmTable class="fk-auth-table">
                  <colgroup>
                    <col style="width: 34%" />
                    <col style="width: 44%" />
                    <col style="width: 14%" />
                    <col style="width: 8%" />
                  </colgroup>
                  <tbody hlmTBody>
                    @for (u of users(); track u.uid) {
                      <tr
                        hlmTr
                        class="cursor-pointer"
                        [class.fk-auth-row-selected]="selected()?.uid === u.uid"
                        (click)="selectUser(u)"
                      >
                        <td hlmTd class="fk-auth-cell truncate font-medium">
                          {{ u.email ?? "—" }}
                        </td>
                        <td
                          hlmTd
                          class="fk-auth-cell text-muted-foreground truncate font-mono text-xs"
                          [title]="u.uid"
                        >
                          {{ u.uid }}
                        </td>
                        <td hlmTd class="fk-auth-cell">
                          @if (u.disabled) {
                            <span hlmBadge variant="destructive">Disabled</span>
                          } @else {
                            <span hlmBadge variant="outline">Active</span>
                          }
                        </td>
                        <td hlmTd class="fk-auth-cell text-right">
                          <button
                            hlmBtn
                            variant="link"
                            size="sm"
                            class="text-muted-foreground hover:text-foreground h-auto px-0"
                            type="button"
                            (click)="selectUser(u); $event.stopPropagation()"
                          >
                            View
                          </button>
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
            class="bg-muted/20 border-border shrink-0 flex flex-wrap items-center justify-between gap-3 border-t px-4 pt-0 pb-5"
          >
            <div
              class="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
            >
              @if (initialLoading()) {
                <div hlmSkeleton class="h-3.5 w-24"></div>
                <div hlmSkeleton class="h-3.5 w-36"></div>
              } @else if (isEmpty()) {
                <span class="text-foreground font-medium">0 users</span>
                @if (!searchMode()) {
                  <span
                    >Page {{ currentPage() }} · {{ PAGE_SIZE }} per page</span
                  >
                }
              } @else if (searchMode()) {
                <span class="text-foreground font-medium">Search result</span>
                <span
                  >{{ users().length }} user{{
                    users().length === 1 ? "" : "s"
                  }}</span
                >
              } @else {
                <span class="text-foreground font-medium tabular-nums"
                  >{{ users().length }} users</span
                >
                <span class="tabular-nums"
                  >Page {{ currentPage() }} · {{ PAGE_SIZE }} per page</span
                >
                @if (nextPageToken()) {
                  <span class="hidden sm:inline">More on next page</span>
                } @else if (currentPage() > 1) {
                  <span class="hidden sm:inline">Last page</span>
                }
              }
              @if (refreshing()) {
                <hlm-spinner class="size-3.5" />
              }
            </div>

            @if (!searchMode() && !initialLoading()) {
              <nav
                class="flex items-center gap-1"
                aria-label="User list pagination"
              >
                <button
                  hlmBtn
                  variant="outline"
                  size="sm"
                  type="button"
                  (click)="prevPage()"
                  [disabled]="currentPage() <= 1 || loading()"
                >
                  Previous
                </button>
                @for (page of pageNumbers(); track page) {
                  <button
                    hlmBtn
                    [variant]="page === currentPage() ? 'default' : 'outline'"
                    size="sm"
                    class="min-w-9"
                    type="button"
                    (click)="goToPage(page - 1)"
                    [disabled]="loading()"
                  >
                    {{ page }}
                  </button>
                }
                @if (nextPageToken()) {
                  <span
                    class="text-muted-foreground px-1 text-xs tabular-nums"
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
                  [disabled]="!nextPageToken() || loading()"
                >
                  Next
                </button>
              </nav>
            }
          </div>
        </section>
      </section>

      @if (selected()) {
        <aside
          class="border-border bg-card flex w-96 shrink-0 flex-col border-l"
        >
          <div class="flex items-start justify-between gap-2 p-4 pb-0">
            <div class="min-w-0 flex-1">
              <p class="text-muted-foreground text-xs font-medium uppercase">
                User details
              </p>
              <h3 class="truncate text-sm font-semibold">
                {{ selected()!.email ?? selected()!.uid }}
              </h3>
            </div>
            <button
              hlmBtn
              variant="ghost"
              size="icon"
              type="button"
              aria-label="Close panel"
              (click)="closeDetail()"
            >
              ✕
            </button>
          </div>

          <div class="flex-1 space-y-4 overflow-auto p-4">
            <dl class="grid gap-3 text-sm">
              <div class="grid gap-1">
                <dt class="text-muted-foreground text-xs">UID</dt>
                <dd class="font-mono text-xs leading-relaxed break-all">
                  {{ selected()!.uid }}
                </dd>
              </div>
              <div class="grid gap-1">
                <dt class="text-muted-foreground text-xs">Display name</dt>
                <dd>{{ selected()!.displayName ?? "—" }}</dd>
              </div>
              <div class="grid gap-1">
                <dt class="text-muted-foreground text-xs">Email verified</dt>
                <dd>
                  @if (selected()!.emailVerified) {
                    <span hlmBadge variant="secondary">Verified</span>
                  } @else {
                    <span hlmBadge variant="outline">Unverified</span>
                  }
                </dd>
              </div>
              <div class="grid gap-1">
                <dt class="text-muted-foreground text-xs">Providers</dt>
                <dd class="flex flex-wrap gap-1">
                  @for (p of selected()!.providerIds; track p) {
                    <span hlmBadge variant="outline">{{ p }}</span>
                  } @empty {
                    —
                  }
                </dd>
              </div>
              <div class="grid gap-1">
                <dt class="text-muted-foreground text-xs">Custom claims</dt>
                <dd
                  class="bg-muted/50 rounded-md p-2 font-mono text-xs whitespace-pre-wrap"
                >
                  {{ claimsJson() }}
                </dd>
              </div>
            </dl>

            @if (confirmDelete()) {
              <section hlmCard size="sm">
                <div hlmCardHeader class="pb-2">
                  <h4 hlmCardTitle class="text-sm">Delete user</h4>
                  <p hlmCardDescription class="text-xs">
                    Type <span class="font-mono">DELETE</span> to confirm. This
                    cannot be undone.
                  </p>
                </div>
                <div hlmCardContent class="space-y-2 pt-0">
                  <input hlmInput [(ngModel)]="deleteConfirm" />
                  <div class="flex gap-2">
                    <button
                      hlmBtn
                      variant="destructive"
                      class="flex-1"
                      size="sm"
                      type="button"
                      (click)="deleteUser()"
                    >
                      Confirm delete
                    </button>
                    <button
                      hlmBtn
                      variant="outline"
                      size="sm"
                      type="button"
                      (click)="confirmDelete.set(false)"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </section>
            }
          </div>

          <div class="border-border space-y-2 border-t p-4">
            <button
              hlmBtn
              variant="outline"
              class="w-full"
              size="sm"
              type="button"
              (click)="toggleDisabled()"
            >
              {{ selected()!.disabled ? "Enable user" : "Disable user" }}
            </button>
            <button
              hlmBtn
              variant="destructive"
              class="w-full"
              size="sm"
              type="button"
              (click)="confirmDelete.set(true)"
            >
              Delete user
            </button>
          </div>
        </aside>
      }

      @if (showCreate()) {
        <aside
          class="border-border bg-card flex w-80 shrink-0 flex-col border-l"
        >
          <div class="flex items-center justify-between p-4 pb-0">
            <h3 class="text-sm font-semibold">Create user</h3>
            <button
              hlmBtn
              variant="ghost"
              size="icon"
              type="button"
              aria-label="Close"
              (click)="showCreate.set(false)"
            >
              ✕
            </button>
          </div>
          <div class="space-y-4 p-4">
            <div class="space-y-1.5">
              <label hlmLabel for="newEmail">Email</label>
              <input
                hlmInput
                id="newEmail"
                type="email"
                [(ngModel)]="newEmail"
              />
            </div>
            <div class="space-y-1.5">
              <label hlmLabel for="newPassword">Password</label>
              <input
                hlmInput
                id="newPassword"
                type="password"
                [(ngModel)]="newPassword"
              />
            </div>
            <div class="space-y-1.5">
              <label hlmLabel for="newDisplayName">Display name</label>
              <input
                hlmInput
                id="newDisplayName"
                [(ngModel)]="newDisplayName"
                placeholder="Optional"
              />
            </div>
            <button
              hlmBtn
              class="w-full"
              size="sm"
              type="button"
              (click)="createUser()"
            >
              Create
            </button>
            <button
              hlmBtn
              variant="outline"
              class="w-full"
              size="sm"
              type="button"
              (click)="showCreate.set(false)"
            >
              Cancel
            </button>
          </div>
        </aside>
      }
    </div>
  `,
})
export class AuthPageComponent implements OnInit {
  protected readonly PAGE_SIZE = PAGE_SIZE;
  protected readonly skeletonRows = Array.from(
    { length: SKELETON_ROW_COUNT },
    (_, i) => i,
  );

  private readonly electron = inject(ElectronApiService);
  readonly ctx = inject(ProjectContextService);

  readonly users = signal<AuthUserDto[]>([]);
  readonly selected = signal<AuthUserDto | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly nextPageToken = signal<string | null>(null);
  readonly pageIndex = signal(0);
  readonly pageTokens = signal<(string | undefined)[]>([undefined]);
  readonly searchMode = signal(false);
  readonly showCreate = signal(false);
  readonly confirmDelete = signal(false);

  readonly currentPage = computed(() => this.pageIndex() + 1);
  readonly pageNumbers = computed(() =>
    Array.from({ length: this.pageTokens().length }, (_, i) => i + 1),
  );

  readonly initialLoading = computed(
    () => this.loading() && this.users().length === 0,
  );
  readonly refreshing = computed(
    () => this.loading() && this.users().length > 0,
  );
  readonly isEmpty = computed(
    () => !this.loading() && this.users().length === 0,
  );

  readonly emptyState = computed(() => {
    if (this.searchMode()) {
      const email = this.searchEmail.trim();
      return {
        title: "No matching user",
        description: email
          ? `No account found for “${email}”. Check the spelling or try another address.`
          : "Enter an email address to search your project users.",
        showClearSearch: true,
        showCreate: false,
      };
    }
    if (this.currentPage() > 1) {
      return {
        title: "No users on this page",
        description:
          "This page is empty. Go back to a previous page or continue forward if more users exist.",
        showClearSearch: false,
        showCreate: false,
      };
    }
    return {
      title: "No users yet",
      description:
        "There are no Authentication users in this project. Create one to get started.",
      showClearSearch: false,
      showCreate: true,
    };
  });

  searchEmail = "";
  deleteConfirm = "";
  newEmail = "";
  newPassword = "";
  newDisplayName = "";

  ngOnInit(): void {
    void this.loadUsers(0);
  }

  claimsJson(): string {
    const u = this.selected();
    return u ? JSON.stringify(u.customClaims, null, 2) : "";
  }

  openCreate(): void {
    this.showCreate.set(true);
    this.confirmDelete.set(false);
  }

  closeDetail(): void {
    this.selected.set(null);
    this.confirmDelete.set(false);
  }

  refreshList(): void {
    if (this.searchMode()) {
      void this.searchByEmail();
    } else {
      void this.loadUsers(this.pageIndex());
    }
  }

  clearSearch(): void {
    this.searchMode.set(false);
    this.searchEmail = "";
    this.resetPagination();
    void this.loadUsers(0);
  }

  private resetPagination(): void {
    this.pageIndex.set(0);
    this.pageTokens.set([undefined]);
    this.nextPageToken.set(null);
  }

  async loadUsers(pageIndex: number): Promise<void> {
    const projectId = this.ctx.activeProjectId();
    if (!projectId) return;

    const tokens = this.pageTokens();
    const pageToken = tokens[pageIndex];

    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.electron.api.auth.listUsers({
        projectId,
        maxResults: PAGE_SIZE,
        pageToken,
      });
      this.users.set(result.users);
      this.nextPageToken.set(result.pageToken);
      this.pageIndex.set(pageIndex);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.loading.set(false);
    }
  }

  nextPage(): void {
    const token = this.nextPageToken();
    if (!token) return;

    const nextIndex = this.pageIndex() + 1;
    this.pageTokens.update((tokens) => {
      const next = tokens.slice(0, nextIndex);
      next[nextIndex] = token;
      return next;
    });
    void this.loadUsers(nextIndex);
  }

  prevPage(): void {
    const index = this.pageIndex();
    if (index <= 0) return;
    void this.loadUsers(index - 1);
  }

  goToPage(index: number): void {
    if (index === this.pageIndex()) return;
    const tokens = this.pageTokens();
    if (index < 0 || index >= tokens.length) return;
    void this.loadUsers(index);
  }

  selectUser(u: AuthUserDto): void {
    this.selected.set(u);
    this.confirmDelete.set(false);
    this.showCreate.set(false);
  }

  async searchByEmail(): Promise<void> {
    const projectId = this.ctx.activeProjectId();
    if (!projectId || !this.searchEmail.trim()) return;

    this.loading.set(true);
    this.error.set(null);
    try {
      const user = await this.electron.api.auth.getUserByEmail({
        projectId,
        email: this.searchEmail.trim(),
      });
      this.searchMode.set(true);
      if (user) {
        this.users.set([user]);
        this.selected.set(user);
      } else {
        this.users.set([]);
        this.selected.set(null);
        this.error.set("No user found with that email.");
      }
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.loading.set(false);
    }
  }

  async toggleDisabled(): Promise<void> {
    const u = this.selected();
    const projectId = this.ctx.activeProjectId();
    if (!u || !projectId) return;
    await this.electron.api.auth.setDisabled({
      projectId,
      uid: u.uid,
      disabled: !u.disabled,
    });
    if (this.searchMode()) {
      await this.searchByEmail();
    } else {
      await this.loadUsers(this.pageIndex());
    }
    const updated = this.users().find((x) => x.uid === u.uid);
    if (updated) this.selected.set(updated);
  }

  async deleteUser(): Promise<void> {
    if (this.deleteConfirm !== "DELETE") {
      this.error.set("Type DELETE to confirm");
      return;
    }
    const u = this.selected();
    const projectId = this.ctx.activeProjectId();
    if (!u || !projectId) return;
    await this.electron.api.auth.deleteUser({ projectId, uid: u.uid });
    this.selected.set(null);
    this.confirmDelete.set(false);
    this.deleteConfirm = "";
    if (this.searchMode()) {
      this.users.set([]);
    } else {
      void this.loadUsers(this.pageIndex());
    }
  }

  async createUser(): Promise<void> {
    const projectId = this.ctx.activeProjectId();
    if (!projectId) return;
    try {
      const user = await this.electron.api.auth.createUser({
        projectId,
        email: this.newEmail,
        password: this.newPassword,
        displayName: this.newDisplayName || undefined,
      });
      this.showCreate.set(false);
      this.newEmail = "";
      this.newPassword = "";
      this.newDisplayName = "";
      if (!this.searchMode()) {
        this.users.update((list) => [user, ...list]);
      }
      this.selected.set(user);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    }
  }
}

import { Injectable, computed, inject, signal } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";

@Injectable({ providedIn: "root" })
export class AppNavigationService {
  private readonly router = inject(Router);

  private readonly history = signal<string[]>([]);
  private readonly index = signal(0);

  readonly canGoBack = computed(() => this.index() > 0);
  readonly canGoForward = computed(
    () => this.index() < this.history().length - 1,
  );

  constructor() {
    this.push(this.router.url);

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.push(e.urlAfterRedirects));
  }

  goBack(): void {
    if (!this.canGoBack()) return;
    const next = this.index() - 1;
    const url = this.history()[next];
    if (url === undefined) return;
    this.index.set(next);
    void this.router.navigateByUrl(url);
  }

  goForward(): void {
    if (!this.canGoForward()) return;
    const next = this.index() + 1;
    const url = this.history()[next];
    if (url === undefined) return;
    this.index.set(next);
    void this.router.navigateByUrl(url);
  }

  private push(url: string): void {
    const stack = this.history();
    const i = this.index();
    if (stack[i] === url) return;

    const trimmed = stack.slice(0, i + 1);
    trimmed.push(url);
    this.history.set(trimmed);
    this.index.set(trimmed.length - 1);
  }
}

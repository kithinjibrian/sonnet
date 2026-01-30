"use client";

import { Component, effect, JSX, signal, Signal } from "@kithinji/orca";

@Component()
export class ListView {
  props!: {
    itemCount: number;
    itemBuilder: (index: number) => JSX.Element | null;
    onReachEnd?: () => void;
    onReachStart?: () => void;
    endThreshold?: number;
    startThreshold?: number;
  };

  private endObserverTarget: Signal<HTMLDivElement | undefined> =
    signal(undefined);
  private startObserverTarget: Signal<HTMLDivElement | undefined> =
    signal(undefined);
  private endObserver?: IntersectionObserver;
  private startObserver?: IntersectionObserver;
  private hasScrolled = false;

  constructor() {
    setTimeout(() => {
      this.hasScrolled = true;
    }, 100);

    effect(() => {
      if (this.endObserverTarget.value) {
        if (this.props.onReachEnd) {
          this.endObserver?.disconnect();

          this.endObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && this.hasScrolled) {
              this.props.onReachEnd?.();
            }
          });
          this.endObserver.observe(this.endObserverTarget.value);
        }
      }
    });

    effect(() => {
      if (this.startObserverTarget.value) {
        if (this.props.onReachStart) {
          this.startObserver?.disconnect();

          this.startObserver = new IntersectionObserver(
            (entries) => {
              if (entries[0].isIntersecting && this.hasScrolled) {
                this.props.onReachStart?.();
              }
            },
            {
              threshold: 0,
              rootMargin: `${this.props.startThreshold ?? 100}px`,
            },
          );
          this.startObserver.observe(this.startObserverTarget.value);
        }
      }
    });
  }

  onDestroy() {
    this.endObserver?.disconnect();
    this.startObserver?.disconnect();
  }

  build() {
    return (
      <div>
        {this.props.onReachStart && (
          <div ref={this.startObserverTarget.value} />
        )}
        <span>
          {Array.from({ length: this.props.itemCount }, (_, index) =>
            this.props.itemBuilder(index),
          )}
        </span>
        {this.props.onReachEnd && <div ref={this.endObserverTarget.value} />}
      </div>
    );
  }
}

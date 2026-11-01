/**
 * Ambient types for `page-flip` (StPageFlip 2.0.7).
 *
 * The published package ships no .d.ts and has no `types` field in its
 * package.json, so TypeScript cannot infer anything about it. Only the surface
 * this project actually uses is declared — not the whole library.
 *
 * Source of truth: node_modules/page-flip/src/PageFlip.ts and src/Settings.ts
 */
declare module 'page-flip' {
  export const enum SizeType {
    FIXED = 'fixed',
    STRETCH = 'stretch',
  }

  export const enum FlipCorner {
    TOP = 'top',
    BOTTOM = 'bottom',
  }

  export const enum Orientation {
    PORTRAIT = 'portrait',
    LANDSCAPE = 'landscape',
  }

  export interface FlipSetting {
    startPage: number;
    size: 'fixed' | 'stretch';
    width: number;
    height: number;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    drawShadow: boolean;
    flippingTime: number;
    usePortrait: boolean;
    startZIndex: number;
    autoSize: boolean;
    maxShadowOpacity: number;
    showCover: boolean;
    mobileScrollSupport: boolean;
    clickEventForward: boolean;
    useMouseEvents: boolean;
    swipeDistance: number;
    showPageCorners: boolean;
    disableFlipByClick: boolean;
  }

  export class PageFlip {
    constructor(element: HTMLElement, settings: Partial<FlipSetting>);

    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    loadFromImages(imagesHref: string[]): void;
    updateFromHtml(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    updateFromImages(imagesHref: string[]): void;

    flipNext(corner?: FlipCorner): void;
    flipPrev(corner?: FlipCorner): void;
    turnToPage(page: number): void;
    turnToNextPage(): void;
    turnToPrevPage(): void;

    getPageCount(): number;
    getCurrentPageIndex(): number;
    getOrientation(): Orientation;

    destroy(): void;

    on(event: string, callback: (e: unknown) => void): void;
    off(event: string): void;
  }
}

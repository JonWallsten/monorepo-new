import { ElementRef } from '@angular/core';

export class DebugService {
    private static _debugInfoDOMElement: HTMLElement | null;

    /**
     *
     *
     * @readonly
     * @private
     * @static
     * @memberof DebugService
     */
    private static get debugInfoDOMElement (): HTMLElement | null {
        if (!this._debugInfoDOMElement) {
            this._debugInfoDOMElement = document.querySelector<HTMLElement>('#component-debug-info');
        }

        return this._debugInfoDOMElement;
    }

    /**
     *
     *
     * @static
     * @param {(HTMLElement | undefined)} element
     * @param {EventListenerOrEventListenerObject} showCallback
     * @param {EventListenerOrEventListenerObject} hideCallback
     * @memberof DebugService
     */
    static attach (elementRef: ElementRef<HTMLElement> | undefined, showCallback: EventListenerOrEventListenerObject, hideCallback: EventListenerOrEventListenerObject) {
        if (elementRef) {
            elementRef.nativeElement.addEventListener('mouseenter', showCallback);
            elementRef.nativeElement.addEventListener('mouseleave', hideCallback);
        }
    }

    /**
     *
     *
     * @static
     * @param {(HTMLElement | undefined)} element
     * @param {EventListenerOrEventListenerObject} showCallback
     * @param {EventListenerOrEventListenerObject} hideCallback
     * @memberof DebugService
     */
    static detach (elementRef: ElementRef<HTMLElement> | undefined, showCallback: EventListenerOrEventListenerObject, hideCallback: EventListenerOrEventListenerObject) {
        if (elementRef) {
            elementRef.nativeElement.removeEventListener('mouseenter', showCallback);
            elementRef.nativeElement.removeEventListener('mouseleave', hideCallback);
        }
    }

    /**
     *
     *
     * @static
     * @param {HTMLElement} element
     * @memberof DebugService
     */
    static showDebugInfo (elementRef: ElementRef<HTMLElement>) {
        if (elementRef && this.debugInfoDOMElement) {
            this.debugInfoDOMElement.classList.add('component-debug-info--visible');
            this.setPosition(elementRef.nativeElement);
        }
    }

    /**
     *
     *
     * @static
     * @memberof DebugService
     */
    static hideDebugInfo () {
        if (this.debugInfoDOMElement) {
            this.debugInfoDOMElement.classList.remove('component-debug-info--visible');
        }
    }

    /**
     *
     *
     * @static
     * @param {string} data
     * @returns
     * @memberof DebugService
     */
    static updateDebugInfo (data: string): void {
        if (!this.debugInfoDOMElement) {
            return;
        }

        this.debugInfoDOMElement.innerHTML = data;
    }

    /**
     *
     *
     * @static
     * @param {HTMLElement} element
     * @memberof DebugService
     */
    static setPosition (element: HTMLElement): void {
        if (!this.debugInfoDOMElement || !element) {
            return;
        }

        const position = element.getBoundingClientRect();

        // If the box can't fit on the right side of the element we put it to the left
        if ((position.right + this.debugInfoDOMElement.clientWidth) > document.documentElement.clientWidth) {
            // If it can't fit on the left side of the elment we put it on the inside of the right side
            if ((position.left - this.debugInfoDOMElement.clientWidth) < 0) {
                this.debugInfoDOMElement.style.left = (position.right - this.debugInfoDOMElement.clientWidth + document.documentElement.scrollLeft) + 'px';
            } else {
                this.debugInfoDOMElement.style.left = (position.left - this.debugInfoDOMElement.clientWidth + document.body.scrollLeft) + 'px';
            }
        } else {
            this.debugInfoDOMElement.style.left = (position.right + document.documentElement.scrollLeft) + 'px';
        }

        // If the box can't fit on the right side of the element we put it to the left
        if ((position.top + document.documentElement.scrollTop + this.debugInfoDOMElement.clientHeight) > document.documentElement.scrollTop + document.documentElement.clientHeight) {
            // If it can't fit on the left side of the elment we put it on the inside of the right side
            this.debugInfoDOMElement.style.top = (document.documentElement.clientHeight + document.documentElement.scrollTop - (this.debugInfoDOMElement.clientHeight + 10)) + 'px';
        } else {
            this.debugInfoDOMElement.style.top = (position.top + document.documentElement.scrollTop) + 'px';
        }
    }
}

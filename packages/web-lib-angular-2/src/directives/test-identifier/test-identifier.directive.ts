import { Directive, ElementRef, Input, Renderer2 } from '@angular/core';

@Directive({
    selector: '[testIdentifier]'
})
export class TestIdentifierDirective {
    private static prefix: string = '_oas_';

    @Input('testIdentifier') testSelector: string;

    constructor (private renderer: Renderer2, private el: ElementRef) {}

    ngOnInit () {
        this.renderer.setAttribute(this.el.nativeElement, TestIdentifierDirective.prefix + this.testSelector, '');
    }
}

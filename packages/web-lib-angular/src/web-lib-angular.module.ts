import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogComponent } from './components/dialog/dialog.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { MaterialDesignModule } from './material-design/material-design.module';
import { TestIdentifierDirective } from './directives/test-identifier/test-identifier.directive';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogService } from './services/dialog.service';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DebugComponent } from './components/debug/debug.component';
import { PipesModule } from './pipes/pipes.module';


@NgModule({
    // Modules
    imports: [
        CommonModule,
        BrowserAnimationsModule,
        BrowserModule,
        MaterialDesignModule,
        ReactiveFormsModule,
        FormsModule,
        PipesModule
    ],
    // Components/directives
    declarations: [
        DialogComponent,
        TestIdentifierDirective,
        DebugComponent
    ],
    // Components/directives to export
    exports: [
        DialogComponent,
        TestIdentifierDirective,
        DebugComponent,
        PipesModule
    ],
    // Components used in dialogs
    entryComponents: [
        DialogComponent
    ],
    // Services
    providers: [
        DialogService,
        {
            provide: MatDialogRef,
            useValue: {}
        },
        {
            provide: MAT_DIALOG_DATA,
            useValue: {}
        }]
})
export class WebLibAngularModule {}

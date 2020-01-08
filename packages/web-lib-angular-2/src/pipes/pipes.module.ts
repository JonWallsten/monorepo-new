import { NgModule } from '@angular/core';
import { MaxCharactersPipe } from './max-characters.pipe';
import { SafePipe } from './safe.pipe';

@NgModule({
    declarations: [
        MaxCharactersPipe,
        SafePipe
    ],
    exports: [
        MaxCharactersPipe,
        SafePipe
    ]
})
export class PipesModule { }


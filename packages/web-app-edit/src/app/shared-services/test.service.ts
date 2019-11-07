import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class TestService {
    public doSomething () {
        console.log('something done'); // tslint:disable-line no-console
    }
}

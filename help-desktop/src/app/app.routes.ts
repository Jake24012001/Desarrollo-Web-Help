import { Routes } from '@angular/router';
import { Navbar } from '../components/navbar/navbar';
import { VistaPrincipal } from '../components/vista-principal/vista-principal';
import { Footer } from '../components/footer/footer';

export const routes: Routes = [
    {path:'',component:Navbar},
    {path:'help-menu',component:VistaPrincipal,
        children:[
            {
                path:'footer',component:Footer
            }
        ]
    }
];

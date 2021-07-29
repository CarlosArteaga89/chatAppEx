import { Component, OnInit } from '@angular/core';
import {UserInterface} from '../../interfaces/user';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {FirebaseService} from '../../services/firebase.service';
import {LoadingController, ToastController} from '@ionic/angular';
import {Router} from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {

  toast: any;
  loading: any;

  user: UserInterface = {
    id: this.firebaseService.newId(),
    name: '',
    email: '',
    password: '',
  };

  validationsForm: FormGroup;
  errorMessage: string;
  successMessage: string;

  validationmessages = {
    nombre: [
      { type: 'required', message: 'El nombre es obligatorio.' },
    ],
    email: [
      { type: 'required', message: 'El email es obligatorio.' },
      { type: 'pattern', message: 'Ingrese un email valido.' }
    ],
    password: [
      { type: 'required', message: 'La contraseña es obligatoria.' },
      { type: 'minlength', message: 'La contraseña debe tener 5 caracteres como minimo.' }
    ]
  };

  constructor(
    private firebaseService: FirebaseService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private router: Router
  ) { }

  ngOnInit() {
    this.validationsForm = new FormGroup({
      nombre: new FormControl('', Validators.compose([
        Validators.required,
      ])),
      email: new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
      ])),
      password: new FormControl('', Validators.compose([
        Validators.minLength(5),
        Validators.required
      ])),
    });
  }

  async createUsr() {
    const credenciales = {
      email: this.user.email,
      password: this.user.password,
    };
    const resp = await this.firebaseService.registrar(credenciales.email, credenciales.password).catch(err => {
      console.log('Error', err);
      console.log(credenciales.email, credenciales.password);
    });
    const uid = await this.firebaseService.getUid();
    this.user.id = uid;
    console.log(uid);
    const loading = await this.loadingCtrl.create({
      message: 'Guardando...'
    });
    await loading.present();
    // Guardamos el usuario
    this.firebaseService.createUsr(this.user, 'usuarios', this.user.id).then(() => {
      loading.dismiss();
      this.salir();
      this.presentarToast('Guardado con exito');
      this.router.navigate(['/login']);
    });
  }

  async registrarUsr(){
    const credenciales = {
      email: this.user.email,
      password: this.user.password,
    };
    const resp = await this.firebaseService.registrar(credenciales.email, credenciales.password).catch(err => {
      console.log('Error', err);
    });
    this.credencialesUsr();
  }

  onSubmit(values) {
    console.log(values);
  }

  ingresarUsr(email, password){
    this.firebaseService.login(email, password);
  }

  salir() {
    this.firebaseService.logout();
  }

  async credencialesUsr() {
    const uid = await this.firebaseService.getUid();
    this.user.id = uid;
    console.log(uid);
    this.createUsr();
  }

  goLoginPage() {
    this.router.navigate(['/login']);
  }

  async presentarToast(msg: string) {
    this.toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      cssClass: 'toast'
    });
    this.toast.present();
  }

}

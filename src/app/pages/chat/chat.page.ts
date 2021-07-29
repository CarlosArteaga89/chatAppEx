import {Component, NgZone, ViewChild, ElementRef, OnInit} from '@angular/core';
import {MessageInterface} from '../../interfaces/message';
import {UserInterface} from '../../interfaces/user';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {FirebaseService} from '../../services/firebase.service';
import {LoadingController, ToastController} from '@ionic/angular';
import {Router} from '@angular/router';
import {AngularFireStorage} from '@angular/fire/storage';
import {finalize} from 'rxjs/operators';
import {NativeGeocoder, NativeGeocoderResult, NativeGeocoderOptions} from '@ionic-native/native-geocoder/ngx';
import { Geolocation } from '@ionic-native/geolocation/ngx';


declare const google;

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit {
  @ViewChild('map',  {static: false}) mapElement: ElementRef;
  toast: any;
  loading: any;
  msgs: MessageInterface[];
  nuevaImg = '';
  nuevoArchivo = '';
  mapa: any;
  direccion: string;
  lat: string;
  long: string;

  msg: MessageInterface = {
    id: this.firebaseService.newId(),
    usrname: '',
    message: '',
    foto: '',
    ubicacion: ''
  };

  user: UserInterface = {
    id: '',
    name: '',
    email: '',
    password: '',
  };

  uid = '';

  validationsForm: FormGroup;

  validationmessages = {
    message: [
      { type: 'required', message: 'Ingrese un mensaje.' },
    ],
  };

  constructor(
    private firebaseService: FirebaseService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private storage: AngularFireStorage,
    private router: Router,
    private formBuilder: FormBuilder,
    private geolocation: Geolocation,
    private nativeGeocoder: NativeGeocoder,
    public zone: NgZone
  ) {
    this.firebaseService.stateAuth().subscribe(res => {
      if(res !== null) {
        this.uid = res.uid;
        this.getUsrInf(this.uid);
      }
    });
  }

  ngOnInit() {
    this.cargarMap();
    this.cargarMsgs();
    this.credencialesUsr();
    this.validationsForm = this.formBuilder.group({
      message: new FormControl('', Validators.compose([
        Validators.required,
      ])),
    });
  }

  async createMsg() {
    this.msg.usrname = this.user.name;
    this.msg.foto = this.nuevaImg;
    this.msg.ubicacion = this.lat + this.long;
    const loading = await this.loadingCtrl.create({
      message: 'Guardando...'
    });
    await loading.present();
    // Guardamos el usuario
    this.firebaseService.createUsr(this.msg, 'mensajes', this.msg.id).then(() => {
      loading.dismiss();
      this.presentarToast('Guardado con exito');
      this.router.navigate(['/chat']);
      location.reload();
    });
  }

  async presentarToast(msg: string) {
    this.toast = await this.toastCtrl.create({
      message: msg,
      duration: 5000,
      cssClass: 'toast'
    });
    this.toast.present();
  }

  cargarMsgs() {
    this.presentarLoading();
    this.firebaseService.getMsgs<MessageInterface>('mensajes').subscribe( res => {
        this.msgs = res;
        this.loading.dismiss();
        this.msg.message = '';
      }
    );
  }

  async credencialesUsr() {
    const uid = await this.firebaseService.getUid();
    this.user.id = uid;
    console.log(uid);
  }

  async presentarLoading() {
    this.loading = await this.loadingCtrl.create({
      cssClass: 'normal',
      message: 'Cargando...!'
    });
    await this.loading.present();
  }

  salir() {
    this.firebaseService.logout().then( () => {
      this.router.navigate(['/login']);
    });
  }

  getUsrInf( uid: string){
    this.firebaseService.getUsr('usuarios', uid).subscribe(res => {
      this.user = res as UserInterface;
    });
  }

  async subirImg(event: any){
    if (event.target.files && event.target.files[0]){
      this.nuevoArchivo = event.target.files[0];
      const reader = new FileReader();
      reader.onload = ((image) => {
        this.nuevaImg = image.target.result as string;
      });
      reader.readAsDataURL(event.target.files[0]);
    }
    const path = 'imagenes';
    const nombre = this.user.name;
    const file = event.target.files[0];
    const filePath = path + '/' + nombre ;
    const ref = this.storage.ref(filePath);
    const task = ref.put(file);
    task.snapshotChanges().pipe(
      finalize(() => {
        ref.getDownloadURL().subscribe( img => {
          const downloadURL = img;
          this.nuevaImg = downloadURL;
          console.log(this.nuevaImg);
          return;
        });
      })
    ).subscribe();
  }

  onSubmit(values) {
    console.log(values);
  }

  cargarMap() {
    this.geolocation.getCurrentPosition().then((resp) => {
      const latLng = new google.maps.LatLng(resp.coords.latitude, resp.coords.longitude);
      const mapOptions = {
        center: latLng,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      this.obtenerCoordenadasDir(resp.coords.latitude, resp.coords.longitude);
      this.mapa = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
      this.mapa.addListener('tilesloaded', () => {
        console.log('accuracy',this.mapa, this.mapa.center.lat());
        this.obtenerCoordenadasDir(this.mapa.center.lat(), this.mapa.center.lng());
        this.lat = this.mapa.center.lat();
        this.long = this.mapa.center.lng();
      });
    }).catch((error) => {
      console.log('Error getting location', error);
    });
  }

  obtenerCoordenadasDir(lattitude, longitude) {
    console.log('Coordenadas de Direccion: '+lattitude+' '+longitude);
    const options: NativeGeocoderOptions = {
      useLocale: true,
      maxResults: 5
    };
    this.nativeGeocoder.reverseGeocode(lattitude, longitude, options)
      .then((result: NativeGeocoderResult[]) => {
        this.direccion = '';
        const responseAddress = [];
        for (const [key, value] of Object.entries(result[0])) {
          if (value.length>0) {
            responseAddress.push(value);
          }
        }
        responseAddress.reverse();
        for (const value of responseAddress) {
          this.direccion += value+', ';
        }
        this.direccion = this.direccion.slice(0, -2);
      })
      .catch((error: any) =>{
        this.direccion = 'Direccion no Disponible!';
      });
  }

  mostrarCoordenadas(){
    this.msg.message = this.lat + this.long;
  }

}

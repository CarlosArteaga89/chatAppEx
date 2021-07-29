import { Injectable } from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(
    private db: AngularFirestore,
    private afAuth: AngularFireAuth
  ) { }

  createUsr(data: any, path: string, id: string){
    const collection = this.db.collection(path);
    return collection.doc(id).set(data);
  }

  getUsr(path: string, id: string){
    const collection = this.db.collection(path);
    return collection.doc(id).valueChanges();
  }

  deleteUsr(path: string, id: string){
    const collection = this.db.collection(path);
    return collection.doc(id).delete();
  }

  updateUsr(data: any, path: string, id: string) {
    const collection = this.db.collection(path);
    return collection.doc(id).update(data);
  }

  getUsrs<tipo>(path: string){
    const collection = this.db.collection<tipo>(path);
    return collection.valueChanges();
  }

  getMsgs<tipo>(path: string){
    const collection = this.db.collection<tipo>(path);
    return collection.valueChanges();
  }

  login(email: string, password: string) {
    try {
      this.afAuth.signInWithEmailAndPassword(email, password).then( usr => {
        console.log(usr);
      });
    } catch (error) {
      console.log(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.afAuth.signOut();
    } catch (error) {
      console.log ('Se ha producido un error', error);
    }
  }

  registrar( email: string, password: string) {
    return new Promise((resolve, reject) => {
      this.afAuth.createUserWithEmailAndPassword(email, password).then(usr => {
        resolve(usr);
      }).catch(error => reject(error));
    });
  }

  async getUid(){
    const user = await this.afAuth.currentUser;
    if (user === null) {
      return null;
    } else {
      return user.uid;
    }
  }

  newId(){
    return this.db.createId();
  }

  stateAuth() {
    return  this.afAuth.authState;
  }
}

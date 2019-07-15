import { IonLifeCycleContextInterface } from "@ionic/react";

export class DefaultIonLifeCycleContext
  implements IonLifeCycleContextInterface {
  ionViewWillEnterCallback?: Function;
  ionViewDidEnterCallback?: Function;
  ionViewWillLeaveCallback?: Function;
  ionViewDidLeaveCallback?: Function;
  componentCanBeDestroyedCallback?: Function;

  onIonViewWillEnter(callback?: Function) {
    this.ionViewWillEnterCallback = callback;
  }

  ionViewWillEnter() {
    if (this.ionViewWillEnterCallback) {
      this.ionViewWillEnterCallback();
    }
  }

  onIonViewDidEnter(callback?: Function) {
    this.ionViewDidEnterCallback = callback;
  }

  ionViewDidEnter() {
    if (this.ionViewDidEnterCallback) {
      this.ionViewDidEnterCallback();
    }
  }

  onIonViewWillLeave(callback?: Function) {
    this.ionViewWillLeaveCallback = callback;
  }

  ionViewWillLeave() {
    if (this.ionViewWillLeaveCallback) {
      this.ionViewWillLeaveCallback();
    }
  }

  onIonViewDidLeave(callback?: Function) {
    this.ionViewDidLeaveCallback = callback;
  }

  ionViewDidLeave() {
    if (this.ionViewDidLeaveCallback) {
      this.ionViewDidLeaveCallback();
    }
    this.componentCanBeDestroyed();
  }

  onComponentCanBeDestroyed(callback?: Function) {
    this.componentCanBeDestroyedCallback = callback;
  }

  componentCanBeDestroyed() {
    if (this.componentCanBeDestroyedCallback) {
      this.componentCanBeDestroyedCallback();
    }
  }
}

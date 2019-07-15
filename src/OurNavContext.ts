import React, { ReactNode } from "react";
import { NavDirection } from "@ionic/core";

export type OurNavDirection = NavDirection | "present" | "dismiss";

export interface ViewItem<RouteData = any> {
  id: string;
  key: string;
  element: React.ReactElement<any>;
  ref?: React.RefObject<HTMLElement>;
  routeData: RouteData;
  prevId?: string;
  mount: boolean;
  show: boolean;
  preventHide: boolean;
}

export interface ViewStack {
  stackId: string;
  routerOutlet: HTMLIonRouterOutletElement;
  activeId?: string;
  views: ViewItem[];
  isPresentation: boolean;
  closePath?: string;
  isActive: boolean;
}

export interface ViewStacks {
  [key: string]: ViewStack;
}

export interface NavContextState {
  viewStacks: ViewStacks;
  activeViewStackId?: string;

  hideView: (viewId: string) => void;
  setupIonRouter: (
    id: string,
    children: ReactNode,
    routerOutlet: HTMLIonRouterOutletElement,
    isPresentation: boolean,
    closePath: string | undefined
  ) => void;
  removeViewStack: (stack: string) => void;
  renderChild: (item: ViewItem) => void;
  goBack: (defaultHref?: string) => void;
  transitionView: (
    enteringEl: HTMLElement,
    leavingEl: HTMLElement,
    ionRouterOuter: HTMLIonRouterOutletElement,
    direction: OurNavDirection
  ) => void;
}

export type OurNavContextState = NavContextState;

export const OurNavContext = React.createContext<OurNavContextState>(
  null as any
);

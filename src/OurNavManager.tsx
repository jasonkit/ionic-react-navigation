import React, { ReactNode } from "react";

import { NavDirection } from "@ionic/core";
import {
  Action as HistoryAction,
  Location as HistoryLocation,
  UnregisterCallback,
} from "history";
import {
  match,
  matchPath,
  Redirect,
  RouteComponentProps,
  RouteProps,
  Switch,
  withRouter,
} from "react-router-dom";
import { presentationAnimation } from "./animation";
import {
  OurNavContext,
  OurNavContextState,
  OurNavDirection,
  ViewItem,
  ViewStack,
  ViewStacks,
} from "./OurNavContext";
import { generateUniqueId } from "./utils";

type OurNavManagerProps = RouteComponentProps;
type OurNavManagerState = OurNavContextState;

interface OurRouteData {
  match: match<{ tab: string }> | null;
  childProps: RouteProps;
}

function isNavDirection(x: OurNavDirection): x is NavDirection {
  return x !== "present" && x !== "dismiss";
}

function lifecycle(el: HTMLElement | undefined, eventName: string) {
  if (el) {
    const ev = new CustomEvent(eventName, {
      bubbles: false,
      cancelable: false,
    });
    el.dispatchEvent(ev);
  }
}

class OurNavManagerImpl extends React.Component<
  OurNavManagerProps,
  OurNavManagerState
> {
  listenUnregisterCallback?: UnregisterCallback;
  activeViewId?: string;
  prevViewId?: string;

  isGoingBackBySwipe = false;
  pathToRevertForSwipeBack?: string;
  isRevertingSwipeBack = false;

  constructor(props: OurNavManagerProps) {
    super(props);
    this.state = {
      viewStacks: {},
      hideView: this.hideView.bind(this),
      setupIonRouter: this.setupIonRouter.bind(this),
      removeViewStack: this.removeViewStack.bind(this),
      renderChild: this.renderChild.bind(this),
      goBack: this.goBack.bind(this),
      transitionView: this.transitionView.bind(this),
    };
  }

  componentWillMount() {
    this.listenUnregisterCallback = this.props.history.listen(
      this.historyChange.bind(this)
    );
  }

  hideView(viewId: string) {
    const viewStacks = Object.assign({}, this.state.viewStacks);
    const { view } = this.findViewInfoById(viewId, viewStacks);
    if (view) {
      view.show = false;
      view.key = generateUniqueId();
      this.setState({
        viewStacks,
      });
    }
  }

  historyChange(location: HistoryLocation, action: HistoryAction) {
    this.setActiveView(location, action);
  }

  findViewInfoByLocation(
    location: HistoryLocation,
    viewStacks: ViewStacks
  ): {
    view: ViewItem<OurRouteData> | undefined;
    viewStack: ViewStack | undefined;
    match: OurRouteData["match"] | null;
  } {
    let view: ViewItem<OurRouteData> | undefined;
    let match: OurRouteData["match"] | null = null;
    let viewStack: ViewStack | undefined;
    const keys = Object.keys(viewStacks);
    keys.some(key => {
      const vs = viewStacks[key];
      return vs.views.some(x => {
        match = matchPath(location.pathname, x.routeData.childProps);
        if (match) {
          view = x;
          viewStack = vs;
          return true;
        }
        return false;
      });
    });

    const result = { view, viewStack, match };
    return result;
  }

  findViewInfoById(
    id: string | undefined,
    viewStacks: ViewStacks
  ): {
    view: ViewItem<OurRouteData> | undefined;
    viewStack: ViewStack | undefined;
  } {
    let view: ViewItem<OurRouteData> | undefined;
    let viewStack: ViewStack | undefined;
    const keys = Object.keys(viewStacks);
    keys.some(key => {
      const vs = viewStacks[key];
      view = vs.views.find(x => x.id === id);
      if (view) {
        viewStack = vs;
        return true;
      }

      return false;
    });
    return { view, viewStack };
  }

  setActiveView(location: HistoryLocation, action: HistoryAction) {
    const viewStacks = Object.assign({}, this.state.viewStacks);

    const {
      view: enteringView,
      viewStack: enteringViewStack,
      match,
    } = this.findViewInfoByLocation(location, viewStacks);
    let direction: OurNavDirection = location.state && location.state.direction;

    if (!enteringViewStack) {
      return;
    }

    const {
      view: leavingView,
      viewStack: leavingViewStack,
    } = this.findViewInfoById(this.activeViewId, viewStacks);

    if (
      leavingView &&
      leavingView.routeData.match &&
      leavingView.routeData.match.url === location.pathname
    ) {
      return;
    }

    const isPresent = this.isMatchClosePath(leavingView, leavingViewStack);
    const isDismiss = this.isMatchClosePath(enteringView, enteringViewStack);

    if (enteringView) {
      /**
       * If the page is being pushed into the stack by another view,
       * record the view that originally directed to the new view for back button purposes.
       */
      if (!enteringView.show && action === "PUSH") {
        enteringView.prevId = leavingView && leavingView.id;
      }

      enteringView.show = true;
      enteringView.mount = true;
      enteringView.routeData.match = match;
      enteringView.preventHide = this.isGoingBackBySwipe;

      enteringViewStack.activeId = enteringView.id;
      this.activeViewId = enteringView.id;

      if (
        enteringView.routeData.match &&
        enteringView.routeData.match.url !== enteringViewStack.closePath
      ) {
        enteringViewStack.isActive = true;
      }

      if (leavingView) {
        this.prevViewId = leavingView.id;
        if (
          leavingView.routeData.match &&
          enteringView.routeData.match &&
          leavingView.routeData.match.params.tab ===
            enteringView.routeData.match.params.tab
        ) {
          if (action === "PUSH") {
            direction = direction || "forward";
          } else {
            direction = direction || "back";
            leavingView.mount = false;
          }
        }
        /**
         * Attempt to determine if the leaving view is a route redirect.
         * If it is, take it out of the rendering phase.
         * We assume Routes with render props are redirects, because of this users should not use
         * the render prop for non redirects, and instead provide a component in its place.
         */
        if (
          leavingView.element.type === Redirect ||
          leavingView.element.props.render
        ) {
          leavingView.mount = false;
          leavingView.show = false;
        }

        if (isDismiss) {
          this.unmountViewsOnStacks(leavingViewStack);
          direction = "dismiss";
        } else if (isPresent) {
          direction = "present";
        }
      }

      if (isDismiss || this.isGoingBackBySwipe || this.isRevertingSwipeBack) {
        const enteringEl =
          enteringView.ref && enteringView.ref.current
            ? enteringView.ref.current
            : undefined;

        const leavingEl =
          leavingView && leavingView.ref && leavingView.ref.current
            ? leavingView.ref.current
            : undefined;

        if (enteringEl) {
          this.transitionView(
            enteringEl,
            leavingEl,
            enteringViewStack.routerOutlet,
            direction,
            () => {
              if (leavingViewStack && isDismiss) {
                leavingViewStack.isActive = false;
              }
              this.setState(
                {
                  viewStacks,
                  activeViewStackId: enteringViewStack.stackId,
                },
                () => {
                  lifecycle(leavingEl, "ionViewForceDestroy");
                }
              );

              if (this.isRevertingSwipeBack) {
                this.isRevertingSwipeBack = false;
              }
            }
          );
        }
      } else {
        this.setState(
          {
            viewStacks,
            activeViewStackId: enteringViewStack.stackId,
          },
          () => {
            const enteringEl =
              enteringView.ref && enteringView.ref.current
                ? enteringView.ref.current
                : undefined;
            const leavingEl =
              leavingView && leavingView.ref && leavingView.ref.current
                ? leavingView.ref.current
                : undefined;

            if (enteringEl) {
              this.transitionView(
                enteringEl,
                leavingEl,
                enteringViewStack.routerOutlet,
                direction
              );
            }
          }
        );
      }
    }
  }

  private isMatchClosePath(
    view?: ViewItem<OurRouteData>,
    viewStack?: ViewStack
  ) {
    return (
      view &&
      viewStack &&
      view.routeData.match &&
      view.routeData.match.url === viewStack.closePath
    );
  }

  unmountViewsOnStacks = (viewStack?: ViewStack) => {
    if (!viewStack) return;

    for (const view of viewStack.views) {
      if (!this.isMatchClosePath(view, viewStack)) {
        view.mount = false;
        view.show = false;
      }
    }
  };

  componentWillUnmount() {
    if (this.listenUnregisterCallback) {
      this.listenUnregisterCallback();
    }
  }

  setupIonRouter(
    id: string,
    children: ReactNode,
    routerOutlet: HTMLIonRouterOutletElement,
    isPresentation: boolean,
    closePath: string | undefined
  ) {
    const views: ViewItem[] = [];
    let activeId: string | undefined;

    const addView = (child: React.ReactElement<any>) => {
      const location = this.props.history.location;
      const viewId = generateUniqueId();
      const key = generateUniqueId();
      const element = child;
      const match: OurRouteData["match"] | null = matchPath(
        location.pathname,
        child.props
      );
      const view: ViewItem<OurRouteData> = {
        id: viewId,
        key,
        routeData: {
          match,
          childProps: child.props,
        },
        element,
        mount: true,
        show: !!match,
        ref: React.createRef(),
        preventHide: false,
      };
      if (match) {
        activeId = viewId;
      }
      views.push(view);
      return activeId;
    };

    React.Children.forEach(children as any, (child: React.ReactElement) => {
      if (child.type === Switch) {
        /**
         * If the first child is a Switch, loop through its children to build the viewStack
         */
        React.Children.forEach(
          child.props.children,
          (grandChild: React.ReactElement) => {
            addView.call(this, grandChild);
          }
        );
      } else {
        addView.call(this, child);
      }
    });

    if (activeId) {
      this.registerViewStack(
        id,
        activeId,
        views,
        routerOutlet,
        this.props.location,
        isPresentation,
        closePath
      );
    }
  }

  registerViewStack(
    stack: string,
    activeId: string,
    stackItems: ViewItem[],
    routerOutlet: HTMLIonRouterOutletElement,
    location: HistoryLocation,
    isPresentation: boolean,
    closePath: string | undefined
  ) {
    routerOutlet.swipeHandler = this;

    this.setState(
      prevState => {
        const prevViewStacks = Object.assign({}, prevState.viewStacks);
        prevViewStacks[stack] = {
          stackId: stack,
          activeId: activeId,
          views: stackItems,
          routerOutlet,
          isPresentation,
          closePath,
          isActive: false,
        };

        return {
          viewStacks: prevViewStacks,
          activeViewStackId:
            prevState.activeViewStackId || (isPresentation ? undefined : stack),
        };
      },
      () => {
        const { view: activeView } = this.findViewInfoById(
          activeId,
          this.state.viewStacks
        );

        if (activeView) {
          this.prevViewId = this.activeViewId;
          this.activeViewId = activeView.id;
          const direction = location.state && location.state.direction;
          const { view: prevView } = this.findViewInfoById(
            this.prevViewId,
            this.state.viewStacks
          );
          if (activeView.ref && activeView.ref.current) {
            this.transitionView(
              activeView.ref.current,
              (prevView && prevView.ref && prevView.ref.current) || undefined,
              routerOutlet,
              direction
            );
          }
        }
      }
    );
  }

  removeViewStack(stack: string) {
    this.setState(state => {
      const viewStacks = Object.assign({}, state.viewStacks);
      delete viewStacks[stack];
      return {
        viewStacks,
      };
    });
  }

  renderChild(item: ViewItem<OurRouteData>) {
    const component = React.cloneElement(item.element, {
      location: this.props.location,
      computedMatch: item.routeData.match,
    });
    return component;
  }

  findActiveView(views: ViewItem[]) {
    let view: ViewItem<OurRouteData> | undefined;
    views.some(x => {
      const match = matchPath(
        this.props.location.pathname,
        x.routeData.childProps
      );
      if (match) {
        view = x;
        return true;
      }
      return false;
    });
    return view;
  }

  goBack = (defaultHref?: string) => {
    const {
      view: leavingView,
      viewStack: leavingViewStack,
    } = this.findViewInfoByLocation(this.props.location, this.state.viewStacks);

    let href = defaultHref || "/";

    if (leavingView) {
      if (leavingViewStack && leavingViewStack.isPresentation) {
        href = defaultHref || leavingViewStack.closePath || "/close";
      }

      const { view: enteringView } = this.findViewInfoById(
        leavingView.prevId,
        this.state.viewStacks
      );
      if (enteringView && enteringView.routeData.match) {
        href = enteringView.routeData.match.url;
      }
    }

    this.props.history.replace(href, { direction: "back" });
  };

  transitionView(
    enteringEl: HTMLElement,
    leavingEl: HTMLElement | undefined,
    ionRouterOuter: HTMLIonRouterOutletElement,
    direction: OurNavDirection,
    callback?: () => void
  ) {
    /**
     * Super hacky workaround to make sure ionRouterOutlet is available
     * since transitionView might be called before IonRouterOutlet is fully mounted
     */
    if (ionRouterOuter && ionRouterOuter.componentOnReady) {
      this.commitView(
        enteringEl,
        leavingEl,
        ionRouterOuter,
        direction,
        callback
      );
    } else {
      setTimeout(() => {
        this.transitionView(
          enteringEl,
          leavingEl,
          ionRouterOuter,
          direction,
          callback
        );
      }, 10);
    }
  }

  private async commitView(
    enteringEl: HTMLElement,
    leavingEl: HTMLElement | undefined,
    ionRouterOuter: HTMLIonRouterOutletElement,
    direction: OurNavDirection,
    callback?: () => void
  ) {
    await ionRouterOuter.componentOnReady();
    if (isNavDirection(direction)) {
      await ionRouterOuter
        .commit(enteringEl, this.isRevertingSwipeBack ? undefined : leavingEl, {
          deepWait: true,
          duration: direction === undefined ? 0 : undefined,
          direction: direction,
          showGoBack: direction === "forward",
          progressAnimation: this.isGoingBackBySwipe,
        })
        .then(() => {
          if (callback) {
            callback();
          }
        });
    } else {
      await ionRouterOuter
        .commit(enteringEl, leavingEl, {
          deepWait: true,
          duration: undefined,
          direction: direction === "present" ? "forward" : "back",
          showGoBack: false,
          progressAnimation: false,
          animationBuilder: presentationAnimation,
        })
        .then(() => {
          if (callback) {
            callback();
          }
        });
    }

    if (leavingEl && enteringEl !== leavingEl) {
      /**
       *  add hidden attributes
       */
      leavingEl.classList.add("ion-page-hidden");
      leavingEl.setAttribute("aria-hidden", "true");
    }
  }

  render() {
    return (
      <OurNavContext.Provider value={this.state}>
        {this.props.children}
      </OurNavContext.Provider>
    );
  }

  getGoBackPath = () => {
    const { view: leavingView } = this.findViewInfoByLocation(
      this.props.location,
      this.state.viewStacks
    );
    if (leavingView) {
      const { view: enteringView } = this.findViewInfoById(
        leavingView.prevId,
        this.state.viewStacks
      );

      if (
        enteringView &&
        enteringView.routeData.match &&
        leavingView.routeData.match
      ) {
        if (
          leavingView.routeData.match.params.tab ===
          enteringView.routeData.match.params.tab
        ) {
          return enteringView.routeData.match.url;
        }
      }
    }
    return null;
  };

  // For swipeHandler
  canStart = (): boolean => {
    const path = this.getGoBackPath();
    return path != null;
  };

  onStart = () => {
    const path = this.getGoBackPath();
    if (path) {
      this.isGoingBackBySwipe = true;
      this.pathToRevertForSwipeBack = this.props.location.pathname;
      this.goBack();
    }
  };

  onEnd = (shouldComplete: boolean) => {
    this.isGoingBackBySwipe = false;
    if (!shouldComplete && this.pathToRevertForSwipeBack) {
      this.isRevertingSwipeBack = true;
      this.props.history.push(this.pathToRevertForSwipeBack);
    }

    this.pathToRevertForSwipeBack = undefined;
  };
}

export const OurNavManager = withRouter(OurNavManagerImpl);
OurNavManager.displayName = "OurNavManager";

import React from "react";
import { IonRouterOutletInner } from "@ionic/react";
import { OurNavContext } from "./OurNavContext";
import { OurViewItemManager } from "./OurViewItemManager";
import { OurView } from "./OurView";
import { generateUniqueId } from "./utils";
import classNames from "classnames";

import "./styles.css";

interface OurRouterOutletProps {
  id?: string;
  isPresentation?: boolean;
  closePath?: string;
}

export class OurRouterOutlet extends React.Component<OurRouterOutletProps> {
  containerEl: React.RefObject<HTMLIonRouterOutletElement> = React.createRef();
  context!: React.ContextType<typeof OurNavContext>;
  id: string;

  constructor(props: OurRouterOutletProps) {
    super(props);
    this.id = this.props.id || generateUniqueId();
  }

  componentDidMount() {
    if (this.containerEl.current) {
      this.context.setupIonRouter(
        this.id,
        this.props.children,
        this.containerEl.current,
        this.props.isPresentation || false,
        this.props.isPresentation ? this.props.closePath || "/close" : undefined
      );
    }
  }

  componentWillUnmount() {
    this.context.removeViewStack(this.id);
  }

  get isActivePresentation() {
    const { isPresentation } = this.props;
    const viewStack = this.context.viewStacks[this.id];
    return isPresentation && viewStack && viewStack.isActive;
  }

  render() {
    const context = this.context;
    const viewStack = context.viewStacks[this.id];
    const activeId = viewStack ? viewStack.activeId : "";
    const views = (viewStack || { views: [] }).views.filter(x => x.show);

    return (
      <IonRouterOutletInner
        data-id={this.id}
        ref={this.containerEl}
        class={classNames("hydrated", {
          activePresentation: this.isActivePresentation,
        })}
      >
        {views.map(item => {
          let props: any = {};
          if (item.id === activeId && !item.preventHide) {
            props = {
              className: " ion-page-invisible",
            };
          }
          return (
            <OurViewItemManager id={item.id} key={item.key} mount={item.mount}>
              <OurView ref={item.ref} {...props}>
                {this.context.renderChild(item)}
              </OurView>
            </OurViewItemManager>
          );
        })}
      </IonRouterOutletInner>
    );
  }
}

OurRouterOutlet.contextType = OurNavContext;

import React from "react";
import { IonLifeCycleContext } from "@ionic/react";

type Props = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
>;

interface InternalProps extends React.HTMLAttributes<HTMLElement> {
  forwardedRef?: React.Ref<HTMLElement>;
}

type ExternalProps = Props & {
  ref?: React.Ref<HTMLElement>;
};

interface StackViewState {
  ref: any;
}

class ViewInternal extends React.Component<InternalProps, StackViewState> {
  context!: React.ContextType<typeof IonLifeCycleContext>;

  constructor(props: InternalProps) {
    super(props);
    this.state = {
      ref: null
    };
  }

  componentDidMount() {
    const forwardedRef = this.props.forwardedRef as React.RefObject<
      HTMLElement
    > | null;
    this.setState({ ref: forwardedRef });
    if (forwardedRef && forwardedRef.current) {
      forwardedRef.current.addEventListener(
        "ionViewWillEnter",
        this.ionViewWillEnterHandler.bind(this)
      );
      forwardedRef.current.addEventListener(
        "ionViewDidEnter",
        this.ionViewDidEnterHandler.bind(this)
      );
      forwardedRef.current.addEventListener(
        "ionViewWillLeave",
        this.ionViewWillLeaveHandler.bind(this)
      );
      forwardedRef.current.addEventListener(
        "ionViewDidLeave",
        this.ionViewDidLeaveHandler.bind(this)
      );
      forwardedRef.current.addEventListener(
        "ionViewForceDestroy",
        this.ionViewForceDestroyHandler.bind(this)
      );
    }
  }

  componentWillUnmount() {
    const forwardedRef = this.props.forwardedRef as React.RefObject<
      HTMLElement
    > | null;
    if (forwardedRef && forwardedRef.current) {
      forwardedRef.current.removeEventListener(
        "ionViewWillEnter",
        this.ionViewWillEnterHandler.bind(this)
      );
      forwardedRef.current.removeEventListener(
        "ionViewDidEnter",
        this.ionViewDidEnterHandler.bind(this)
      );
      forwardedRef.current.removeEventListener(
        "ionViewWillLeave",
        this.ionViewWillLeaveHandler.bind(this)
      );
      forwardedRef.current.removeEventListener(
        "ionViewDidLeave",
        this.ionViewDidLeaveHandler.bind(this)
      );
      forwardedRef.current.removeEventListener(
        "ionViewForceDestroy",
        this.ionViewDidLeaveHandler.bind(this)
      );
    }
  }

  ionViewWillEnterHandler() {
    this.context.ionViewWillEnter();
  }

  ionViewDidEnterHandler() {
    this.context.ionViewDidEnter();
  }

  ionViewWillLeaveHandler() {
    this.context.ionViewWillLeave();
  }

  ionViewDidLeaveHandler() {
    this.context.ionViewDidLeave();
  }

  ionViewForceDestroyHandler() {
    const context = this.context as any;
    if (context.componentCanBeDestroyed) {
      context.componentCanBeDestroyed();
    }
  }

  render() {
    const { className, children, forwardedRef, ...rest } = this.props;
    const { ref } = this.state;
    return (
      <div
        className={className ? `ion-page ${className}` : "ion-page"}
        ref={forwardedRef as any}
        {...rest}
      >
        {ref && children}
      </div>
    );
  }
}
ViewInternal.contextType = IonLifeCycleContext;

function forwardRef(props: InternalProps, ref: React.Ref<HTMLElement>) {
  return <ViewInternal forwardedRef={ref} {...props} />;
}

export const OurView = React.forwardRef<HTMLElement, ExternalProps>(forwardRef);

import React from "react";

import { match, RouteComponentProps, withRouter } from "react-router";
import { History, Location } from "history";
import { OurNavContext } from "./OurNavContext";
import { Omit } from "./utils";

interface RouterData {
  history: History;
  location: Location;
  match: match<any>;
}

export interface PresentationContextValue {
  config: (
    history: History,
    location: Location,
    match: match<any>,
    closePath: string,
    goBack: () => void
  ) => void;
  present: (path: string, state?: any, completion?: () => void) => void;
}

export interface PresentationContextProps {
  presentationContext: PresentationContextValue;
  children?: React.ReactNode;
}
export const PresentationContext = React.createContext<
  PresentationContextValue
>(null as any);

class PresentationContextProviderImpl extends React.PureComponent<
  RouteComponentProps
> {
  router?: RouterData;
  closePath = "/close";
  isPresenting = false;
  goBack?: () => void;
  completion?: () => void;

  componentDidMount() {
    window.addEventListener("popstate", this.onPopState);
  }

  componentWillUnmount() {
    window.removeEventListener("popstate", this.onPopState);
  }

  onPopState = () => {
    if (this.goBack) {
      this.goBack();
      if (this.isPresenting) {
        this.props.history.push(this.props.location.pathname);
      }
    }
  };

  onDismiss = () => {
    this.props.history.goBack();
    setTimeout(() => {
      if (this.completion) {
        this.completion();
        this.completion = undefined;
      }
    }, 200); // matching dismiss animation duration
  };

  config = (
    history: History,
    location: Location,
    match: match<any>,
    closePath: string,
    goBack: () => void
  ) => {
    this.isPresenting = location.pathname !== this.closePath;
    if (
      !this.isPresenting &&
      this.router &&
      this.router.location.pathname !== this.closePath
    ) {
      this.onDismiss();
    }

    this.router = { history, location, match };
    this.goBack = goBack;
    this.closePath = closePath;
  };

  present = (path: string, state?: any, completion?: () => void) => {
    if (this.router) {
      this.router.history.push(path, state);
      this.props.history.push(this.props.location.pathname);
      this.completion = completion;
    }
  };

  render() {
    const { children } = this.props;
    return (
      <>
        <PresentationContext.Provider
          value={{
            config: this.config,
            present: this.present,
          }}
        >
          {children}
        </PresentationContext.Provider>
      </>
    );
  }
}

export const PresentationContextProvider = withRouter(
  PresentationContextProviderImpl
);

export function withPresentation<P extends PresentationContextProps>(
  Component: React.ComponentType<P>
): React.ComponentType<Omit<P, keyof PresentationContextProps>> {
  const Wrapped: React.FC<Omit<P, keyof PresentationContextProps>> = (
    props: Omit<P, keyof PresentationContextProps>
  ) => (
    <PresentationContext.Consumer>
      {context => <Component {...props as any} presentationContext={context} />}
    </PresentationContext.Consumer>
  );

  return Wrapped;
}

interface PresentationBridgeProps extends RouteComponentProps {
  closePath?: string;
}

const PresentationBridgeImpl: React.FC<PresentationBridgeProps> = props => {
  const bridgeContext = React.useContext(PresentationContext);
  const navContext = React.useContext(OurNavContext);
  const { history, location, match } = props;

  React.useEffect(() => {
    bridgeContext.config(
      history,
      location,
      match,
      props.closePath || "/close",
      navContext.goBack
    );
  });
  return null;
};

export const PresentationBridge = withRouter(PresentationBridgeImpl);

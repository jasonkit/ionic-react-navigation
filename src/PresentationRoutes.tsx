import React from "react";
import { IonContent } from "@ionic/react";
import { Route, Switch } from "react-router";
import { MemoryRouter } from "react-router-dom";
import { OurNavManager } from "./OurNavManager";
import { OurRouterOutlet } from "./OurRouterOutlet";
import { PresentationBridge } from "./PresentationContext";

interface Props {
  id?: string;
  closePath?: string;
}

export const PresentationRoutes: React.FC<Props> = props => {
  const { children, id } = props;
  const closePath = props.closePath || "close";

  return (
    <MemoryRouter initialEntries={["/" + closePath]}>
      <OurNavManager>
        <PresentationBridge />
        <OurRouterOutlet
          id={id}
          closePath={"/" + closePath}
          isPresentation={true}
        >
          <Switch>
            <Route
              exact={true}
              path={`/:tab(${closePath})`}
              component={PlaceholderScreen}
            />
            {children}
          </Switch>
        </OurRouterOutlet>
      </OurNavManager>
    </MemoryRouter>
  );
};

const PlaceholderScreen: React.FC = () => {
  return (
    <IonContent
      style={{
        "--background": "transparent"
      }}
    />
  );
};

import React from "react";
import "./styles.css";

export const OurTabs: React.FC = props => {
  return <div className={"ourTabsOuterContainer"}>{props.children}</div>;
};

export const OurTabsContent: React.FC = props => {
  return <div className={"ourTabsInnerContainer"}>{props.children}</div>;
};

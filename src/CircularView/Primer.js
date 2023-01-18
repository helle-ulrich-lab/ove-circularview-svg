import React from "react";
import drawDirectedPiePiece from "./drawDirectedPiePiece";
import { getInternalLabel } from "./getInternalLabel";

export default function CircularPrimer(props) {
  const {
    color = "orange",
    radius,
    arrowheadLength = 0.5,
    annotationHeight,
    totalAngle,
    id,
    labelNeedsFlip,
    ellipsizedName,
  } = props;
  const [path, textPath] = drawDirectedPiePiece({
    radius,
    annotationHeight,
    totalAngle,
    arrowheadLength,
    tailThickness: 1, //feature specific
    returnTextPath: true,
    hasLabel: ellipsizedName,
    labelNeedsFlip,
  });
  return (
    <React.Fragment>
      {getStripedPattern({ color })}
      <path
        className="vePrimer veCircularViewPrimer"
        id={id}
        strokeWidth=".5"
        stroke="black"
        fill="url(#diagonalHatch)"
        d={path.print()}
      />
      {getInternalLabel({ ...props, colorToUse: color, textPath })}
    </React.Fragment>
  );
}

function getStripedPattern({ color }) {
  return (
    <pattern
      id="diagonalHatch"
      patternUnits="userSpaceOnUse"
      width="4"
      height="4"
    >
      <path
        d="M-1,1 l2,-2
           M0,4 l4,-4
           M3,5 l2,-2"
        style={{
          stroke: color,
          strokeWidth: 2,
          fill: "blue",
          opacity: 0.4,
        }}
      />
    </pattern>
  );
}

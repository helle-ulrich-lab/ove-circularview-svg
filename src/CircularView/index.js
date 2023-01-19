import Labels from "./Labels";
import SelectionLayer from "./SelectionLayer";
import Caret from "./Caret";
import Axis from "./Axis";
import Orf from "./Orf";
import Feature from "./Feature";
import Primer from "./Primer";
import Cutsite from "./Cutsite";
import sortBy from "lodash/sortBy";
import {
  getRangeLength,
  getOverlapsOfPotentiallyCircularRanges,
  getSequenceWithinRange,
} from "ve-range-utils";
import React, { useRef, useState } from "react";
import drawAnnotations from "./drawAnnotations";
import "./style.css";
import { getOrfColor } from "../constants/orfFrameToColorMap";
import { getSingular } from "../utils/annotationTypes";
import { upperFirst, map, flatMap } from "lodash";

import { getAllSelectionLayers } from "../utils/selectionLayer";
import classNames from "classnames";
import calculateTickMarkPositionsForGivenRange from "../utils/calculateTickMarkPositionsForGivenRange";
import { AxisNumbers } from "./AxisNumbers";
import { positionCutsites } from "./positionCutsites";
import { CircularDnaSequence } from "./CircularDnaSequence";
import { normalizeAngle } from "./normalizeAngle";
// import { updateLabelsForInViewFeaturesCircView } from "../utils/updateLabelsForInViewFeaturesCircView";

function noop() {}
const BASE_RADIUS = 70;

export default function CircularView(props) {
  let [_zoomLevel] = useState(1);

  if (props.circ_zoomLevel !== undefined) {
    //override from the editor to not lose the state when the Circular View component isn't rendered
    _zoomLevel = props.circ_zoomLevel;
  }
  const { sequenceData = {} } = props;
  const { sequence = "atgc" } = sequenceData;
  const sequenceLength = sequence.length;

  const hasZoomableLength = sequenceLength >= 50;
  const hasRotateableLength = sequenceLength >= 10;
  if (!hasZoomableLength) _zoomLevel = 1;
  const circRef = useRef();
  const rotateHelper = useRef({});

  let zoomLevel = _zoomLevel;

  let smallZoom = 1;
  if (_zoomLevel < 1) {
    smallZoom = _zoomLevel;
    zoomLevel = 1;
  }

  const {
    //set defaults for all of these vars
    width = 400,
    height = 400,
    noRedux,
    readOnly,
    hideName = false,
    editorName,
    smartCircViewLabelRender,
    showCicularViewInternalLabels,
    withZoomCircularView,
    selectionLayer = { start: -1, end: -1 },
    annotationHeight = 15,
    spaceBetweenAnnotations = 2,
    annotationVisibility = {},
    annotationLabelVisibility = {},
    caretPosition = -1,

    searchLayers = [],
    additionalSelectionLayers = [],
    searchLayerRightClicked = noop,
    selectionLayerRightClicked = noop,
    searchLayerClicked = noop,
    labelLineIntensity,
    fontHeightMultiplier,
    hoveredId,
    labelSize,
    nameFontSizeCircularView = 14,
  } = props;

  const sequenceName = hideName ? "" : sequenceData.name || "";
  let annotationsSvgs = [];
  let labels = {};

  const { isProtein } = sequenceData;

  const svgWidth = Math.max(Number(width) || 300);
  const svgHeight = Math.max(Number(height) || 300);
  const isZoomedIn = zoomLevel !== 1;
  let radius = BASE_RADIUS;

  let rangeToShowLength = sequenceLength;
  let rangeToShow = { start: 0, end: Math.max(sequenceLength - 1, 0) };
  let visibleAngleRange;
  const innerRadius = radius - 10;
  const initialRadius = radius;
  const showSeq = isZoomedIn && rangeToShowLength < 140;
  const showSeqText = rangeToShowLength < 80;

  //RENDERING CONCEPTS:
  //-"Circular" annotations get a radius, and a curvature based on their radius:
  //<CircularFeature>
  //-Then we rotate the annotations as necessary (and optionally flip them):
  //<PositionAnnotationOnCircle>

  const layersToDraw = [
    { zIndex: 10, layerName: "sequenceChars" },
    {
      zIndex: 20,
      layerName: "features",
      isAnnotation: true,
      // spaceBefore: 10,
      spaceAfter: 5,
    },

    ...(annotationVisibility.axis
      ? [
          {
            layerName: "axisNumbers",
            annotationType: "axisNumbers",
            Annotation: AxisNumbers,
            isAnnotation: true,
            noTitle: true,
            noHover: true,
            annotations: calculateTickMarkPositionsForGivenRange({
              increaseOffset: true,
              range: rangeToShow,
              tickSpacing:
                rangeToShowLength < 10
                  ? 2
                  : rangeToShowLength < 50
                  ? Math.ceil(rangeToShowLength / 25) * 5
                  : Math.ceil(rangeToShowLength / 100) * 10,
              sequenceLength,
              isProtein,
            }).map((pos) => {
              return {
                name: "Tick Mark",
                tickPosition: pos,
                start: pos,
                end: pos,
              };
            }),
            annotationProps: {
              hideTicks: !annotationVisibility.axis,
              hideNumbers: !annotationVisibility.axisNumbers,
            },
            useCenter: true,

            passAnnotation: true,
            allOnSameLevel: true,
            addHeight: true,
            alwaysShow: true,
            showLabels: false,
            spaceBefore: 0,
            spaceAfter: 0,
          },
          {
            zIndex: 0,
            layerName: "axis",
            Annotation: Axis,
            spaceBefore: 10,
            spaceAfter: 5,
          },
        ]
      : []),
    {
      zIndex: 10,
      layerName: "cutsites",
      fontStyle: "italic",
      Annotation: Cutsite,
      hideAnnotation: showSeqText,
      useStartAngle: true,
      allOnSameLevel: true,
      positionBy: positionCutsites,
      isAnnotation: true,
    },
    ...(showSeq && annotationVisibility.sequence
      ? [
          {
            layerName: "dnaSequences",
            annotationType: "dnaSequences",
            noTitle: true,
            Annotation: CircularDnaSequence,
            isAnnotation: true,
            annotationProps: {
              showReverseSequence: annotationVisibility.reverseSequence,
              showDnaColors: annotationVisibility.dnaColors,
              showSeqText,
            },
            noHover: true,
            annotations: getSequenceWithinRange(rangeToShow, sequence)
              .split("")
              .map((letter, i) => {
                const pos = rangeToShow.start + i;
                return {
                  className: `ve-dna-letter-${pos}`,
                  start: pos,
                  end: pos,
                  letter,
                };
              }),
            useCenter: true,
            passAnnotation: true,
            allOnSameLevel: true,
            addHeight: true,
            alwaysShow: true,
            showLabels: false,
            spaceBefore: 5,
            spaceAfter: annotationVisibility.reverseSequence ? 20 : 5,
          },
        ]
      : []),
    {
      zIndex: 15,
      alwaysShow: true,
      layerName: "caret",
      Annotation: drawCaret,
      drawProps: ({ radius }) => ({
        radius: initialRadius - annotationHeight / 2,
        annotationHeight: radius - initialRadius,
      }),
    },

    {
      zIndex: 10,
      alwaysShow: true,
      layerName: "selectionLayer",
      Annotation: drawSelectionLayer,
      drawProps: ({ radius }) => ({
        radius:
          initialRadius + (radius - initialRadius) / 2 - annotationHeight / 2,
        annotationHeight: radius - initialRadius,
      }),
    },
    {
      zIndex: 20,
      layerName: "replacementLayers",
      isAnnotation: true,
      spaceAfter: 20,
    },
    {
      zIndex: 20,
      layerName: "deletionLayers",
      isAnnotation: true,
      spaceAfter: 20,
    },

    {
      zIndex: 20,
      Annotation: Orf,
      showLabels: false,
      getColor: getOrfColor,
      layerName: "orfs",
      isAnnotation: true,
      spaceBefore: 10,
    },
    {
      spaceBefore: 10,
      spaceAfter: 5,
      zIndex: 20,
      Annotation: Primer,
      isAnnotation: true,
      layerName: "primers",
    },
    {
      zIndex: 20,
      layerName: "parts",
      isAnnotation: true,
      spaceBefore: 15,
    },
    {
      zIndex: 20,
      layerName: "lineageAnnotations",
      isAnnotation: true,
      spaceBefore: 10,
      spaceAfter: 5,
    },
    {
      zIndex: 20,
      layerName: "assemblyPieces",
      isAnnotation: true,
      spaceBefore: 10,
      spaceAfter: 5,
    },
    {
      zIndex: 20,
      layerName: "warnings",
      isAnnotation: true,
      spaceBefore: 10,
      spaceAfter: 5,
    },
    {
      zIndex: 30,
      alwaysShow: true,
      layerName: "labels",
      Annotation: Labels,
      circularViewWidthVsHeightRatio: width / height,
      passLabels: true,
      labelLineIntensity: labelLineIntensity,
      labelSize: labelSize,
      fontHeightMultiplier: fontHeightMultiplier,
      textScalingFactor: 700 / Math.min(width, height),
    },
  ];
  const output = layersToDraw
    .map((layer) => {
      const {
        layerName,
        maxToDisplay,
        Comp,
        Annotation,
        fontStyle,
        alwaysShow,
        isAnnotation,
        spaceBefore = 0,
        spaceAfter = 0,
        zIndex,
        passLabels,
        drawProps,
        noTitle,
        ...rest
      } = layer;
      if (!(alwaysShow || annotationVisibility[layerName])) {
        return null;
      }
      //DRAW FEATURES
      let comp;
      let results;

      const singularName = getSingular(layerName);
      const nameUpper = upperFirst(layerName);
      radius += spaceBefore;

      const sharedProps = {
        radius,
        innerRadius: BASE_RADIUS,
        outerRadius: radius,
        noRedux,
        isProtein,
        smartCircViewLabelRender,
        extraSideSpace: Math.max(0, width - height),
        onClick: props[singularName + "Clicked"],
        onDoubleClick: props[singularName + "DoubleClicked"],
        onRightClicked: props[singularName + "RightClicked"],
        sequenceLength,
        editorName,
        showCicularViewInternalLabels,
        ...(drawProps && drawProps({ radius })),
        ...rest,
      };
      if (isAnnotation) {
        //we're drawing features/cutsites/primers/orfs/etc (something that lives on the seqData)
        if (!map(sequenceData[layerName]).length && !alwaysShow) {
          radius -= spaceBefore;
          return null;
        }

        const trimmedAnnotations = flatMap(
          layer.annotations ||
            sequenceData["filtered" + nameUpper] ||
            sequenceData[layerName] ||
            [],
          (range) => {
            const overlapOfRanges = getOverlapsOfPotentiallyCircularRanges(
              range,
              rangeToShow,
              sequenceLength,
              true
            );
            if (!overlapOfRanges || !overlapOfRanges.length) return [];
            return { ...range };
          }
        );

        results = drawAnnotations({
          readOnly,
          noTitle,
          visibleAngleRange,
          isZoomedIn,
          Annotation: Annotation || Comp || Feature,
          fontStyle: fontStyle,
          hoveredId: hoveredId,
          annotationType: singularName,
          type: singularName,
          reverseAnnotations: true,
          showLabels: !(annotationLabelVisibility[layerName] === false),
          annotations: trimmedAnnotations,
          annotationHeight,
          spaceBetweenAnnotations,
          ...sharedProps,
          ...props[singularName + "Options"],
        });
      } else {
        //we're drawing axis/selectionLayer/labels/caret/etc (something that doesn't live on the seqData)
        results = Annotation({
          ...(passLabels && { labels }),
          ...sharedProps,
        });
      }
      if (results) {
        // //update the radius, labels, and svg
        radius += results.height || 0;
        //tnr: we had been storing labels as a keyed-by-id object but that caused parts and features with the same id to override eachother
        labels = [...map(labels), ...map(results.labels || {})];
        comp = results.component === undefined ? results : results.component;
      }
      radius += spaceAfter;
      // console.warn('radius after draw:',JSON.stringify(radius,null,4))
      return {
        result: comp,
        zIndex,
      };
    })
    .filter(function (i) {
      return !!i;
    });

  annotationsSvgs = sortBy(output, "zIndex").reduce(function (arr, { result }) {
    return arr.concat(result);
  }, []);

  function drawSelectionLayer() {
    //DRAW SELECTION LAYER
    return getAllSelectionLayers({
      additionalSelectionLayers,
      searchLayers,
      selectionLayer,
    })
      .map(function (selectionLayer, index) {
        if (
          selectionLayer.start >= 0 &&
          selectionLayer.end >= 0 &&
          sequenceLength > 0
        ) {
          return (
            <SelectionLayer
              {...{
                index,
                isDraggable: true,
                isProtein,
                key: "veCircularViewSelectionLayer" + index,
                selectionLayer,
                onRightClicked: selectionLayer.isSearchLayer
                  ? searchLayerRightClicked
                  : selectionLayerRightClicked,
                onClick: selectionLayer.isSearchLayer
                  ? searchLayerClicked
                  : undefined,
                sequenceLength,
                baseRadius: BASE_RADIUS,
                radius,
                innerRadius,
              }}
            />
          );
        } else {
          return null;
        }
      })
      .filter((el) => {
        return !!el;
      });
  }

  function drawCaret() {
    //DRAW CARET
    if (
      caretPosition !== -1 &&
      selectionLayer.start < 0 &&
      sequenceLength >= 0
    ) {
      //only render if there is no selection layer
      return (
        <Caret
          {...{
            caretPosition,
            sequenceLength,
            isProtein,
            innerRadius,
            outerRadius: radius,
            key: "veCircularViewCaret",
          }}
        />
      );
    }
  }

  //tnr: Make the radius have a minimum so the empty yellow axis circle doesn't take up the entire screen
  if (radius < 150) radius = 150;
  const widthToUse = Math.max(Number(width) || 300);
  const heightToUse = Math.max(Number(height) || 300);
  const bpTitle = isProtein
    ? `${Math.floor(sequenceLength / 3)} AAs`
    : `${sequenceLength} bps`;
  const nameEl = (
    <div
      className="veSequenceName"
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        display: "flex",
        justifyContent: "center",
        alignItems: isZoomedIn || smallZoom < 1 ? "end" : "center",
        paddingLeft: isZoomedIn || smallZoom < 1 ? 20 : 0,
        paddingRight: isZoomedIn || smallZoom < 1 ? 20 : 0,
        textAlign: "center",

        zIndex: 1,
      }}
    >
      <div style={{ marginBottom: isZoomedIn || smallZoom < 1 ? 80 : 0 }}>
        <div
          title={sequenceName}
          className="veCircularViewTextWrapper"
          style={{
            textAlign: "center",
            display: "-webkit-box",
            WebkitLineClamp: "3",
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            width: isZoomedIn || smallZoom < 1 ? undefined : innerRadius,
            maxHeight: innerRadius - 15,
            fontSize: nameFontSizeCircularView,
          }}
        >
          {sequenceName}
        </div>
        <span title={bpTitle} style={{ fontSize: 10 }}>
          {bpTitle}
        </span>
      </div>
    </div>
  );

  const target = React.useRef();

  return (
    <div
      style={{
        width: widthToUse,
        height: heightToUse,
        position: "relative",
        overflow: "hidden",
      }}
      onWheel={
        withZoomCircularView && hasRotateableLength
          ? (e) => {
              let delta = e.deltaY;
              if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) {
                delta = e.deltaX;
              }
              rotateHelper.current.triggerChange &&
                rotateHelper.current.triggerChange(({ changeValue, value }) => {
                  changeValue(
                    (normalizeAngle(((value + delta / 4) * Math.PI) / 180) /
                      Math.PI) *
                      180
                  );
                });

              e.stopPropagation();
            }
          : undefined
      }
      className={classNames("veCircularView", props.className)}
    >
      {!hideName && isZoomedIn && nameEl}

      <div ref={withZoomCircularView && hasZoomableLength ? target : undefined}>
        <svg
          key="circViewSvg"
          style={{
            overflow: "visible",
            display: "block",
          }}
          className="circularViewSvg"
          viewBox={
            isZoomedIn
              ? `${-svgWidth / 2 / smallZoom},${
                  -svgHeight / 2 / smallZoom -
                  (!isZoomedIn ? 0 : initialRadius + BASE_RADIUS * 2 - 100)
                },${svgWidth / smallZoom},${svgHeight / smallZoom}`
              : `-${radius} -${radius} ${radius * 2} ${radius * 2}`
          }
          width={svgWidth}
          height={svgHeight}
        >
          <g>
            {/* {isZoomedIn && (
                
              )} */}
            <circle
              ref={circRef}
              r={radius}
              style={{ opacity: 0, zIndex: -1 }}
              className="veHiddenAxis"
            ></circle>
            {annotationsSvgs}
            {!hideName && !isZoomedIn && (
              <foreignObject
                x={-72.5 / 2}
                y={-72.5 / 2}
                width={72.5}
                height={72.5}
              >
                <div
                  xmlns="http://www.w3.org/1999/xhtml"
                  key="circViewSvgCenterText"
                  className="veCircularViewMiddleOfVectorText"
                >
                  <div
                    title={sequenceName}
                    className="veCircularViewTextWrapper"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: "3",
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      width: 72.5,
                      maxHeight: 72.5 - 15,
                      fontSize: nameFontSizeCircularView,
                    }}
                  >
                    {sequenceName}
                  </div>
                  <span title={bpTitle} style={{ fontSize: 10 }}>
                    {bpTitle}
                  </span>
                </div>
              </foreignObject>
            )}
          </g>
        </svg>
        {/* <VeTopRightContainer {...{ fullScreen }}>
            {!circular && !noWarnings && (
              <VeWarning
                key="ve-warning-circular-to-linear"
                data-test="ve-warning-circular-to-linear"
                intent="warning"
                tooltip={
                  "Warning! You're viewing a linear sequence in the Circular Map. Click on 'Linear Map' to view the linear sequence in a more intuitive way."
                }
              />
            )}
            {!noWarnings && paredDownMessages}
            {isZoomedIn && (
              <CircularZoomMinimap
                rotationRadians={rotationRadians}
                percentOfCircle={percentOfCircle}
              ></CircularZoomMinimap>
            )}
          </VeTopRightContainer> */}
      </div>
    </div>
  );
}

export function pareDownAnnotations(annotations, max) {
  let annotationsToPass = annotations;
  let paredDown = false;
  if (Object.keys(annotations).length > max) {
    paredDown = true;
    const sortedAnnotations = sortBy(annotations, function (annotation) {
      return -getRangeLength(annotation);
    });
    annotationsToPass = sortedAnnotations
      .slice(0, max)
      .reduce(function (obj, item) {
        obj[item.id] = item;
        return obj;
      }, {});
  }
  return [annotationsToPass, paredDown];
}

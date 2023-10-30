import React from "react";
import { tidyUpSequenceData } from "ve-sequence-utils";

import "./App.css";
import CircularView from "./CircularView";

function App() {
  const editorProps = {
    editorName: "DemoEditor",
    isFullscreen: true,
    showMenuBar: true,
  };

  return (
    <div>
      <CircularView
        {...{
          ...editorProps,
          annotationVisibility: {
            featureTypesToHide: {},
            featureIndividualToHide: {},
            partIndividualToHide: {},
            features: true,
            warnings: true,
            assemblyPieces: true,
            chromatogram: true,
            lineageAnnotations: true,
            translations: true,
            parts: true,
            orfs: false,
            orfTranslations: false,
            cdsFeatureTranslations: true,
            axis: true,
            cutsites: true,
            // cutsites: true,
            cutsitesInSequence: true,
            primers: true,
            dnaColors: false,
            sequence: true,
            reverseSequence: true,
            fivePrimeThreePrimeHints: true,
            axisNumbers: true,
          },
          sequenceData: tidyUpSequenceData({
            circular: true,
            name: "Some Test Seq",
            sequence:
              "gtagagagagagtgagcccgacccccgtagagagagagtgagcccgacccccgtagagagagagtgagcccgacccccgtagagagagagtgagcccgaccccc",
            features: [
              {
                id: "2oi452",
                name: "I'm a feature :)",
                type: "CDS",
                start: 10,
                end: 20,
              },
              {
                id: "2oi452123",
                type: "misc_feature",
                name: "wahoo",
                start: 15,
                end: 90,
              },
            ],
          }),
        }}
      />
    </div>
  );
}

export default App;

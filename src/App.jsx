import * as React from "react";
import { genbankToJson } from '@teselagen/bio-parsers';
import CircularView from "./CircularView/index.js";
import fs from "fs";
import path from "path";

const editorProps = {
  editorName: "DemoEditor",
  isFullscreen: true,
  showMenuBar: true,
};

export default function App({ plasmidFilePath }) {
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
            warnings: false,
            assemblyPieces: true,
            chromatogram: true,
            lineageAnnotations: true,
            translations: false,
            parts: true,
            orfs: false,
            orfTranslations: false,
            cdsFeatureTranslations: true,
            axis: true,
            cutsites: false,
            cutsitesInSequence: false,
            primers: false,
            dnaColors: false,
            sequence: true,
            reverseSequence: true,
            fivePrimeThreePrimeHints: true,
            axisNumbers: true,
          },
          sequenceData: genbankToJson(fs.readFileSync(path.resolve(plasmidFilePath)).toString(), {})[0]['parsedSequence'],
        }}
      />
    </div>
  );
}
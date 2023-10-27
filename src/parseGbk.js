
import CircularView from "./CircularView/index.js";
import { genbankToJson } from '@teselagen/bio-parsers';
import * as fs from 'fs';
import * as reactHelper from 'react-helper';
import { renderToString } from 'react-dom/server'

var plasmidData = fs.readFileSync("./pHU6067.gbk").toString();
var parsedSequence = genbankToJson(plasmidData, {});
console.log(parsedSequence[0]['parsedSequence']);

const editorProps = {
    editorName: "DemoEditor",
    isFullscreen: true,
    showMenuBar: true,
  };

// var plasmidView = CircularView(
//         {...{
//           ...editorProps,
//           annotationVisibility: {
//             featureTypesToHide: {},
//             featureIndividualToHide: {},
//             partIndividualToHide: {},
//             features: true,
//             warnings: true,
//             assemblyPieces: true,
//             chromatogram: true,
//             lineageAnnotations: true,
//             translations: true,
//             parts: true,
//             orfs: false,
//             orfTranslations: false,
//             cdsFeatureTranslations: true,
//             axis: true,
//             cutsites: true,
//             // cutsites: true,
//             cutsitesInSequence: true,
//             primers: true,
//             dnaColors: false,
//             sequence: true,
//             reverseSequence: true,
//             fivePrimeThreePrimeHints: true,
//             axisNumbers: true,
//           },
//           sequenceData: seqData[0]["parsedSequence"]
//         }}
//   );

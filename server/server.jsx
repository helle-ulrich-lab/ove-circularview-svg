import path from "path";
import fs from "fs";
import React from "react";
import ReactDOMServer from "react-dom/server";
import express from "express";

import App from "../src/App";

const PORT = process.env.PORT || 3000;
const app = express();

app.get("/", (req, res) => {

  fs.readFile(path.resolve("./public/plasmidMap.svg"), "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("An error occurred");
    }

    // Extract the SVG element from the rendered circular view
    circularViewHtml = ReactDOMServer.renderToString(<App params={req.query} />);
    const svgStartPos = circularViewHtml.indexOf("<svg ") + "<svg ".length;
    const svgEndPos = circularViewHtml.indexOf("</svg>") + "<svg>".length + 1;
    let svgElement = "<svg id='plasmidMap' " + circularViewHtml.substring(svgStartPos, svgEndPos).trim();
    
    // Include css directly into the svg element
    const css = '<style type="text/css">' + fs.readFileSync(path.resolve("build/server.css")).toString() + '</style>';
    svgElement = svgElement.substring(0, svgElement.length - 6) + css + svgElement.substring(svgElement.length - 6);

    return res.send(
      data.replace(
        "<svg id='plasmidMap'></svg>",
        svgElement
      )
    );
  });
});

app.use(
  express.static(path.resolve(__dirname, ".", "dist"), { maxAge: "30d" })
);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

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

  // Get path to the gbk file from the list of GET parameters 
  plasmidFilePath = req.query.plasmidFilePath;

  // Extract the SVG element from the rendered circular view
  circularViewHtml = ReactDOMServer.renderToString(<App plasmidFilePath={plasmidFilePath} />);
  var startPos = circularViewHtml.indexOf("<svg ") + "<svg ".length;
  var endPos = circularViewHtml.indexOf("</svg>") + "<svg>".length + 1;
  var svgElement = "<svg id='plasmidMap' " + circularViewHtml.substring(startPos, endPos).trim();

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

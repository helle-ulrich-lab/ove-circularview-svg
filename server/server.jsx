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

  plasmidFilePath = req.query.plasmidFilePath;

  circularViewHtml = ReactDOMServer.renderToString(<App plasmidFilePath={plasmidFilePath} />);
  var startPos = circularViewHtml.indexOf("<svg ");
  var endPos = circularViewHtml.indexOf("</svg>") + "<svg>".length + 1;
  var svgElement = circularViewHtml.substring(startPos, endPos).trim();

    return res.send(
      data.replace(
        '<svg></svg>',
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

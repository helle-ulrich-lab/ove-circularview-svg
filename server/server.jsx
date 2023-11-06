import path from "path";
import fs from "fs";
import React from "react";
import ReactDOMServer from "react-dom/server";
import express from "express";

import App from "../src/App";

const PORT = process.env.PORT || 3000;
const app = express();

app.get("/", (req, res) => {

  fs.readFile(path.resolve("./public/plasmidMap.svg"), "utf8", (error, data) => {
    
    if (error) {
      return res.status(500).send("An error occurred");
    }

    try {

      // Extract the SVG element from the rendered circular view
      circularViewHtml = ReactDOMServer.renderToString(<App params={req.query} />);
      const svgStartPos = circularViewHtml.indexOf('<svg') + '<svg'.length;
      const svgEndPos = circularViewHtml.indexOf("</svg>") + "</svg>".length;
      let svgElement = '<svg id="plasmidMap" ' + circularViewHtml.substring(svgStartPos, svgEndPos).trim();

      // Download file rather than displaying it
      res.attachment(`${req.query.plasmidTitle ? req.query.plasmidTitle : 'plasmid'}.html`);
      res.type('html');

      return res.send(
        data.replace(
          "<svg id='plasmidMap'></svg>",
          svgElement
        )

      );
    } catch (error) {
      return res.status(500).send("An error occurred");
    }
  });
});

app.use(
  express.static(path.resolve(__dirname, ".", "dist"), { maxAge: "30d" })
);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

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
    const svgStartPos = circularViewHtml.indexOf('<svg style="overflow:visible;display:block" ') + '<svg style="overflow:visible;display:block" '.length;
    const svgEndPos = circularViewHtml.indexOf("</svg>") + "<svg>".length + 1;
    const style = 'style="overflow:visible;display:block;text-align:center;' +
                  'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,' +
                  'Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,' + 
                  'Helvetica Neue,sans-serif" ';
    let svgElement = '<svg id="plasmidMap" ' + style + circularViewHtml.substring(svgStartPos, svgEndPos).trim();

    // Get rid of hand pointers when hovering over a feature
    svgElement = svgElement.replaceAll('style="cursor:pointer" ', '');

    // Get rid of titles
    svgElement = svgElement.replaceAll(/<title.*>[\s\S]*?<\/title>/ig, '');

    // Download file rather than displaying it
    res.attachment('plasmid.svg');
    res.type('xml');

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

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("react");

var _react2 = _interopRequireDefault(_react);


var _CircularView = require("./CircularView");

var _CircularView2 = _interopRequireDefault(_CircularView);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function App() {
  var editorProps = {
    editorName: "DemoEditor",
    isFullscreen: true,
    showMenuBar: true
  };

  return _react2.default.createElement(
    "div",
    null,
    _react2.default.createElement(_CircularView2.default, null)
  );
}

exports.default = App;

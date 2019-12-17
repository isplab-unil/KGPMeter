"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var standardNodeButtons = ["add-relative", "remove-node", "toggle-dna", "set-as-target"];
var targetNodeButtons = ["add-relative"];
var youNodeButtons = ["add-relative", "change-sex", "toggle-dna", "set-as-target"];
var youTargetNodeButtons = ["add-relative", "change-sex"];

/**
 * Singleton class to handle buttons for a given node
 *
 */

var NodeButtonsGroup = function () {
  /**
   *
   * @param {d3-selection} motherGroup a d3-selection containing the <g> group where the tree will be drawn (=familyTreeArtist.svgg)
   * @param {string} DOMid an id for the node buttons'<g> mother tag
   */
  function NodeButtonsGroup(motherGroup) {
    var DOMid = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "nodeg-action-buttons";

    _classCallCheck(this, NodeButtonsGroup);

    this.DOMid = DOMid;
    this.currentNode = undefined;
    this.buttons = {};
    this.onWakeCallbacks = [];
    this.onHideCallbacks = [];

    // ensure there is only 1 NodeButtonsGroup on svg
    d3.select("#" + this.DOMid).remove();
    this.g = motherGroup.append("g").attr("id", this.DOMid);

    // add a circle hitbox as trigger for nodeButtons mouseleave
    this.g.append("circle").attr("r", kgp.indiNodeSize.width / 2 + 10).attr("fill", "none").attr("stroke-width", "20px").attr("stroke", "white").attr("stroke-opacity", 0);
  }

  /**
   * Wake the node buttons for a given node
   *
   * @param {Object} node a node of the family tree with a "buttons" property.
   */


  _createClass(NodeButtonsGroup, [{
    key: "wake",
    value: function wake(node) {
      this.hide();
      this.currentNode = node;
      this.g.attr("transform", "translate(" + node.x + "," + node.y + ")").attr("visibility", "visible").datum(node);
      this.g.node().parentNode.appendChild(this.g.node());
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = node.buttons[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var btn = _step.value;

          this.buttons[btn].attr("visibility", "visible").datum(node);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this.onWakeCallbacks.forEach(function (cb) {
        return cb(node);
      });
    }

    /**
     * Hide the node buttons
     */

  }, {
    key: "hide",
    value: function hide() {
      this.g.attr("visibility", "hidden");
      for (var btn in this.buttons) {
        this.buttons[btn].attr("visibility", "hidden");
      }
      var node = this.currentNode;
      this.onHideCallbacks.forEach(function (cb) {
        return cb(node);
      });
    }

    /**
     * Creates the button svg, including circle, Font-Awesome logo and tooltip
     *
     * @param {string} buttonName the unique reference name for that button
     * @param {int} x the button x position, relative to node center
     * @param {int} y the button y position, relative to node center
     * @param {string} FAunicode the button's Font-Awesome logo unicode code
     * @param {int} options.FAx FAunicode's x position, relative to button position, defaults to -13
     * @param {int} options.FAy FAunicode's y position, relative to button position, defaults to 6
     * @param {int} options.tooltipx tooltip's x position, relative to button position, defaults to 24
     * @param {int} options.tooltipy tooltip's y position, relative to button position, defaults to -22
     * @param {int} tooltipWidth tooltip svg <text> tag width
     * @param {int} tooltipHeight  tooltip svg <text> tag height (most often 45)
     * @param {string} i18nKey the i18n key of the text for the tooltip
     */

  }, {
    key: "addButton",
    value: function addButton(buttonName, x, y, FAunicode, tooltipWidth, tooltipHeight, i18nKey) {
      var options = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : {};

      var defaultSettings = {
        FAx: -13, FAy: 6, tooltipx: 24, tooltipy: -22
      };

      var button = this.g.append("g").attr("transform", "translate(" + x + "," + y + ")").attr("style", "cursor:pointer;").classed("button-with-tooltip", true);
      button.append("circle").attr("r", 20).classed("node-button-circle", true);
      button.append("text").attr("class", "fas node-button-fas").attr("x", options.FAx ? options.FAx : defaultSettings.FAx).attr("y", options.FAy ? options.FAy : defaultSettings.FAy).text(FAunicode);
      button.append("foreignObject").attr("x", options.tooltipx ? options.tooltipx : defaultSettings.tooltipx).attr("y", options.tooltipy ? options.tooltipy : defaultSettings.tooltipy).attr("width", tooltipWidth).attr("height", tooltipHeight).classed("tooltip", true).append("xhtml:div").append("span").classed("tooltip-text", true).attr(i18n.keyAttr, i18nKey);

      this.buttons[buttonName] = button;
      return button;
    }
  }]);

  return NodeButtonsGroup;
}();
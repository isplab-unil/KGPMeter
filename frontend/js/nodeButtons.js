"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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

function createNodeButtons(svgg) {
  //nodeButtons.onWakeCallbacks.push(removeAddRelativeMenu)

  // TODO: this is not super clean, in the future improve the architecture of addRelativeMenu()
  var addRelativeMenu = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(node) {
      var canAddChildren, canAddParents, canAddMother, canAddFather, spouseMissing, FOw, FOh, FOx, FOy, hitboxMargin, addRelativeHitbox, addRelativeFO, addRelativeDiv, _addAddRelativeSpan;

      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _addAddRelativeSpan = function _addAddRelativeSpan(relative, addRelative) {
                addRelativeDiv.append("span").attr(i18n.keyAttr, "node-name-" + relative).on("click", function (node) {
                  var relativeNode = addRelative(node);
                  relativeNode.i18nName = kgp.relationToYou(node.i18nName, relative);
                  familyTreeArtist.update(node);
                  nodeButtons.hide();
                  addRelativeHitbox.remove();
                  saveFamilyTreeToLocalStorage();
                });
              };

              //fix: node doesn't propagate to circle
              node = nodeButtons.g.datum();
              removeAddRelativeMenu();

              // can only add children/parents if tree not too deep
              canAddChildren = node.depth < kgp.maxFamilyTreeDepth - 1;
              canAddParents = ftree.maxDepth < kgp.maxFamilyTreeDepth - 1 || node.depth != 0;
              canAddMother = (!node.famc || !node.famc.wife) && canAddParents;
              canAddFather = (!node.famc || !node.famc.husb) && canAddParents;
              spouseMissing = !node.fams || node.fams.length == 0 || !node.fams[0].husb || !node.fams[0].wife;
              // FO stands for foreignObject

              FOw = 100;
              FOh = ((canAddChildren ? 2 : 0) + canAddMother + canAddFather + spouseMissing) * 26;
              FOx = 20;
              FOy = -(FOh / 2);
              hitboxMargin = 20;

              // hitbox so that menu doesn't disappear unexpectedly

              addRelativeHitbox = addRelativeButton.append("path").classed("add-relatives-hitbox", true).attr("d", " M" + (FOx - 2 * hitboxMargin) + " " + -hitboxMargin + " L" + FOx + " " + (FOy - hitboxMargin) + " L" + (FOx + FOw + hitboxMargin) + " " + (FOy - hitboxMargin) + " L" + (FOx + FOw + hitboxMargin) + " " + (-FOy + hitboxMargin) + " L" + FOx + " " + (-FOy + hitboxMargin) + " L" + (FOx - 2 * hitboxMargin) + " " + hitboxMargin + " Z").attr("fill", "red").attr("opacity", 0);
              addRelativeFO = addRelativeButton.append("foreignObject").classed("add-relatives-fo", true).attr("x", FOx + "px").attr("y", FOy + "px").attr("width", FOw + 10 + "px").attr("height", FOh + 10 + "px");
              addRelativeDiv = addRelativeFO.append("xhtml:div").attr("style", "cursor:pointer;").classed("add-relatives-list", true).on("mouseleave.hitbox", removeAddRelativeMenu);


              if (canAddMother) {
                _addAddRelativeSpan("mother", function (d) {
                  return ftree.addParent("", "F", d.id);
                }, true);
              }
              if (canAddFather) {
                _addAddRelativeSpan("father", function (d) {
                  return ftree.addParent("", "M", d.id);
                }, true);
              }
              if (spouseMissing & node.sex == "M") {
                _addAddRelativeSpan("partner", function (d) {
                  return ftree.addSpouse("", d.id);
                }, true);
              }
              if (spouseMissing & node.sex == "F") {
                _addAddRelativeSpan("partner", function (d) {
                  return ftree.addSpouse("", d.id);
                }, true);
              }
              if (canAddChildren) {
                _addAddRelativeSpan("daughter", function (d) {
                  return ftree.addChild("", "F", d.id, false);
                }, true);
              }
              if (canAddChildren) {
                _addAddRelativeSpan("son", function (d) {
                  return ftree.addChild("", "M", d.id, false);
                }, true);
              }

            case 22:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function addRelativeMenu(_x3) {
      return _ref.apply(this, arguments);
    };
  }();

  // ------------------------ Toggle your sex Button ------------------------


  var nodeButtons = new NodeButtonsGroup(svgg);

  // ------------------------ remove node button ------------------------
  function removeNode(node) {
    ftree.deleteNode(node.id, kgp.youNodeId);
    nodeButtons.hide();
    kgpMeterScoreRequestHandler.requestScore(kgp.target ? kgp.target.id : "", ftree.getLinksAsIds(), ftree.nodesArray().filter(function (n) {
      return n.sequencedDNA;
    }).map(function (n) {
      return n.id;
    }), kgp.userId, kgp.userSource, i18n.lng);
    familyTreeArtist.update();
    saveFamilyTreeToLocalStorage();
  }

  nodeButtons.addButton("remove-node", 25, -50, "\uF506", "80px", "50px", "hint-delete-node").on("click.remove", removeNode);

  // ------------------------ toggle DNA sequencing button ------------------------


  // HOW TO HANDLE +-: d =>'\uf471'+(d.sequencedDNA?"-":"+") IN OLD CODE?
  var toggleDNAbutton = nodeButtons.addButton("toggle-dna", 25, 50, "\uF471+", "170px", "70px", "hint-sequence-node").on("click.sequenced-dna", toggleDNA);
  function toggleDnaButtonText(node) {
    toggleDNAbutton.select("text").node().innerHTML = "\uF471" + (node.sequencedDNA ? "-" : "+");
  }
  nodeButtons.onWakeCallbacks.push(toggleDnaButtonText);

  function toggleDNA(node) {
    node.sequencedDNA = !node.sequencedDNA;
    toggleDnaButtonText(node);
    d3.select("#" + FamilyTreeArtist.nodeGroupId(node.id) + " .dna-logo").classed("invisible-dna", !node.sequencedDNA);
    kgpMeterScoreRequestHandler.requestScore(kgp.target ? kgp.target.id : "", ftree.getLinksAsIds(), ftree.nodesArray().filter(function (n) {
      return n.sequencedDNA;
    }).map(function (n) {
      return n.id;
    }), kgp.userId, kgp.userSource, i18n.lng);
    saveFamilyTreeToLocalStorage();
  }

  // ------------------------ set as target button ------------------------
  function setAsTarget(node) {
    selectTarget(node);
    nodeButtons.hide();
    kgpMeterScoreRequestHandler.requestScore(kgp.target ? kgp.target.id : "", ftree.getLinksAsIds(), ftree.nodesArray().filter(function (n) {
      return n.sequencedDNA;
    }).map(function (n) {
      return n.id;
    }), kgp.userId, kgp.userSource, i18n.lng);
    saveFamilyTreeToLocalStorage();
  }

  nodeButtons.addButton("set-as-target", -50, 0, "\uF05B", "120px", "45px", "change-target", {
    FAx: -10, FAy: 7,
    tooltipx: "-144px"
  }).on("click.set-as-target", setAsTarget);

  // ------------------------ add relatives button ------------------------
  var addRelativeButton = nodeButtons.addButton("add-relative", 50, 0, "\uF234", 0, 0, undefined, {
    FAx: -10, FAy: 6,
    tooltipx: 0, tooltipy: 0
  });

  addRelativeButton.select("circle").on("mouseover.addRelative", addRelativeMenu);
  addRelativeButton.select("text").on("mouseover.addRelative", addRelativeMenu);
  // correctly remove add relative menu on hide&wake
  function removeAddRelativeMenu() {
    //setTimeout(d => {
    addRelativeButton.select(".add-relatives-fo").remove();
    addRelativeButton.select(".add-relatives-hitbox").remove();
    //},20)
  }
  nodeButtons.onHideCallbacks.push(removeAddRelativeMenu);nodeButtons.addButton("change-sex", -25, 50, "\uF228", 80, 45, "hint-change-sex", {
    FAx: -10, FAy: 6,
    tooltipx: -104
  }).on("click.change-sex", toggleYourSex);

  function toggleYourSex(node) {
    var circle = d3.select("#" + FamilyTreeArtist.nodeGroupId(node.id) + " .node-circle");

    node.sex = node.sex == "M" ? "F" : "M";
    var isWoman = node.sex == "F";
    circle.classed("man", !isWoman);
    circle.classed("woman", isWoman);
    // exchange role in marriages
    if (node.fams) {
      node.fams.forEach(function (f) {
        var h = f.husb;
        f.husb = f.wife;
        f.wife = h;
      });
    }
    // take care of spouse
    var spouse = node.spouse();
    if (spouse) {
      spouse.sex = spouse.sex == "M" ? "F" : "M";
      isWoman = spouse.sex == "F";
      var spouseCircle = d3.select("#" + FamilyTreeArtist.nodeGroupId(spouse.id) + " .node-circle");
      spouseCircle.classed("man", !isWoman);
      spouseCircle.classed("woman", isWoman);
      //document.querySelector("#"+nodeGroupId(spouse.id)+" .node-name").setAttribute(i18n.keyAttr, isWoman? "node-name-woman":"node-name-man")
    }
    saveFamilyTreeToLocalStorage();
  }

  return nodeButtons;
}

function selectTarget(node) {
  // reset old target's buttons, logo & sequenced state
  if (kgp.target) {
    kgp.target.buttons = kgp.target.id == kgp.youNodeId ? youNodeButtons : standardNodeButtons;
    d3.select("#" + FamilyTreeArtist.nodeGroupId(kgp.target.id) + " .node-logo").attr("class", "fas fa-dna dna-logo node-logo node-logo-large " + (kgp.target.lastSequencedDNA ? "" : "invisible-dna")).attr("x", "-16px").text("\uF471");
    kgp.target.sequencedDNA = kgp.target.lastSequencedDNA;
    kgp.target.lastSequencedDNA = undefined;
  }
  // set new target
  kgp.target = node;
  node.buttons = node.id == kgp.youNodeId ? youTargetNodeButtons : targetNodeButtons;
  // ...ensure it's not sequenced
  node.lastSequencedDNA = node.sequencedDNA;
  node.sequencedDNA = false;
  //nodeg.select(".dna-logo").classed("invisible-dna", !node.sequencedDNA)

  // change the logo
  d3.select("#" + FamilyTreeArtist.nodeGroupId(node.id) + " .node-logo").attr("class", "fas fa-crosshairs crosshairs-logo node-logo node-logo-large").attr("x", "-18px").text("\uF05B");
}
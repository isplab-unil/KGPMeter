"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FamilyTreeArtist = function () {
  function FamilyTreeArtist(kgp, i18n) {
    var transitionDuration = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 800;

    _classCallCheck(this, FamilyTreeArtist);

    this.kgp = kgp;
    this.i18n = i18n;
    this.init(transitionDuration);
  }

  _createClass(FamilyTreeArtist, [{
    key: "init",
    value: function init() {
      var transitionDuration = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 800;

      var self = this;
      this.svgg = this.kgp.svg.append("g").attr("id", "familytree-g");

      this.update(false, transitionDuration);

      // distinguish you node
      //this.kgp.target = ftree.nodes[this.kgp.youNodeId]
      var meNodeGroup = d3.select("#" + FamilyTreeArtist.nodeGroupId(this.kgp.youNodeId)).classed("you", true).each(function (d) {
        d.buttons = youNodeButtons; //youTargetNodeButtons
        d.i18nName = "you";
      });
      meNodeGroup.select(".node-name").each(function () {
        var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(d) {
          var nodeNameYou;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.next = 2;
                  return self.i18n.t("node-name-you");

                case 2:
                  nodeNameYou = _context.sent;

                  if (Boolean(d.name) & d.name != nodeNameYou) {
                    this.innerHTML = d.name;
                  } else {
                    this.setAttribute(self.i18n.keyAttr, "node-name-you");
                  }

                case 4:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));

        return function (_x3) {
          return _ref.apply(this, arguments);
        };
      }());

      this.initNodeButtons();

      // hide on mouseleave
      this.nodeButtons.g.on("mouseleave.hide", function (d) {
        return self.nodeButtons.hide();
      });

      // highlight links on hover
      this.nodeButtons.g.on("mouseover.toggleHighlightNodeLinks", self.generateToggleHighlightNodeLinks(true));
      this.nodeButtons.g.on("mouseleave.toggleHighlightNodeLinks", self.generateToggleHighlightNodeLinks(false));
      this.nodeButtons.g.on("click.toggleHighlightNodeLinks", self.generateToggleHighlightNodeLinks(false));
    }
  }, {
    key: "update",
    value: function update(updateSource) {
      var transitionsDuration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 800;

      var self = this;
      updateSource = updateSource ? { x: updateSource.x, y: updateSource.y } : false;
      ftree.computeLayout(false);
      ftree.center(true, false);

      // rescale tree if gets out of svg
      var ftreeLeftMargin = 70; // 20 pix for target button, 50 for first node circle
      var ftreeRightMargin = 170; // 120 for add-relative menu, 50 for last node circle
      var widthFtree = ftreeLeftMargin + ftree.width() + ftreeRightMargin;

      var miny = ftree.minY();
      var heightFtree = ftree.maxY() - miny + 150;
      // if we can still resize the svg -> let's do it!
      var newSvgHeight = this.kgp.svgHeight;
      if (heightFtree < this.kgp.svgOriginalHeight) {
        //tree height smaller than minimum
        newSvgHeight = this.kgp.svgOriginalHeight;
      }
      // tree height between minimum and max
      if (heightFtree > this.kgp.svgOriginalHeight && heightFtree < this.kgp.svgMaxHeight) {
        newSvgHeight = heightFtree;
      }
      // tree height taller than maximum
      if (heightFtree > this.kgp.svgMaxHeight) {
        newSvgHeight = this.kgp.svgMaxHeight;
      }
      // if needed -> change it
      if (newSvgHeight != this.kgp.svgHeight) {
        this.kgp.svg.transition().duration(transitionsDuration).attr("height", newSvgHeight);
        this.kgp.svgHeight = newSvgHeight;
      }
      var scaleFactor = d3.min([1, this.kgp.svgWidth / widthFtree, this.kgp.svgHeight / heightFtree]);
      var translateX = widthFtree < this.kgp.svgWidth - ftreeRightMargin / 2 ? this.kgp.svgWidth / 2 : scaleFactor * (ftree.width() / 2 + ftreeLeftMargin);

      this.svgg.transition().duration(transitionsDuration).attr("transform", "translate(" + translateX + "," + scaleFactor * (80 - miny) + ") scale(" + scaleFactor + ")");
      // for tutorial videos, use these settings:
      //.attr("transform","translate("+550+","+(scaleFactor*(75-miny))+") scale("+scaleFactor+")")

      // updateSource:
      updateSource = updateSource ? updateSource : { x: translateX + (widthFtree - ftreeRightMargin) / 2, y: 50 };
      this.updateLinks(updateSource, transitionsDuration);
      this.updateNodes(updateSource, transitionsDuration);
    }
  }, {
    key: "updateLinks",
    value: function updateLinks(source, transitionsDuration) {
      var self = this;

      // adds the links between the nodes
      var link = this.svgg.selectAll(".link");

      // remove links whose source or target is no longer in ftree
      var keepLink = function keepLink(d) {
        return Boolean(ftree.nodes[d[0].id]) && Boolean(ftree.nodes[d[1].id]);
      };
      var linkExit = link.filter(function (d) {
        return !keepLink(d);
      });
      linkExit.transition().duration(transitionsDuration).attr("d", function (d) {
        return FamilyTreeArtist.renderLink(d[1], d[1]);
      }).remove();

      link = link.filter(keepLink).data(ftree.getLinks(),
      // add key function: make sure each ftree-link is assigned to the right svg-link-path
      function (d) {
        return d ? FamilyTreeArtist.linkNodeId(d[0].id, d[1].id) : this.id;
      });
      var linkEnter = link.enter().insert("path", ".nodeg").attr("id", function (d) {
        return FamilyTreeArtist.linkNodeId(d[0].id, d[1].id);
      }).attr("class", function (d) {
        return "link " + FamilyTreeArtist.linkNodeClass(d[0].id) + " " + FamilyTreeArtist.linkNodeClass(d[1].id);
      }).attr("d", FamilyTreeArtist.renderLink(source, source)).attr("fill", "none").attr("stroke", "lightgrey");

      var linkUpdate = linkEnter.merge(link);
      linkUpdate.transition().duration(transitionsDuration).attr("d", function (d) {
        return FamilyTreeArtist.renderLink(d[0], d[1]);
      });
    }
  }, {
    key: "updateNodes",
    value: function updateNodes(source, transitionsDuration) {
      var self = this;

      // maps the node data to the tree layout
      // let nodes = ftree.nodesArray()

      // adds each node as a group
      var node = this.svgg.selectAll(".nodeg");

      // remove nodes whose d is no longer in ftree
      var keepNode = function keepNode(d) {
        return Boolean(ftree.nodes[d.id]);
      };
      node.filter(function (d) {
        return !keepNode(d);
      }).remove();

      node = node.filter(keepNode).data(ftree.nodesArray().filter(function (n) {
        return !n.hidden;
      }));
      //disable action buttons during the transition
      //node.on("mouseenter.actionButtons",null)

      // nodeEnter: all the new nodes
      var nodeEnter = node.enter().append("g").attr("id", function (d) {
        return FamilyTreeArtist.nodeGroupId(d.id);
      }).attr("class", "nodeg").attr("transform", "translate(" + source.x + "," + source.y + ")");

      // fam nodes: add height salt, for a different branching height for all famc
      var famNodes = nodeEnter.filter(function (d) {
        return d.tag === "FAM";
      });
      famNodes.insert("circle", ".nodeg").attr("r", self.kgp.famNodeSize.width / 2)
      // add man/woman/family classes
      .attr("class", function (d) {
        var tr = "node-circle ";
        // family classes: one for each member of the family
        tr += d.husb ? FamilyTreeArtist.famNodeClass(d.husb.id) + " " : "";
        tr += d.wife ? FamilyTreeArtist.famNodeClass(d.wife.id) + " " : "";
        if (d.chil) {
          d.chil.forEach(function (c) {
            tr += FamilyTreeArtist.famNodeClass(c.id) + " ";
          });
        }
        return tr;
      }).attr("fill", "lightgrey");
      famNodes.each(function (d) {
        // @F1@ is special case: it is only famc whose wife and husb aren't targets in links
        d.heightSalt = d.id == "@F1@" ? 0 : 15 - Math.random() * 30;
      });

      // nodes of individuals
      var indiNodes = nodeEnter.filter(function (d) {
        return d.tag === "INDI";
      });
      indiNodes.append("circle").attr("r", self.kgp.indiNodeSize.width / 2)
      // add man/woman/family classes
      .attr("class", function (d) {
        var tr = "node-circle ";
        if (d.sex == "M") {
          tr += " man";
        } else if (d.sex == "F") {
          tr += " woman";
        }
        return tr;
      });
      // draw buttons on mouseenter&click
      indiNodes.on("mouseenter.actionButtons", function (node) {
        return self.nodeButtons.wake(node);
      });
      indiNodes.on("click.actionButtons", function (node) {
        return self.nodeButtons.wake(node);
      });
      // add buttons to nodes
      indiNodes.each(function (d) {
        d.buttons = standardNodeButtons;
      });

      // adds the DNA logo
      indiNodes.append("text").attr("class", "fas fa-dna dna-logo node-logo node-logo-large").classed("invisible-dna", function (d) {
        return !d.sequencedDNA;
      }).attr("x", "-16px").attr("y", " 0px").attr("width", "40px").attr("height", "40px").attr('font-family', 'FontAwesome').attr('font-size', "36px").text("\uF471");

      // Node name: a div that has contenteditable
      indiNodes.append("foreignObject").attr("x", "-40px").attr("y", "14px").attr("width", "80px").attr("height", "2em").append("xhtml:div").attr("contenteditable", "true").attr("class", "node-name").attr("spellcheck", "false")
      // select all text on focus
      .on("focus", function (d) {
        var el = this;
        requestAnimationFrame(function () {
          var range = document.createRange();
          range.selectNodeContents(el);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        });
      }).each(function () {
        var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(d) {
          var nodeNameMan, nodeNameWoman, nodeNameYou;
          return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  _context2.next = 2;
                  return self.i18n.t("node-name-man");

                case 2:
                  nodeNameMan = _context2.sent;
                  _context2.next = 5;
                  return self.i18n.t("node-name-woman");

                case 5:
                  nodeNameWoman = _context2.sent;
                  _context2.next = 8;
                  return self.i18n.t("node-name-you");

                case 8:
                  nodeNameYou = _context2.sent;

                  if (Boolean(d.name) & d.name != nodeNameMan & d.name != nodeNameWoman) {
                    // only set innerHTML if the name is truly non-standard
                    this.innerHTML = d.name;
                  } else if (d.name != nodeNameYou & this.getAttribute(self.i18n.keyAttr) != "node-name-you") {
                    // only set self.i18n.keyAttr if it's not the "you" node
                    //this.setAttribute(self.i18n.keyAttr, d.sex=="F"? "node-name-woman":"node-name-man")
                    this.setAttribute(self.i18n.keyAttr, "node-name-" + d.i18nName);
                  }
                  // remove i18n attribute on keydown and quit name editing on enter
                  // using addEventListener and not d3.on() as accessing the event 
                  // with d3.event might cause problem with webpack/bundler
                  this.addEventListener("keydown", function (event) {
                    this.removeAttribute(self.i18n.keyAttr);
                    d.name = this.innerHTML;
                    self.kgp.saveFamilyTreeToLocalStorage();
                    // if line return: remove selection and unselect element
                    if (event.keyCode == 13) {
                      window.getSelection().removeAllRanges();
                      this.blur();
                    }
                    return false;
                  });

                case 11:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2, this);
        }));

        return function (_x5) {
          return _ref2.apply(this, arguments);
        };
      }());

      // old&new nodes together
      var nodeUpdate = nodeEnter.merge(node);
      // hide families with only 1 spouse
      nodeUpdate.filter(function (d) {
        return d.tag === "FAM";
      }).classed("hidden", function (d) {
        return !(d.wife && d.husb);
      });
      // highlight links
      nodeUpdate.on("mouseenter.toggleHighlightNodeLinks", self.generateToggleHighlightNodeLinks(true));
      nodeUpdate.on("mouseleave.toggleHighlightNodeLinks", self.generateToggleHighlightNodeLinks(false));
      // transition nodes to new positions smoothly
      nodeUpdate.transition().duration(transitionsDuration).attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      });
    }
  }, {
    key: "setAsTarget",
    value: function setAsTarget(newTarget, oldTarget) {
      this.nodeButtons.hide();
      // reset old target's buttons, logo & sequenced state
      if (oldTarget) {
        oldTarget.buttons = oldTarget.id == this.kgp.youNodeId ? youNodeButtons : standardNodeButtons;
        d3.select("#" + FamilyTreeArtist.nodeGroupId(oldTarget.id) + " .node-logo").attr("class", "fas fa-dna dna-logo node-logo node-logo-large " + (oldTarget.lastSequencedDNA ? "" : "invisible-dna")).attr("x", "-16px").text("\uF471");
        oldTarget.sequencedDNA = oldTarget.lastSequencedDNA;
        oldTarget.lastSequencedDNA = undefined;
      }
      // set new target
      newTarget.buttons = newTarget.id == this.kgp.youNodeId ? youTargetNodeButtons : targetNodeButtons;
      // ...ensure it's not sequenced
      newTarget.lastSequencedDNA = newTarget.sequencedDNA;
      newTarget.sequencedDNA = false;
      //nodeg.select(".dna-logo").classed("invisible-dna", !node.sequencedDNA)

      // change the logo
      d3.select("#" + FamilyTreeArtist.nodeGroupId(newTarget.id) + " .node-logo").attr("class", "fas fa-crosshairs crosshairs-logo node-logo node-logo-large").attr("x", "-18px").text("\uF05B");
    }
  }, {
    key: "initNodeButtons",
    value: function initNodeButtons() {

      // TODO: this is not super clean, in the future improve the architecture of addRelativeMenu()
      var addRelativeMenu = function () {
        var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(node) {
          var canAddChildren, canAddParents, canAddMother, canAddFather, spouseMissing, FOw, FOh, FOx, FOy, hitboxMargin, addRelativeHitbox, addRelativeFO, addRelativeDiv, _addAddRelativeSpan;

          return regeneratorRuntime.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  _addAddRelativeSpan = function _addAddRelativeSpan(relative, addRelative) {
                    addRelativeDiv.append("span").attr(i18n.keyAttr, "node-name-" + relative).on("click", function (node) {
                      var relativeNode = addRelative(node);
                      relativeNode.i18nName = self.kgp.relationToYou(node.i18nName, relative);
                      self.update(node);
                      self.nodeButtons.hide();
                      addRelativeHitbox.remove();
                      self.kgp.saveFamilyTreeToLocalStorage();
                    });
                  };

                  //fix: node doesn't propagate to circle
                  node = self.nodeButtons.g.datum();
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
                  return _context3.stop();
              }
            }
          }, _callee3, this);
        }));

        return function addRelativeMenu(_x6) {
          return _ref3.apply(this, arguments);
        };
      }();

      var self = this;
      this.nodeButtons = new NodeButtonsGroup(this.svgg, self.kgp.indiNodeSize.width);

      // ------------------------ remove node button ------------------------
      function removeNode(node) {
        ftree.deleteNode(node.id, kgp.youNodeId);
        self.nodeButtons.hide();
        kgpMeterScoreRequestHandler.requestScore(self.kgp.target ? kgp.target.id : "", ftree.getLinksAsIds(), ftree.nodesArray().filter(function (n) {
          return n.sequencedDNA;
        }).map(function (n) {
          return n.id;
        }), self.kgp.userId, self.kgp.userSource, i18n.lng);
        self.update();
        self.kgp.saveFamilyTreeToLocalStorage();
      }

      self.nodeButtons.addButton("remove-node", 25, -50, "\uF506", "80px", "50px", "hint-delete-node").on("click.remove", removeNode);

      // ------------------------ toggle DNA sequencing button ------------------------


      // HOW TO HANDLE +-: d =>'\uf471'+(d.sequencedDNA?"-":"+") IN OLD CODE?
      function toggleDnaButtonText(node) {
        toggleDNAbutton.select("text").node().innerHTML = "\uF471" + (node.sequencedDNA ? "-" : "+");
      }
      function toggleDNA(node) {
        node.sequencedDNA = !node.sequencedDNA;
        toggleDnaButtonText(node);
        d3.select("#" + FamilyTreeArtist.nodeGroupId(node.id) + " .dna-logo").classed("invisible-dna", !node.sequencedDNA);
        kgpMeterScoreRequestHandler.requestScore(self.kgp.target ? kgp.target.id : "", ftree.getLinksAsIds(), ftree.nodesArray().filter(function (n) {
          return n.sequencedDNA;
        }).map(function (n) {
          return n.id;
        }), self.kgp.userId, self.kgp.userSource, i18n.lng);
        self.kgp.saveFamilyTreeToLocalStorage();
      }
      var toggleDNAbutton = self.nodeButtons.addButton("toggle-dna", 25, 50, "\uF471+", "170px", "70px", "hint-sequence-node").on("click.sequenced-dna", toggleDNA);
      self.nodeButtons.onWakeCallbacks.push(toggleDnaButtonText);

      // ------------------------ set as target button ------------------------

      self.nodeButtons.addButton("set-as-target", -50, 0, "\uF05B", "120px", "45px", "change-target", {
        FAx: -10, FAy: 7,
        tooltipx: "-144px"
      }).on("click.set-as-target", function (n) {
        return self.kgp.selectTarget(n);
      });

      // ------------------------ add relatives button ------------------------
      var addRelativeButton = self.nodeButtons.addButton("add-relative", 50, 0, "\uF234", 0, 0, undefined, {
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
      self.nodeButtons.onHideCallbacks.push(removeAddRelativeMenu);
      //self.nodeButtons.onWakeCallbacks.push(removeAddRelativeMenu)


      // ------------------------ Toggle your sex Button ------------------------
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
        self.kgp.saveFamilyTreeToLocalStorage();
      }
      self.nodeButtons.addButton("change-sex", -25, 50, "\uF228", 80, 45, "hint-change-sex", {
        FAx: -10, FAy: 6,
        tooltipx: -104
      }).on("click.change-sex", toggleYourSex);
    }
  }, {
    key: "generateToggleHighlightNodeLinks",
    value: function generateToggleHighlightNodeLinks(active) {
      return function toggleHighlightNodeLinks(d) {
        var links = [d.id, d.famc ? d.famc.id : undefined, d.fams && d.fams.length > 0 ? d.fams[0].id : undefined].filter(Boolean);
        links.map(FamilyTreeArtist.linkNodeClass).forEach(function (l) {
          var links = d3.selectAll("." + l);
          links.classed("highlight-link", active);
        });

        if (d.famc) {
          d3.select("#" + FamilyTreeArtist.nodeGroupId(d.famc.id) + " .node-circle").classed("highlight-fam", active);
        }
        if (d.fams && d.fams.length > 0) {
          d3.select("#" + FamilyTreeArtist.nodeGroupId(d.fams[0].id) + " .node-circle").classed("highlight-fam", active);
        }
      };
    }
  }], [{
    key: "idToString",
    value: function idToString(id) {
      return id ? id.replace(/@/g, "") : "";
    }
  }, {
    key: "linkNodeId",
    value: function linkNodeId(id1, id2) {
      return "link-" + FamilyTreeArtist.idToString(id1) + "-" + FamilyTreeArtist.idToString(id2);
    }
  }, {
    key: "linkNodeClass",
    value: function linkNodeClass(id) {
      return "link-" + FamilyTreeArtist.idToString(id);
    }
  }, {
    key: "famNodeClass",
    value: function famNodeClass(id) {
      return "fam-" + FamilyTreeArtist.idToString(id);
    }
  }, {
    key: "nodeGroupId",
    value: function nodeGroupId(id) {
      return "node-" + FamilyTreeArtist.idToString(id);
    }
  }, {
    key: "renderCurvedLink",
    value: function renderCurvedLink(source, target) {
      return "M" + source.x + "," + source.y + "C" + source.x + "," + (source.y + target.y) / 2 + " " + target.x + "," + (source.y + target.y) / 2 + " " + target.x + "," + target.y;
    }
  }, {
    key: "renderSquareLink",
    value: function renderSquareLink(source, target) {
      var heightSalt = source.heightSalt ? source.heightSalt : 0;
      return "M" + source.x + "," + source.y + "L" + source.x + "," + (heightSalt + (source.y + target.y) / 2) + "L" + target.x + "," + (heightSalt + (source.y + target.y) / 2) + "L" + target.x + "," + target.y;
    }
  }, {
    key: "renderLink",
    value: function renderLink(source, target) {
      return FamilyTreeArtist.renderSquareLink(source, target);
    }
  }]);

  return FamilyTreeArtist;
}();
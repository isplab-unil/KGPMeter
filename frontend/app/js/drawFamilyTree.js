"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var KinGenomicPrivacyMeter = function () {
  function KinGenomicPrivacyMeter(api_base_url, svgId, youNodeId, i18n) {
    var maxFamilyTreeDepth = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 5;
    var cookieLocalStoragePrefix = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : "kgpmeter-";

    _classCallCheck(this, KinGenomicPrivacyMeter);

    var self = this;
    this.i18n = i18n;

    this.svg = d3.select("#" + svgId);
    this.svgHeight = parseInt(this.svg.attr("height"));
    this.svgOriginalHeight = this.svgHeight;
    this.svgMaxHeight = parseInt(this.svg.attr("data-max-height"));
    this.svgMaxHeight = this.svgMaxHeight ? this.svgMaxHeight : this.svgHeight;

    this.maxFamilyTreeDepth = maxFamilyTreeDepth;
    this.youNodeId = youNodeId; // "@I1@"
    this.privacyMetric = 1;
    this.relationships = KinGenomicPrivacyMeter.getRelationships();

    this.indiNodeSize = { width: 100, height: 100 };
    this.famNodeSize = { width: 7, height: 7 };

    this.updateSvgWidth();

    // user id&source
    var idCookie = cookieLocalStoragePrefix + "user-id";
    var sourceCookie = cookieLocalStoragePrefix + "user-source";
    this.userId = cookie.read(idCookie);
    this.userSource = cookie.read(sourceCookie);
    var new_user = !this.userId;
    if (new_user) {
      this.userId = +new Date() + "-" + Math.random();
      cookie.create(idCookie, this.userId, 1);
      this.userSource = document.URL;
      // TODO: remove or refine ?test
      if (Boolean(this.userSource.match(/\/privacy-dev\//))) {
        this.userSource = this.userSource + "?test";
      }
      cookie.create(sourceCookie, this.userSource, 1);
    }

    // api urls
    this.api_base_url = api_base_url;
    this.privacyScoreApiEndpoint = this.api_base_url + "/privacy-score";
    this.surveyApiEndpoint = this.api_base_url + "/survey";

    kgpsurvey = new KgpSurvey(this.surveyApiEndpoint, this.userId, this.i18n);

    // privacy bar
    var privacyBarWidth = 30;
    var privacyBarStrokeWidth = 4;
    privacyBar = new PrivacyBar(this.svg.attr("id"), "privacy-bar-g", this.svgWidth - privacyBarWidth - privacyBarStrokeWidth, 30, 30, 400, 5, d3.interpolateRgbBasis(["rgb(255,0,0)", "rgb(255,125,0)", "rgb(255,255,0)", "rgb(0,195,0)"]), self.i18n);

    // privacy worded score
    privacyWordedScore = new PrivacyWordedScore(privacyBar.g.attr("id"), "privacy-bar-title", "privacy-bar-element", privacyBar.width, -16, 20, privacyBar.colorScale, self.i18n, "privacy-bar-title");

    // backend status
    privacyBackendStatus = new PrivacyBackendStatus("kgp-response-container", self.i18n);

    // explainer
    privacyScoreNumberExplainer = new PrivacyScoreNumberExplainer("kgp-explainer-container", self.i18n, "explainer-text");

    // request handler
    kgpMeterScoreRequestHandler = new KgpMeterScoreRequestHandler(this.privacyScoreApiEndpoint);
    kgpMeterScoreRequestHandler.addListener(function () {
      var _privacyBar;

      return (_privacyBar = privacyBar).await.apply(_privacyBar, arguments);
    });
    kgpMeterScoreRequestHandler.addListener(function () {
      var _privacyWordedScore;

      return (_privacyWordedScore = privacyWordedScore).await.apply(_privacyWordedScore, arguments);
    });
    kgpMeterScoreRequestHandler.addListener(function () {
      var _privacyBackendStatus;

      return (_privacyBackendStatus = privacyBackendStatus).await.apply(_privacyBackendStatus, arguments);
    });
    kgpMeterScoreRequestHandler.addListener(function () {
      var _privacyScoreNumberEx;

      return (_privacyScoreNumberEx = privacyScoreNumberExplainer).await.apply(_privacyScoreNumberEx, arguments);
    });
    kgpMeterScoreRequestHandler.addListener(function () {
      var _kgpsurvey;

      return (_kgpsurvey = kgpsurvey).await.apply(_kgpsurvey, arguments);
    });
    kgpMeterScoreRequestHandler.addListener(function () {
      return otherThingsToDoOnKgpMeterScoreResponse.apply(undefined, arguments);
    });

    // new user: send init request
    if (new_user) {
      kgpMeterScoreRequestHandler.requestScore("i1", [["i1", "f1"], ["f1", "i2"]], [], this.userId, this.userSource, self.i18n.lng, true // silent request
      );
    }

    // trash button
    this.trashButton = new TrashButton("trash-button", this, { "click.trash": function clickTrash(d) {
        return self.reset();
      } });

    onWindowResize(function () {
      return self.resizeSvg();
    });
  }

  /** Resets the family tree in a pleasant way */


  _createClass(KinGenomicPrivacyMeter, [{
    key: "reset",
    value: function reset() {
      var transitionDuration = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 800;

      console.log("KgpMeter.reset(): transitionDuration=", transitionDuration);

      var self = this;
      // delete all nodes except you
      ftree.nodesArray().forEach(function (n) {
        if (n.id != self.youNodeId) {
          ftree.deleteNode(n.id, self.youNodeId);
        }
      });
      familyTreeArtist.nodeButtons.hide();
      // set privacy score back to 1:
      self.privacyMetric = 1;
      self.target = null;
      resp = null;
      privacyBar.elements.transition(200).attr("opacity", 1);
      privacyBar.update(1);
      privacyBackendStatus.hide();
      privacyWordedScore.hide();
      privacyScoreNumberExplainer.hide();

      // smoothly transition back to original position
      familyTreeArtist.update(false, transitionDuration);

      // once this is done (after 800ms), reset the empty ftree from GEDCOM data
      setTimeout(function () {
        ftree = KinGenomicPrivacyMeter.getEmptyFamilyTree();
        d3.select("#familytree-g").remove();
        familyTreeArtist.init(0);
        saveFamilyTreeToLocalStorage();
      }, transitionDuration + 2);
    }

    /** Update the svg width, called on window resizes */

  }, {
    key: "updateSvgWidth",
    value: function updateSvgWidth() {
      this.svgWidth = this.svg.node().parentNode.clientWidth;
      this.svg.attr("width", this.svgWidth);
    }
  }, {
    key: "selectTarget",
    value: function selectTarget(newTarget) {
      var forceUpdate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      var self = this;
      if (!newTarget.id) {
        newTarget = ftree.nodesArray().filter(function (n) {
          return n.id == newTarget;
        })[0];
      }
      if (forceUpdate || !this.target || newTarget.id != this.target.id) {
        var oldTarget = self.target;
        this.target = newTarget;
        familyTreeArtist.setAsTarget(newTarget, oldTarget);
        kgpMeterScoreRequestHandler.requestScore(self.target ? self.target.id : "", ftree.getLinksAsIds(), ftree.nodesArray().filter(function (n) {
          return n.sequencedDNA;
        }).map(function (n) {
          return n.id;
        }), self.userId, self.userSource, i18n.lng);
        saveFamilyTreeToLocalStorage();
      }
    }

    /**
    * function correctly resizing svg, family tree and privacy bar according to svg's parent node
    */

  }, {
    key: "resizeSvg",
    value: function resizeSvg() {
      // remove all children of svg
      var svgNode = this.svg.node();
      while (svgNode.firstChild) {
        svgNode.removeChild(svgNode.firstChild);
      }
      // resize svg
      this.updateSvgWidth();
      // redraw tree&privacy bar
      privacyBar.init(kgp.svgWidth - privacyBar.width - privacyBar.strokeWidth, privacyBar.y, 0);
      privacyWordedScore.init();
      privacyWordedScore.hide();
      this.trashButton.init();

      if (kgp.target) {
        privacyBar.update(this.privacyMetric, 0);
        privacyWordedScore.update(this.privacyMetric, 0);
      }
      familyTreeArtist.init(0);
      mobileBlock();
    }

    /** Returns the family relation to center node ("you") of target relation
     * 
     * for rexample relationToYou("father", "son") will return "brother" (the "son" of your "father" is your "brother")
    */

  }, {
    key: "relationToYou",
    value: function relationToYou(sourceRelation, targetRelation) {
      if (this.relationships[sourceRelation] && this.relationships[sourceRelation][targetRelation]) {
        return this.relationships[sourceRelation][targetRelation];
      }

      var sex = KinGenomicPrivacyMeter.getSex(targetRelation, sourceRelation);
      if (sex == "F") {
        return "woman";
      }
      if (sex == "M") {
        return "man";
      }
      return undefined;
    }

    /** use by TrashButton, TrashButtonWithConfirmation */

  }, {
    key: "addSvgButton",
    value: function addSvgButton(FAunicode, gId, i18nKey) {
      var x = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      var tooltipX = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
      var tooltipY = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 25;
      var tooltipWidth = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 80;
      var tooltipHeight = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 50;

      var button = this.svg.append("g").attr("id", gId).attr("transform", "translate(" + x + ",27)").attr("style", "cursor:pointer;").classed("button-with-tooltip", true);
      button.append("rect").classed("svg-button", true).attr("width", 60) // big width to allow button to reduce tooltip hide sensitivity
      .attr("height", 25).attr("fill", "white").attr("opacity", 0);

      button.append("text").attr("class", "fas svg-button-fas").attr("y", 20).text(FAunicode);
      button.append("foreignObject").attr("x", tooltipX).attr("y", tooltipY).attr("width", tooltipWidth).attr("height", tooltipHeight).classed("tooltip", true).append("xhtml:div").append("span").classed("tooltip-text", true).attr(this.i18n.keyAttr, i18nKey);

      return button;
    }

    /** Creates a depth 2 dictionary to encode relationships in a family
     * 
     * index1 represents "source relation" and index2 "target relation"
     * It is not complete, hence relationToYou(source, target) should be used to find a relation*/

  }], [{
    key: "getRelationships",
    value: function getRelationships() {
      // handling family relationships
      var relationships = {
        "grandmother": {
          "partner": "grandfather",
          "daughter": "aunt",
          "son": "uncle"
        },
        "mother": {
          "father": "grandfather",
          "mother": "grandmother",
          "partner": "father",
          "daughter": "sister",
          "son": "brother"
        },
        "motherinlaw": {
          "partner": "fatherinlaw",
          "daughter": "sisterinlaw",
          "son": "brotherinlaw"
        },
        "aunt": {
          "partner": "uncleinlaw",
          "daughter": "cousinf",
          "son": "cousinm"
        },
        "auntinlaw": {
          "partner": "uncle",
          "daughter": "cousinf",
          "son": "cousinm"
        },
        "you": {
          "father": "father",
          "mother": "mother",
          "partner": "partner",
          "daughter": "daughter",
          "son": "son"
        },
        "partner": {
          "father": "fatherinlaw",
          "mother": "motherinlaw",
          "partner": "you",
          "daughter": "daughter",
          "son": "son"
        },
        "sister": {
          "father": "father",
          "mother": "mother",
          "partner": "brotherinlaw",
          "daughter": "niece",
          "son": "nephew"
        },
        "sisterinlaw": {
          "daughter": "niece",
          "son": "nephew"
        },
        "daughter": {
          "father": "partner",
          "mother": "partner",
          "partner": "soninlaw",
          "daughter": "granddaughter",
          "son": "grandson"
        },
        "daughterinlaw": {
          "partner": "son",
          "daughter": "granddaughter",
          "son": "grandson"
        },
        "granddaughter": {
          "father": "soninlaw",
          "mother": "daughterinlaw"
        }
        //translating for males
      };var relationshipsEquiv = [["grandfather", "grandmother", "grandmother"], ["father", "mother", "mother"], ["fatherinlaw", "motherinlaw", "motherinlaw"], ["uncle", "aunt", "auntinlaw"], ["uncleinlaw", "auntinlaw", "aunt"], ["brother", "sister", "sisterinlaw"], ["brotherinlaw", "sisterinlaw", "woman"], ["son", "daughter", "daughterinlaw"], ["soninlaw", "daughterinlaw", "daughter"], ["grandson", "granddaughter", "woman"]];
      relationshipsEquiv.forEach(function (tuple) {
        relationships[tuple[0]] = JSON.parse(JSON.stringify(relationships[tuple[1]]));
        relationships[tuple[0]]["partner"] = tuple[2];
      });
      return relationships;
    }
  }, {
    key: "getEmptyFamilyTree",
    value: function getEmptyFamilyTree() {
      var emptyFamilyTree = {
        "class": "FamilyTreeLayout",
        "nodes": [{
          "id": "@I1@",
          "sex": "F",
          "tag": "INDI",
          "fams": [],
          "famc": null,
          "chil": [],
          "wife": null,
          "husb": null,
          "sequencedDNA": false,
          "i18nName": "you"
        }],
        "properties": ["id", "name", "sex", "tag", "fams", "famc", "chil", "wife", "husb", "sequencedDNA", "lastSequencedDNA", "i18nName"],
        "centerNodeId": 0
      };
      return FamilyTreeLayout.unserialize(JSON.stringify(emptyFamilyTree));
    }

    /** getSex() returns "F" if given relation is female, "M" if male */

  }, {
    key: "getSex",
    value: function getSex(relation) {
      var partnerRelation = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      var males = ["man", "grandfather", "father", "fatherinlaw", "uncle", "uncleinlaw", "brother", "brotherinlaw", "cousinm", "son", "soninlaw", "nephew", "grandson"];
      var females = ["woman", "grandmother", "mother", "motherinlaw", "aunt", "auntinlaw", "sister", "sisterinlaw", "cousinf", "daughter", "daughterinlaw", "niece", "granddaughter"];
      if (males.findIndex(function (r) {
        return r == relation;
      }) != -1) {
        return "M";
      }
      if (females.findIndex(function (r) {
        return r == relation;
      }) != -1) {
        return "F";
      }
      if (males.findIndex(function (r) {
        return r == partnerRelation;
      }) != -1) {
        return "F";
      }
      if (females.findIndex(function (r) {
        return r == partnerRelation;
      }) != -1) {
        return "M";
      }

      return undefined;
    }
  }]);

  return KinGenomicPrivacyMeter;
}();

// ****************************************************************************************************


/** adds a 100ms without resize to window.onresize() before executing func (to avoid redraws every msec) */


function onWindowResize(func) {
  var timeout = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 100;

  var doit = void 0;
  window.onresize = function () {
    clearTimeout(doit);
    doit = setTimeout(func, timeout);
  };
}

// ****************************************************************************************************

var familyTreeArtist = void 0;

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

        return function (_x14) {
          return _ref.apply(this, arguments);
        };
      }());

      this.nodeButtons = createNodeButtons(this.svgg);

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
                    saveFamilyTreeToLocalStorage();
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

        return function (_x16) {
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

/** Debugging: show node ids on hover */


function showNodesIds() {
  kgp.svgg.selectAll(".nodeg").append('text').text(function (d) {
    return d.id;
  })
  //.attr("class","node-id")
  .attr("transform", "translate(" + -50 + ",0)");
}

function saveFamilyTreeToLocalStorage() {
  localStorage.setItem("ftree.nodes", JSON.stringify(ftree.serialize(["sequencedDNA", "lastSequencedDNA", "i18nName"])));
  localStorage.setItem("ftree_save_date", +new Date());
  if (kgp.target) {
    localStorage.setItem("kgp.target.id", kgp.target.id);
  } else {
    localStorage.setItem("kgp.target.id", null);
  }
}

function loadFamilyTreeFromLocalStorage() {
  var ftreeKey = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "ftree.nodes";
  var targetKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "kgp.target.id";
  var saveDateKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "ftree_save_date";

  var ftl = localStorage.getItem(ftreeKey);
  var targetId = localStorage.getItem(targetKey);
  var saveDate = +localStorage.getItem(saveDateKey);
  //console.log("LOADING family tree, ftl = ", ftl, ", targetId = ",targetId, ", saveDate = ",saveDate)
  if (Boolean(ftl) & saveDate + 2 * 3600 * 1000 >= +new Date()) {
    ftl = FamilyTreeLayout.unserialize(ftl);
    kgp.target = targetId ? ftl.nodes[targetId] : null;
    return ftl;
  }
  return null;
}

/** block IE if detected, not the same as mobile as foreignObject not supported */
function IEBlock() {
  if (detectIE11()) {
    kgp.svg.append("rect").attr("width", kgp.svgWidth).attr("height", kgp.svgHeight).attr("fill", "white").attr("opacity", "0.8");

    privacyBackendStatus.displayDanger("IE-block-error", 10000000000);
  }
}

/** Block mobile browsers when detected, not the same as IE as foreignObject allows text to wrap in multiple lines on small screens. */
function mobileBlock() {
  if (detectMobile()) {
    kgp.svg.append("rect").attr("width", kgp.svgWidth).attr("height", kgp.svgHeight).attr("fill", "white").attr("opacity", "0.8");

    kgp.svg.append("foreignObject").attr("y", kgp.svgHeight / 4).attr("width", kgp.svgWidth).attr("height", kgp.svgHeight).append("xhtml:div").attr("style", "max:width:100%;").attr("data-i18n", "mobile-block");

    privacyBackendStatus.displayDanger("mobile-block", 10000000000);
  }
}

var TrashButton = function () {
  function TrashButton(domId, kgp) {
    var listeners = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, TrashButton);

    this.domId = domId;
    this.kgp = kgp;
    this.listeners = listeners;
    this.init();
  }

  _createClass(TrashButton, [{
    key: "init",
    value: function init() {
      d3.select("#" + this.domId).remove();
      // trash button
      this.trashButton = this.kgp.addSvgButton("\uF2ED", this.domId, "hint-trash", 0);
      var self = this;
      Object.keys(this.listeners).forEach(function (k) {
        return self.trashButton.on(k, self.listeners[k]);
      });
    }
  }, {
    key: "on",
    value: function on(event, listener) {
      this.listeners[event] = listener;
      this.trashButton.on(event, listener);
    }
  }]);

  return TrashButton;
}();

// 9.12.2019: untested and unused


var TrashButtonWithConfirmation = function () {
  /**
   * Creates the trash button
   */
  function TrashButtonWithConfirmation(domId, kgp) {
    var _this = this;

    var confirmListeners = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

    _classCallCheck(this, TrashButtonWithConfirmation);

    this.domId = domId;
    this.kgp = kgp;
    this.listeners = confirmListeners;
    d3.select("#" + domId).remove();
    // trash button
    var self = this;
    var trashButton = this.kgp.addSvgButton("\uF2ED", domId, "hint-trash", 0);
    trashButton.on("click.confirm", function (d) {
      trashButton.select(".tooltip").remove();
      var confirmDiv = trashButton.append("foreignObject").attr("x", 0).attr("y", 25).attr("width", 250).attr("height", 80).classed("tooltip", true).append("xhtml:div").classed("tooltip-text", true).html("<span style='display:block;' " + self.kgp.i18n.keyAttr + "='trash-sure'></span>");
      // cancel button
      confirmDiv.append("button").classed("btn btn-large btn-primary", true).attr("style", "float:center;margin:2px;").html('<span ' + self.kgp.i18n.keyAttr + '="trash-cancel"></span> <i class="fas fa-times"></i>').on("click.cancel", function (d) {
        new TrashButtonWithConfirmation(self.domId, self.kgp, self.listeners);
      });
      // confirm button
      _this.trashButton = confirmDiv.append("button").classed("btn btn-large btn-danger", true).attr("style", "float:center;margin:2px;").html('<span ' + self.kgp.i18n.keyAttr + '="trash-confirm"></span> <i class="far fa-trash-alt"></i>').on("click.listeners", function (d) {
        self.listeners.forEach(function (f) {
          return f(d);
        });
        new TrashButtonWithConfirmation(self.domId, self.kgp, self.listeners);
      });
      // weird: manual rfresh needed...
      self.i18n.refresh();
    });
  }

  _createClass(TrashButtonWithConfirmation, [{
    key: "on",
    value: function on(event, listener) {
      this.trashButton.on(event, listener);
    }
  }]);

  return TrashButtonWithConfirmation;
}();
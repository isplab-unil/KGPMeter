"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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
    kgpMeterScoreRequestHandler.addListener(function (kgpPromise) {
      kgpPromise.then(function (kgpSuccess) {
        return kgp.privacyMetric = kgpSuccess.result.privacy_metric;
      }, function () {});
    });
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

      // once this is done (after 800ms), reset to the empty ftree
      setTimeout(function () {
        ftree = KinGenomicPrivacyMeter.getEmptyFamilyTree();
        d3.select("#familytree-g").remove();
        familyTreeArtist.init(0);
        self.saveFamilyTreeToLocalStorage();
      }, transitionDuration + 2);
    }
  }, {
    key: "saveFamilyTreeToLocalStorage",
    value: function saveFamilyTreeToLocalStorage() {
      var familyTreeKey = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "kgp-familyTree";
      var targetKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "kgp-targetId";
      var saveDateKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "kgp-saveDate";

      localStorage.setItem(familyTreeKey, JSON.stringify(ftree.serialize(["sequencedDNA", "lastSequencedDNA", "i18nName"])));
      localStorage.setItem(saveDateKey, +new Date());
      if (this.target) {
        localStorage.setItem(targetKey, kgp.target.id);
      } else {
        localStorage.setItem(targetKey, null);
      }
    }
  }, {
    key: "loadFamilyTreeFromLocalStorage",
    value: function loadFamilyTreeFromLocalStorage() {
      var familyTreeKey = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "kgp-familyTree";
      var targetKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "kgp-targetId";
      var saveDateKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "kgp-saveDate";
      var familyTreeClass = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : FamilyTreeLayout;

      var ftl = localStorage.getItem(familyTreeKey);
      var targetId = localStorage.getItem(targetKey);
      var saveDate = +localStorage.getItem(saveDateKey);
      //console.log("LOADING family tree, ftl = ", ftl, ", targetId = ",targetId, ", saveDate = ",saveDate)
      if (Boolean(ftl) & saveDate + 2 * 3600 * 1000 >= +new Date()) {
        ftl = familyTreeClass.unserialize(ftl);
        self.target = targetId ? ftl.nodes[targetId] : null;
        return ftl;
      }
      return null;
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
        self.saveFamilyTreeToLocalStorage();
      }
    }

    /** Update the svg width, called on window resizes */

  }, {
    key: "updateSvgWidth",
    value: function updateSvgWidth() {
      this.svgWidth = this.svg.node().parentNode.clientWidth;
      this.svg.attr("width", this.svgWidth);
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
      this.mobileBlock();
      this.IEBlock();
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

    /** block IE if detected, not the same as mobile as foreignObject not supported */

  }, {
    key: "IEBlock",
    value: function IEBlock() {
      var self = this;
      if (detectIE11()) {
        self.svg.append("rect").attr("width", self.svgWidth).attr("height", self.svgHeight).attr("fill", "white").attr("opacity", "0.8");

        privacyBackendStatus.displayDanger("IE-block-error", 10000000000);
      }
    }

    /** Block mobile browsers when detected, not the same as IE as foreignObject allows text to wrap in multiple lines on small screens. */

  }, {
    key: "mobileBlock",
    value: function mobileBlock() {
      var self = this;
      if (detectMobile()) {
        self.svg.append("rect").attr("width", self.svgWidth).attr("height", self.svgHeight).attr("fill", "white").attr("opacity", "0.8");

        self.svg.append("foreignObject").attr("y", self.svgHeight / 4).attr("width", self.svgWidth).attr("height", self.svgHeight).append("xhtml:div").attr("style", "max:width:100%;").attr("data-i18n", "mobile-block");

        privacyBackendStatus.displayDanger("mobile-block", 10000000000);
      }
    }

    /** Debugging: show node ids on hover */

  }, {
    key: "showNodesIds",
    value: function showNodesIds() {
      self.svgg.selectAll(".nodeg").append('text').text(function (d) {
        return d.id;
      })
      //.attr("class","node-id")
      .attr("transform", "translate(" + -50 + ",0)");
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
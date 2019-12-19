"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FamilyTree = function () {
  function FamilyTree(nodes) {
    _classCallCheck(this, FamilyTree);

    this.nodes = nodes;

    this.maxDepth = 0;
    this.minFreeIndivId = _.max(_.map(_.filter(this.nodes, function (n) {
      return n.tag == "INDI";
    }), function (nd) {
      return parseInt(nd.id.replace(/@|F|I/g, ""));
    })) + 1;
    this.minFreeFamId = _.max(_.map(_.filter(this.nodes, function (n) {
      return n.tag == "FAM";
    }), function (nd) {
      return parseInt(nd.id.replace(/@|F|I/g, ""));
    })) + 1;
    if (isNaN(this.minFreeIndivId)) {
      this.minFreeIndivId = 1;
    }
    if (isNaN(this.minFreeFamId)) {
      this.minFreeFamId = 1;
    }

    // add names to family nodes, and spouse() method
    this.nodes = _.forEach(this.nodes, function (n) {
      if (n.tag === "FAM") {
        n.name += " " + (n.husb ? n.husb.name : "") + "," + (n.wife ? n.wife.name : "");
      }
      FamilyTree.addSpouseMethod(n);
    });

    //compute nodes positions
    //this.computeLayout()
  }

  /**
   * Serialize the family tree in a JSON ready JS object
   * 
   * By default this only serializes the basic properties of nodes according to family-tree:
   * - id, name, sex, tag, fams, famc, chil, wife, husb
   * 
   * Moreover, FamilyTree nodes are linked (with properties fams, famc, chil, wife, husb) together
   * by references, this creates cycles.
   * Hence, this method also replace inter-nodes references by node ids.
   * 
   * @param {Array[string]} properties (optional) additional properties to be saved
   * @returns {Object} a JSON ready JS object with structure
   * {
   *   class : "FamilyTree", // Class of the object
   *   nodes : nodes, // nodes in an array with ids as links
   *   properties : properties // the list of properties the nodes have
   * }
   */


  _createClass(FamilyTree, [{
    key: "serialize",
    value: function serialize() {
      var properties = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      properties = ["id", "name", "sex", "tag", "fams", "famc", "chil", "wife", "husb"].concat(properties).filter(function (v, i, s) {
        return s.indexOf(v) === i;
      });
      var nodes = this.nodesArray();
      nodes = nodes.map(function (n) {
        var tr = {};
        properties.forEach(function (p) {
          return tr[p] = n[p];
        });
        return tr;
      });
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = nodes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var n = _step.value;

          n.fams = n.fams ? n.fams.map(function (f) {
            return f.id;
          }) : null;
          n.chil = n.chil ? n.chil.map(function (c) {
            return c.id;
          }) : null;
          n.famc = n.famc ? n.famc.id : null;
          n.wife = n.wife ? n.wife.id : null;
          n.husb = n.husb ? n.husb.id : null;
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

      return {
        class: "FamilyTree",
        nodes: nodes,
        properties: properties
      };
    }
    /** Takes care of re-establishing the object references in nodes links, the inverse of serialize()
     * 
     * @param {Array[nodes]} nodesArray an array of nodes, where the fams, famc, chil, wife, husb properties are node ids
     * @returns A dictionary with node ids as keys and nodes as values and fams, famc, chil, wife properties are direct references
     */

  }, {
    key: "nodesArray",
    value: function nodesArray() {
      return _.map(this.nodes, function (n) {
        return n;
      });
    }

    /**
     * Checks whether the Family Tree contains the given node (a node with id property or directly a str id)
     * @param {node or str} node 
     */

  }, {
    key: "contains",
    value: function contains(node) {
      return Boolean(node.id ? this.nodes[node.id] : this.nodes[node]);
    }

    /**
     * Get links between all nodes: parents, children and family nodes
     */

  }, {
    key: "getLinks",
    value: function getLinks() {
      var links = [];
      _.forEach(this.nodes, function (node) {
        if (node.famc) {
          links.push([node.famc, node]);
        }
        if (node.wife) {
          links.push([node.wife, node]);
        }
        if (node.husb) {
          links.push([node.husb, node]);
        }
      });
      return links;
    }
  }, {
    key: "getLinksAsIds",
    value: function getLinksAsIds() {
      return this.getLinks().map(function (l) {
        return l.map(function (n) {
          return n.id;
        });
      });
    }

    /**
     * Get links between parents and children, removing family nodes
     */

  }, {
    key: "getParentChildLinks",
    value: function getParentChildLinks() {
      var links = [];
      var addEdge = function addEdge(a, b) {
        links.push([a, b]);
      };
      this.nodesArray().filter(function (n) {
        return n.tag == "FAM";
      }).forEach(function (familyNode) {
        if (familyNode.chil) {
          familyNode.chil.forEach(function (child) {
            if (familyNode.wife) addEdge(familyNode.wife, child);
            if (familyNode.husb) addEdge(familyNode.husb, child);
          });
        }
      });
      return links;
    }
  }, {
    key: "getParentChildLinksAsIds",
    value: function getParentChildLinksAsIds() {
      return this.getParentChildLinks().map(function (link) {
        return [link[0].id, link[1].id];
      });
    }

    /*
    Computes depth of all the nodes in the family tree
    Also computes max- and min-deph reachable from node relative to centerNode
    adds following properties to each node:
    - depth
    - minDepth
    - maxDepth
    */

  }, {
    key: "_computeDepths",
    value: function _computeDepths(startNode) {

      _.forEach(this.nodes, function (n) {
        return delete n.depth;
      });
      this._computeDepthsRecursive(startNode, 0);

      //ensure non-negative depths & compute family tree global maximum depth
      var depthExtent = d3.extent(_.map(this.nodes, function (n) {
        return n.depth;
      }));
      var minDepth = depthExtent[0];
      this.maxDepth = depthExtent[1] - minDepth;
      //this.nodes = _.mapValues(this.nodes, n=> {n.depth-=minDepth;return n})
      _.forEach(this.nodes, function (n) {
        n.depth -= minDepth;
        n.minDepth -= minDepth;
        n.maxDepth -= minDepth;
      });
    }
  }, {
    key: "_computeDepthsRecursive",
    value: function _computeDepthsRecursive(node, depth) {
      var _this = this;

      if (!node) {
        return;
      }
      //console.log("_computeDepthsRecursive! "+node.id+" at depth "+depth)
      if (node.depth != undefined) {
        if (node.depth != depth) {
          throw "DepthError: " + node.id + " resolves to 2 different depths: " + node.depth + " and " + depth;
        }
        return;
      }
      var maxmindepths = [[depth, depth]];

      node.depth = depth;
      maxmindepths.push(this._computeDepthsRecursive(node.husb, depth));
      maxmindepths.push(this._computeDepthsRecursive(node.wife, depth));
      maxmindepths.push(this._computeDepthsRecursive(node.famc, depth - 1));
      if (node.fams) {
        node.fams.forEach(function (fam) {
          return maxmindepths.push(_this._computeDepthsRecursive(fam, depth));
        });
      }
      if (node.chil) {
        node.chil.map(function (chil) {
          return maxmindepths.push(_this._computeDepthsRecursive(chil, depth + 1));
        });
      }
      maxmindepths = maxmindepths.filter(function (mmd) {
        return mmd != undefined;
      });
      node.minDepth = d3.min(maxmindepths, function (d) {
        return d[0];
      });
      node.maxDepth = d3.max(maxmindepths, function (d) {
        return d[1];
      });
      return [node.minDepth, node.maxDepth];
    }
  }, {
    key: "getNode",
    value: function getNode(nodeOrNodeId) {
      return _.isString(nodeOrNodeId) ? this.nodes[nodeOrNodeId] : nodeOrNodeId;
    }

    /* add a family to tree, wife, husb chil must be nodes or node ids*/

  }, {
    key: "addFamily",
    value: function addFamily(wife, husb, child) {
      //console.log("addFamily")
      var node = {
        id: FamilyTree.gedcomId(this.minFreeFamId++, "F"),
        tag: "FAM",
        wife: this.getNode(wife),
        husb: this.getNode(husb),
        chil: [child].map(this.getNode).filter(function (x) {
          return x != undefined;
        }),
        spouse: function spouse() {
          return undefined;
        }
      };
      this.nodes[node.id] = node;
      return node;
    }

    /* add an individual to tree, famcId,famsId must be nodes or node ids*/

  }, {
    key: "addIndividual",
    value: function addIndividual(name, famc, fams, sex) {
      //console.log("addIndividual")
      var node = {
        id: FamilyTree.gedcomId(this.minFreeIndivId++),
        tag: "INDI",
        name: name,
        famc: this.getNode(famc),
        fams: [fams].map(this.getNode).filter(function (x) {
          return x != undefined;
        }),
        sex: sex
      };
      FamilyTree.addSpouseMethod(node);
      this.nodes[node.id] = node;

      return node;
    }

    /* add child to given parent in tree
    Also adds spouse if needed
    */

  }, {
    key: "addChild",
    value: function addChild(name, sex, parent) {
      var addSpouseToo = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
      var spouseDefaultName = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : "spouse";

      //console.log("addChild")
      parent = this.getNode(parent);
      var famc = parent.fams[0];
      if (!famc) {
        famc = parent.sex == "F" ? this.addFamily(parent) : this.addFamily(undefined, parent);
        parent.fams.push(famc);
      }
      if (addSpouseToo && !parent.spouse()) {
        this.addSpouse(spouseDefaultName, parent);
      }
      var child = this.addIndividual(name, famc, undefined, sex);
      famc.chil.push(child);
      return child;
    }

    /* add a parent to given child in tree, childId must be a node id or undefined*/

  }, {
    key: "addParent",
    value: function addParent(name, sex, child) {
      child = this.getNode(child);
      //console.log("addParent")
      var fams = child.famc;
      if (!fams) {
        fams = this.addFamily(undefined, undefined, child);
        child.famc = fams;
      }
      var parent = sex === "F" ? fams.wife : fams.husb;
      if (parent) {
        return parent;
      }
      parent = this.addIndividual(name, undefined, fams, sex);
      sex == "F" ? fams.wife = parent : fams.husb = parent;
      return parent;
    }

    /* add a spouse to given spouse in tree, spouseId must be a node id or undefined*/

  }, {
    key: "addSpouse",
    value: function addSpouse(name, spouse) {
      var spouse1 = this.getNode(spouse);
      //console.log("addParent")
      var fams = spouse1.fams[0];
      if (!fams) {
        fams = spouse1.sex == "F" ? this.addFamily(spouse1) : this.addFamily(undefined, spouse1);
        spouse1.fams.push(fams);
      }
      var spouse2 = spouse1.sex === "F" ? fams.husb : fams.wife;
      if (spouse2) {
        return spouse2;
      }
      spouse2 = this.addIndividual(name, undefined, fams, spouse1.sex === "F" ? "M" : "F");
      spouse2.sex == "F" ? fams.wife = spouse2 : fams.husb = spouse2;
      return spouse2;
    }

    /*
    properly removes a given node from the family tree, including links and references to it.
    Also automatically deletes family nodes that are no longer needed.
    Can also delete all the nodes that are no longer connected to the main tree.
     arguments:
    - node: node or node id to be deleted
    - deleteNodesNotConnectedTo: node or node id, the function deletes all the nodes that are no longer connected to it once the first node has been removed.
    */

  }, {
    key: "deleteNode",
    value: function deleteNode(node) {
      var deleteNodesNotConnectedTo = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      node = this.getNode(node);
      //console.log("deleteNode, node.id="+node.id+", ")
      if (!node) {
        return new Set();
      }

      // remove references to this node in other connected nodes
      if (node.famc) {
        node.famc.chil = node.famc.chil.filter(function (c) {
          return c.id != node.id;
        });
      }
      if (node.husb) {
        node.husb.fams = node.husb.fams.filter(function (c) {
          return c.id != node.id;
        });
      }
      if (node.wife) {
        node.wife.fams = node.wife.fams.filter(function (c) {
          return c.id != node.id;
        });
      }
      if (node.chil) {
        node.chil.forEach(function (c) {
          return delete c.famc;
        });
      }
      if (node.fams) {
        node.fams.forEach(function (c) {
          if (c.wife && c.wife.id == node.id) {
            delete c.wife;
          }
          if (c.husb && c.husb.id == node.id) {
            delete c.husb;
          }
        });
      }
      var deletedNodeId = node.id;
      delete this.nodes[node.id];

      // remove family nodes that are no longer needed
      var needlessFamilies = _.filter(this.nodes, function (n) {
        return n.tag === "FAM" && (
        //( (!n.wife) && (!n.husb)  && (n.chil?n.chil.length<=1:true)) || // no wife, no husb and 1 child -> family no longer needed
        !n.wife && !n.husb || // no wife, no husb -> family no longer needed
        (!n.wife || !n.husb) && (n.chil ? n.chil.length == 0 : true) // only 1 spouse and no child -> family no longer needed
        );
      });
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = needlessFamilies[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var fam = _step2.value;
          this.deleteNode(fam);
        }

        // also eliminate elements that are no longer connected to the deleteNodesNotConnectedTo node and families without spouses
        //console.log("deleteNode, nodes pre-_computeDepths():")
        //console.log(this.nodes)
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      var noLongerConnectedNodesIds = [];
      if (deleteNodesNotConnectedTo) {
        var startNode = this.getNode(deleteNodesNotConnectedTo);
        this._computeDepths(startNode);
        noLongerConnectedNodesIds = _.filter(this.nodes, function (n) {
          return n.depth == undefined || isNaN(n.depth);
        }).map(function (n) {
          return n.id;
        });
      }
      var deletedNodeIds = new Set([].concat(_toConsumableArray(noLongerConnectedNodesIds), _toConsumableArray(needlessFamilies.map(function (n) {
        return n.id;
      })))).add(deletedNodeId);
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = deletedNodeIds[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var nid = _step3.value;
          delete this.nodes[nid];
        }

        // ensure clean chil and fams arrays
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      this.cleanChilArrays();
      this.cleanFamsArrays();

      return deletedNodeIds;
    }

    // ensure there aren't any "undefined" element in nodes' chil or fams arrays

  }, {
    key: "cleanChilArrays",
    value: function cleanChilArrays() {
      _.forEach(this.nodes, function (node) {
        return node.chil ? node.chil = node.chil.filter(Boolean) : node.chil;
      });
    }
  }, {
    key: "cleanFamsArrays",
    value: function cleanFamsArrays() {
      _.forEach(this.nodes, function (node) {
        return node.fams ? node.fams = node.fams.filter(Boolean) : node.fams;
      });
    }
  }], [{
    key: "unserializeParseNodes",
    value: function unserializeParseNodes(serializedFtree) {
      var nodesDict = {};
      serializedFtree.nodes.forEach(function (n) {
        return nodesDict[n.id] = n;
      });
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = serializedFtree.nodes[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var n = _step4.value;

          n.fams = n.fams ? n.fams.map(function (f) {
            return nodesDict[f];
          }) : [];
          n.chil = n.chil ? n.chil.map(function (c) {
            return nodesDict[c];
          }) : [];
          n.famc = n.famc ? nodesDict[n.famc] : null;
          n.wife = n.wife ? nodesDict[n.wife] : null;
          n.husb = n.husb ? nodesDict[n.husb] : null;
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      return nodesDict;
    }
    /** Unserializes a FamilyTree serialized with JSON.stringify(FamilyTree.serialize())
     * 
     * @param {string} serializedFtree
     * @returns {FamilyTree}
     */

  }, {
    key: "unserialize",
    value: function unserialize(serializedFtree) {
      serializedFtree = JSON.parse(serializedFtree);
      return new FamilyTree(FamilyTree.unserializeParseNodes(serializedFtree));
    }
  }, {
    key: "gedcomId",
    value: function gedcomId(idnb) {
      var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "I";

      return "@" + type + idnb + "@";
    }
  }, {
    key: "addSpouseMethod",
    value: function addSpouseMethod(n) {
      n.spouse = function () {
        var famsIndex = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

        // only if desired fams exists...
        if (this.fams && this.fams.length > famsIndex) {
          var fams = this.fams[famsIndex];
          // only if both spouses... present
          if (fams.wife && fams.husb) {
            // ...can we find the spouse
            return this.id == fams.wife.id ? fams.husb : fams.wife;
          }
        }
        return undefined;
      };
    }
  }]);

  return FamilyTree;
}();
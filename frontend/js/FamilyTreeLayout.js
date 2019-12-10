"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var FamilyTreeLayout = function (_FamilyTree) {
  _inherits(FamilyTreeLayout, _FamilyTree);

  function FamilyTreeLayout(nodes, centerNodeId) {
    _classCallCheck(this, FamilyTreeLayout);

    // if no centerNodeId, set it as the first family with 2 spouses
    var _this = _possibleConstructorReturn(this, (FamilyTreeLayout.__proto__ || Object.getPrototypeOf(FamilyTreeLayout)).call(this, nodes));

    if (!centerNodeId) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.keys(nodes)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var n = _step.value;

          if (nodes[n].tag === "FAM" & (nodes[n].husb != undefined | nodes[n].wife != undefined)) // only 1 spouse
            centerNodeId = nodes[n].id;
          if (nodes[n].tag === "FAM" & nodes[n].husb != undefined & nodes[n].wife != undefined) {
            centerNodeId = nodes[n].id;
            break;
          }
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
    }
    _this.centerNode = _this.nodes[centerNodeId];

    //compute nodes positions
    //this.computeLayout()
    return _this;
  }

  _createClass(FamilyTreeLayout, [{
    key: "serialize",


    /** Serializes FamilyTree layout to a JSON ready JS Object
     * Only need to call JSON.stringify() to transform it to string.
     * @returns {Object} {
     *   class : "FamilyTreeLayout", // Class of the object
     *   nodes : nodes, // nodes in an array with ids as links
     *   properties : properties // the list of properties the nodes have
     *   centerNodeId : centerNodeId // the id of the node around which the layout is organized
     * }
     */
    value: function serialize() {
      var properties = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      var serialization = FamilyTreeLayout.parentClass().serialize.call(this, properties);
      serialization.class = "FamilyTreeLayout";
      serialization.centerNodeId = this.centerNode ? this.centerNode.id : 0;
      return serialization;
    }
    /** Inverse of JSON.stringify(FamilyTreeLayout.serialize())
     * @param {string} serializedFtreeLayout
     * @returns {FamilyTreeLayout}
     */

  }, {
    key: "computeLayout",


    /**
    Function computing x&y positions for each node
     the idea is:
    a) massage the family tree in a good input format for d3-pedigree-tree to do the layout
    b) then massage the output back in a proper layout for the family tree.
     step a):
    1) wives and husbands are filtered out
    2) their fams node takes their parents families (both famc) as their parents
    3) individual node take as parent their famc
    4) nodes without parents and at depth>0 are given dummy-parents so that d3-pedigree layouts them at the right depth
    5) we give those nodes to d3-pedigree-tree
     step b):
    1) invert x&y values (d3-pedigree-tree makes an horizontal layout)
    */
    value: function computeLayout() {
      var _this2 = this;

      var nodes = this.nodesArray();
      ftree._computeDepths(nodes[0]);

      var indiNodes = nodes.filter(function (n) {
        return n.tag == "INDI";
      });
      var dummyNodeId = 0;
      var dummyNodes = [];
      indiNodes.forEach(function (n) {
        delete n.parents;
      });
      indiNodes.forEach(function (n) {
        var spouse = n.spouse() || {};
        if (spouse.parents) {
          // parents are the same for both spouses
          n.parents = spouse.parents;
        } else {
          if (!n.famc && !spouse.famc) {
            // if no ancestors for both parents: give them a virtual ancestor
            for (var i = -1; i < n.depth; i++) {
              var dummyParents = i != -1 ? [dummyNodes[dummyNodeId - 1]] : [];
              dummyNodes.push({ id: "@D" + dummyNodeId + "@", depth: i, parents: dummyParents });
              dummyNodeId++;
            }
            n.parents = [dummyNodes[dummyNodeId - 1]];
          } else {
            // otherwise, the ancestors are both spouses' parents
            n.parents = n.famc ? [n.famc.wife, n.famc.husb] : [];
            if (spouse && spouse.famc) {
              n.parents.push(spouse.famc.wife);
              n.parents.push(spouse.famc.husb);
            }
            n.parents = n.parents.filter(Boolean);
          }
        }
        // couples without children must have a virtual kid to get them together
        if (n.spouse() && (!n.fams[0].chil || n.fams[0].chil.length == 0)) {
          dummyNodes.push({ id: "@D" + dummyNodeId + "@", depth: n.depth + 1, parents: [n, spouse] });
          dummyNodeId++;
        }
      });
      indiNodes = indiNodes.concat(dummyNodes);
      // ========= sort nodes by x factor
      indiNodes.sort(function (a, b) {
        var ax = a.x ? a.x : 0;
        var bx = b.x ? b.x : 0;
        return ax - bx;
      });

      var tree = d3.pedigreeTree().levelWidth(150).nodePadding(120).linkPadding(25).parents(function (d) {
        return d.parents;
      }).groupChildless(false).iterations(300).data(indiNodes);

      var treepp = tree();
      treepp.nodes.forEach(function (node) {
        if (_this2.nodes[node.id]) {
          _this2.nodes[node.id].x = node.y;
          _this2.nodes[node.id].y = node.x;
        }
      });
      /*console.log("treepp.nodes")
      console.log(treepp.nodes)
      console.log("nodes")
      console.log(nodes)*/

      // position marriages
      var famNodes = nodes.filter(function (d) {
        return d.tag === "FAM";
      });
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = famNodes[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var fam = _step2.value;

          if (fam.wife && fam.husb) {
            fam.x = (fam.wife.x + fam.husb.x) / 2;
            fam.y = fam.wife.y;
          } else {
            var spouse = [fam.wife, fam.husb].filter(Boolean)[0];
            if (spouse) {
              fam.x = spouse.x;
              fam.y = spouse.y;
            }
          }
        }

        // spouses can be reverted -> sort them according to famc.x
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

      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = nodes.filter(function (d) {
          return d.tag === "INDI";
        })[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var indi = _step3.value;

          var spouse = indi.spouse();
          if (indi.famc && spouse && spouse.famc) {
            if (indi.x > spouse.x && indi.famc.x < spouse.famc.x) {
              var tempx = indi.x;
              indi.x = spouse.x;
              spouse.x = tempx;
            }
          }
        }
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
    }

    /*
    Re-centers the graph. position 0,0 is in the middle of all nodes position
    */

  }, {
    key: "center",
    value: function center() {
      var horizontal = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      var vertical = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      var xoffset = -(this.minX() + this.maxX()) / 2;
      var yoffset = -(this.minY() + this.maxY()) / 2;
      _.forEach(this.nodes, function (n) {
        n.x += horizontal ? xoffset : 0;
        n.y += vertical ? yoffset : 0;
      });
      return this;
    }
  }, {
    key: "width",
    value: function width() {
      var extent = d3.extent(_.map(this.nodes, function (n) {
        return n.x;
      }));
      return extent[1] - extent[0];
    }
  }, {
    key: "height",
    value: function height() {
      var extent = d3.extent(_.map(this.nodes, function (n) {
        return n.y;
      }));
      return extent[1] - extent[0];
    }
  }, {
    key: "minX",
    value: function minX() {
      return d3.min(_.map(this.nodes, function (n) {
        return n.x;
      }));
    }
  }, {
    key: "minY",
    value: function minY() {
      return d3.min(_.map(this.nodes, function (n) {
        return n.y;
      }));
    }
  }, {
    key: "maxX",
    value: function maxX() {
      return d3.max(_.map(this.nodes, function (n) {
        return n.x;
      }));
    }
  }, {
    key: "maxY",
    value: function maxY() {
      return d3.max(_.map(this.nodes, function (n) {
        return n.y;
      }));
    }
  }], [{
    key: "parentClass",
    value: function parentClass() {
      return FamilyTree.prototype;
    }
  }, {
    key: "unserialize",
    value: function unserialize(serializedFtreeLayout) {
      serializedFtreeLayout = JSON.parse(serializedFtreeLayout);
      var ftree = new FamilyTreeLayout(FamilyTree.unserializeParseNodes(serializedFtreeLayout), serializedFtreeLayout.centerNodeId);
      return ftree;
    }
  }]);

  return FamilyTreeLayout;
}(FamilyTree);
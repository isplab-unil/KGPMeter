"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var KgpSurvey = function () {
  function KgpSurvey(api_endpoint, userId, i18n) {
    var launchWaitTimeBasis = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 60;
    var launchWaitTimePoissonMean = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 90;
    var launchWaitTimeMax = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 300;

    _classCallCheck(this, KgpSurvey);

    this.api_endpoint = api_endpoint;
    this.questions = ["prior-knowledge", "score-exp", "you-or-family", "utility-website", "nps", "survey-comment", "survey-sex", "survey-age", "survey-own-sequence", "survey-other-sequence"];
    this.userId = userId;
    this.i18n = i18n;

    var self = this;

    // Waiting time: 1m + poisson at mean 1m30
    this.timestampFirstRequest = null;
    this.launchWaitTimeBasis = launchWaitTimeBasis;
    this.launchWaitTimePoissonMean = launchWaitTimePoissonMean;
    this.launchWaitTimeMax = launchWaitTimeMax;
    this.launchWaitTime = 10 * launchWaitTimeMax;
    while (this.launchWaitTime > this.launchWaitTimeMax) {
      this.launchWaitTime = this.launchWaitTimeBasis + poissonProcess.sample(this.launchWaitTimePoissonMean);
    }

    // survey launch conditions
    this.signaturesRequestedTrees = new Set();
    this.twoNodesAdded = false;
    this.threeRequestsAsked = false;
    this.oneTarget = false;
    this.surveyNotStarted = true;

    this.surveyTrigger = undefined;

    // send question answer on change 
    this.questions.forEach(function (questionId) {
      $("#" + questionId + " input").on("change", function (a, b, c) {
        var json_to_send = {
          question_code: questionId,
          answer: $(this).val(),
          survey_trigger: self.surveyTrigger,
          user: {
            id: self.userId,
            lng: self.i18n.lng
          }
        };
        fetch(self.api_endpoint, {
          method: 'POST',
          body: JSON.stringify(json_to_send)
        });
      });
      // success!
    });

    // comment: different
    $("#survey-comment-text").on("change", function (a, b, c) {
      var json_to_send = {
        question_code: "survey-comment",
        answer: $(this).val(),
        survey_trigger: self.surveyTrigger,
        user: {
          id: self.userId,
          lng: self.i18n.lng
        }
      };
      fetch(self.api_endpoint, {
        method: 'POST',
        body: JSON.stringify(json_to_send)
      });
    });

    this.updateSurveyVolunteerButton(0);
  }

  /**
   * Check that conditions to launch the survey are filled.
   */


  _createClass(KgpSurvey, [{
    key: "checkSurveyLaunchConditions",
    value: function checkSurveyLaunchConditions(target) {
      var nodes = ftree.nodesArray().filter(function (n) {
        return !n.id.match(/f|F/);
      });
      this.twoNodesAdded = nodes.length >= 3;
      //let oneNodeSequenced = nodes.filter(n => n.sequencedDNA).length >= 1
      this.threeRequestsAsked = this.signaturesRequestedTrees.size >= 3;
      this.oneTarget = Boolean(target);
      this.surveyNotStarted = !this.getSurveyStatus();
      //console.log("twoNodesAdded=",twoNodesAdded,", threeRequestsAsked=",threeRequestsAsked,", oneTarget=",oneTarget,", !surveyStarted", !surveyStarted)

      return this.twoNodesAdded && this.threeRequestsAsked && this.oneTarget && this.surveyNotStarted;
    }

    /**
     * launch the survey
     * @param {*} trigger either "volunteer", "automatic", "resume"
     */

  }, {
    key: "launchSurvey",
    value: function launchSurvey(trigger) {
      var status = this.getSurveyStatus();
      if (status != "finished") {
        this.surveyTrigger = trigger;
        this.setSurveyStatus("launched");
        $("#modal-survey").modal('show');
      }
      //$('#modal-survey').on('hidden.bs.modal', function (e) {if(getSurveyStatus()!="finished"){ showSurveyVolunteerButton() }})
    }
  }, {
    key: "await",
    value: function _await(kgpPromise, request, previousResponse) {
      var _this = this;

      var self = this;
      kgpPromise.then(function (kgpSuccess) {
        _this.signaturesRequestedTrees.add(kgpSuccess.tree_signature);
        // if needed, set timestamp of first request
        if (!_this.timestampFirstRequest) {
          _this.timestampFirstRequest = kgpSuccess.timestamp_js;
        }
        // if launch conditions filled: launch survey (after required timeout)
        if (_this.checkSurveyLaunchConditions(request.family_tree.target)) {
          var now = +new Date();
          var timeSinceFirstRequest = now - _this.timestampFirstRequest;
          var timeout = void 0;
          if (timeSinceFirstRequest > 1000 * _this.launchWaitTime) {
            // if the launchWaitTime is elapsed: launch after 5 seconds
            timeout = 5000;
          } else {
            // if the launchWaitTime isn't elapsed yet: launch after the time delta
            timeout = 1000 * _this.launchWaitTime - timeSinceFirstRequest;
          }
          setTimeout(function () {
            return self.launchSurvey("automatic");
          }, timeout);
        }
      }).catch(function () {});
    }
  }, {
    key: "updateSurveyVolunteerButton",
    value: function updateSurveyVolunteerButton() {
      var transitionSpeed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 500;

      var self = this;
      //
      var surveyStatus = this.getSurveyStatus();
      $("#survey-launch-button").off("click");
      // not launched: volunteer
      if (!surveyStatus) {
        $("#survey-launch-button span").attr(self.i18n.keyAttr, "survey-volunteer");
        $("#survey-launch-button").stop(true).slideDown(transitionSpeed);
        $("#survey-launch-button").on("click", function () {
          return self.launchSurvey("volunteer");
        });
        // launched: resume
      } else if (surveyStatus == "launched" || surveyStatus == "step-1-done") {
        $("#survey-launch-button span").attr(self.i18n.keyAttr, "survey-resume");
        $("#survey-launch-button").stop(true).slideDown(transitionSpeed);
        $("#survey-launch-button").on("click", function () {
          return self.launchSurvey("resume");
        });
        // finished: hide
      } else if (surveyStatus == "finished") {
        $("#survey-launch-button").stop(true).slideUp(transitionSpeed);
      }
    }
    /** from step 1 to step 2 */

  }, {
    key: "changePageSurvey",
    value: function changePageSurvey() {
      $("#survey-finish-step-1-button").hide();
      $("#survey-finish-step-2-button").show();
      $("#survey-step-1").hide();
      $("#survey-step-2").show();
      this.setSurveyStatus("step-1-done");
    }

    /** back to step 1 from step 2 */

  }, {
    key: "surveyPrevious",
    value: function surveyPrevious() {
      $("#survey-step-2").hide();
      $("#survey-finish-step-2-button").hide();
      $("#survey-step-1").show();
      $("#survey-finish-step-1-button").show();
      this.setSurveyStatus("launched");
    }

    /** finish at step 2 */

  }, {
    key: "closeSurvey",
    value: function closeSurvey() {
      $("#modal-survey").modal('hide');
      $("#survey-step-2").hide();
      $("#survey-finish-step-2-button").hide();
      $("#survey-step-1").show();
      $("#survey-finish-step-1-button").show();
      this.setSurveyStatus("finished");
    }

    /**
     * getSurveyStatus(): reads the survey-status cookie...
     * 
     * @returns undefined if not launched,
     *          "launched" if launched and step 1 not done,
     *          "step-1-done" if step 1 is done, but not step 2 (=user clicked on first finish button)
     *          "finished" if finished (=user clicked on second finish button)
     */

  }, {
    key: "getSurveyStatus",
    value: function getSurveyStatus() {
      return cookie.read("survey-status");
    }
  }, {
    key: "setSurveyStatus",
    value: function setSurveyStatus(status) {
      cookie.create("survey-status", status, 1);
      this.updateSurveyVolunteerButton();
    }
  }]);

  return KgpSurvey;
}();
# -*- coding: utf-8 -*-
__author__ = "Didier Dupertuis, Benjamin Trubert, Kévin Huguenin"
__copyright__ = "Copyright 2019, The Information Security and Privacy Lab at the University of Lausanne (https://www.unil.ch/isplab/)"
__credits__ = ["Didier Dupertuis", "Benjamin Trubert", "Kévin Huguenin", "Mathias Humbert"]

__version__ = "1"
__license__ = "MIT"
__maintainer__ = "Didier Dupertuis"
__email__ = "didier.dupertuis@unil.ch"

__project__ = "Data-less Kin Genomic Privacy Estimator"

from json import dumps

from flask import Response


class KgpResponse(Response):
    """
    Minimal JSON response to a Kin Genomic Privacy computation request
    Each relevant kgp_status must be a sub-class and override the as_dict() method.
    """
    _mimetype = "application/json"
    def __init__(self, kgp_status:str, timestamp_js:int, tree_signature:str, extras=None, allow_cross_origin=False):
        self.kgp_status = kgp_status
        self.timestamp_js = timestamp_js
        self.tree_signature = tree_signature
        if isinstance(extras,dict):
            self.extras = extras
        else:
            self.extras = {}
        super(KgpResponse, self).__init__(dumps(self.as_dict()), mimetype=KgpResponse._mimetype)
        if allow_cross_origin:
            # needed for local testing on localhost:5000 from localhost:4000, not needed on Apache server
            self.headers['Access-Control-Allow-Origin'] = '*'

    def as_dict(self):
        """Returns the dictionary that will be the JSON body of the response"""
        return {
            "status": self.kgp_status,
            "timestamp_js": self.timestamp_js,
            "tree_signature": self.tree_signature,
            "extras": self.extras
        }



class KgpError(KgpResponse):
    """
    Defines an error response to the computation request

    Either because the supplied tree is invalid or because the request is malformed
    """
    def __init__(self, timestamp_js:int, tree_signature:str, code:int, extras=None, allow_cross_origin=False):
        self.code = code
        super(KgpError, self).__init__('error', timestamp_js, tree_signature, extras, allow_cross_origin)

    def as_dict(self):
        dict_result = super(KgpError, self).as_dict()
        dict_result["code"] = self.code
        return dict_result


class KgpSuccess(KgpResponse):
    """
    Defines a successful response to the computation request, with corresponding result and metadata
    """
    def __init__(self, timestamp_js:int, tree_signature:str, privacy_metric:float, cached:bool, execution_time:float, extras=None, allow_cross_origin=False):
        self.privacy_metric = privacy_metric
        self.cached = cached
        self.execution_time = execution_time
        super(KgpSuccess, self).__init__("OK", timestamp_js, tree_signature, extras, allow_cross_origin)

    def as_dict(self):
        dict_result = super(KgpSuccess, self).as_dict()
        dict_result["result"] = {
            "privacy_metric": self.privacy_metric,
            "cached": self.cached,
            "execution_time": self.execution_time
        }
        return dict_result
# -*- coding: utf-8 -*-
__author__ = "Didier Dupertuis, Benjamin Trubert, Kévin Huguenin"
__copyright__ = "Copyright 2019, The Information Security and Privacy Lab at the University of Lausanne (https://www.unil.ch/isplab/)"
__credits__ = ["Didier Dupertuis", "Benjamin Trubert", "Kévin Huguenin", "Mathias Humbert"]

__version__ = "1"
__license__ = "MIT"
__maintainer__ = "Didier Dupertuis"
__email__ = "didier.dupertuis@unil.ch"

__project__ = "Data-less Kin Genomic Privacy Estimator"

import argparse
import logging
import os
import re
import sys
import warnings

from flask import Flask, redirect, request, send_from_directory

from api import privacy_score
from config import config

WSGI_PROJECT_DIR = os.path.dirname(os.path.realpath(__file__))
sys.path.insert(0, WSGI_PROJECT_DIR)

application = Flask(__name__)


# Test entry point: Redirects to API documentation.
@application.route('/')
def root():
    # TODO: 302 code to static doc page
    return 'Hello World!'


# Privacy score entry point: Computes privacy score from JSON request
application.route('/privacy-score', methods=["POST"])(privacy_score)

# main block used only in test mode; otherwise, app.py is imported from wsgi.py
if __name__ == '__main__':

    parser = argparse.ArgumentParser(description="Run the website in testing/debugging mode, DO NOT USE IN PRODUCTION")
    parser.add_argument('-t', '--test', help='Whether to serve the api (and folder content from --website) on localhost', action='store_true')
    parser.add_argument('-p', '--port', help='Port the app should be run from', type=int, default=5000)
    parser.add_argument('-w', '--website', help='Folder from which to serve files, will be served at the localhost:<port>/<website-url-path> location', type=str, default='website/')
    parser.add_argument('-u', '--website-url-path', help='URL path at which to serve --website folder content', type=str, default='website')
    args = parser.parse_args()

    if args.test:
        config["LOGGER"].warning("Running app in testing/debugging mode, DO NOT USE IN PRODUCTION")

        if not os.path.isdir(args.website):
            warnings.warn("--website argument at '" + args.website + "' isn't a valid directory, nothing served on localhost:%d/%s/" % (args.port, args.website_url_path))
        else:
            @application.route('/%s/' % args.website_url_path, defaults={'path': ""})
            @application.route('/%s/<path:path>' % args.website_url_path)
            def serve_static_debug_website(path):
                # TODO TOO MUCH OF A HACK
                if not re.search("\\.", path):
                    # add trailing slash if missing
                    if len(path) > 0 and not path.endswith("/"):
                        return redirect(request.path + "/", code=301)
                    # ...as well as index.html reference
                    path = path + "index.html"
                return send_from_directory(args.website, path)

        application.run(debug=True, port = args.port)

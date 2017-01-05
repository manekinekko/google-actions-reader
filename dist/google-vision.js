'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GoogleVisionInstance = exports.GoogleVision = exports.FEATURE_TYPE = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _nodeFetch = require('node-fetch');

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FEATURE_TYPE = exports.FEATURE_TYPE = {
    'TYPE_UNSPECIFIED': 'TYPE_UNSPECIFIED',
    'FACE_DETECTION': 'FACE_DETECTION',
    'LANDMARK_DETECTION': 'LANDMARK_DETECTION',
    'LOGO_DETECTION': 'LOGO_DETECTION',
    'LABEL_DETECTION': 'LABEL_DETECTION',
    'TEXT_DETECTION': 'TEXT_DETECTION',
    'SAFE_SEARCH_DETECTION': 'SAFE_SEARCH_DETECTION',
    'IMAGE_PROPERTIES': 'IMAGE_PROPERTIES'
};

var GoogleVision = exports.GoogleVision = function () {
    function GoogleVision() {
        _classCallCheck(this, GoogleVision);

        this.VISION_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate?key=' + process.env.GOOGLE_VISION_KEY;
    }

    /**
     * Process the user's query.
     * Available queries:
     * - LABEL_DETECTION  : for generic label extraction (default)
     * - FACE_DETECTION   : for facial expression
     * - TEXT_DETECTION   : for OCR text
     * - IMAGE_PROPERTIES : for dominant color extraction
     */


    _createClass(GoogleVision, [{
        key: 'process',
        value: function process(base64) {
            var feature = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : FEATURE_TYPE.TEXT_DETECTION;

            var request = {
                requests: [{
                    image: {
                        content: base64
                    },
                    features: [{
                        type: feature,
                        maxResults: 200
                    }]
                }]
            };
            return this.post(request);
        }

        /**
         * Send the request to the Google Vision API endpoint.
         */

    }, {
        key: 'post',
        value: function post(body) {
            var _this = this;

            var options = {
                method: 'POST',
                mode: 'cors',
                redirect: 'follow',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            };
            return (0, _nodeFetch2.default)(this.VISION_ENDPOINT, options).then(function (res) {
                return res.json();
            }).then(function (res) {
                return _this.processMetadata(res);
            }).catch(function (error) {
                return console.error(error);
            });
        }

        /**
         * Process the response result from the Vision endpoint.
         */

    }, {
        key: 'processMetadata',
        value: function processMetadata(data) {
            data.responses = data.responses || {};
            if (Array.isArray(data.responses)) {
                data.responses = data.responses.pop();
            }

            if (data.responses.labelAnnotations) {
                var _ret = function () {
                    var labels = [];
                    (data.responses.labelAnnotations || []).forEach(function (lbl) {
                        labels.push(lbl.description);
                    });
                    return {
                        v: { labels: labels }
                    };
                }();

                if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
            }

            if (data.responses.faceAnnotations) {
                var _ret2 = function () {
                    var face = [];
                    (data.responses.faceAnnotations || []).forEach(function (expression) {
                        for (var exp in expression) {
                            if (exp.indexOf('Likelihood') !== -1) {
                                face.push(exp.replace('Likelihood', ''));
                            }
                        }
                    });
                    return {
                        v: { face: face }
                    };
                }();

                if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
            }

            if (data.responses.imagePropertiesAnnotation) {
                var colorResponse = data.responses.imagePropertiesAnnotation.dominantColors.colors.sort(function (colorA, colorB) {
                    return colorA.score > colorB.score;
                }).pop();
                var color = colorResponse.color;
                return { color: this.findNearestColorName(color) };
            }

            if (data.responses.textAnnotations) {
                var text = (data.responses.textAnnotations || []).shift();
                return { text: text.description };
            }

            return [];
        }

        /**
         * Find the nearest color name based on the RGB color extracted from the image.
         */

    }, {
        key: 'findNearestColorName',
        value: function findNearestColorName(color) {
            var _this2 = this;

            return COLORS[Object.keys(COLORS).map(function (arrayColor, key, arr) {
                return { color: arr[key], distance: _this2.colorDistance(color, _this2.hexToRgb(arrayColor)) };
            }).sort(function (a, b) {
                return a.distance > b.distance ? -1 : 1;
            }).pop().color];
        }

        /**
         * Convert HEX color to RGB values
         */

    }, {
        key: 'hexToRgb',
        value: function hexToRgb(hex) {
            return {
                red: parseInt(hex.substr(0, 2), 16),
                green: parseInt(hex.substr(2, 2), 16),
                blue: parseInt(hex.substr(4, 2), 16)
            };
        }

        /**
         * Compute the distance between two RGB colors
         */

    }, {
        key: 'colorDistance',
        value: function colorDistance(left, right) {
            return Math.abs(left.red - right.red) + Math.abs(left.green - right.green) + Math.abs(left.blue - right.blue);
        }
    }]);

    return GoogleVision;
}();

var GoogleVisionInstance = exports.GoogleVisionInstance = new GoogleVision();
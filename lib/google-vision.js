import fetch from 'node-fetch';

export const FEATURE_TYPE = {
    'TYPE_UNSPECIFIED': 'TYPE_UNSPECIFIED',
    'FACE_DETECTION': 'FACE_DETECTION',
    'LANDMARK_DETECTION': 'LANDMARK_DETECTION',
    'LOGO_DETECTION': 'LOGO_DETECTION',
    'LABEL_DETECTION': 'LABEL_DETECTION',
    'TEXT_DETECTION': 'TEXT_DETECTION',
    'SAFE_SEARCH_DETECTION': 'SAFE_SEARCH_DETECTION',
    'IMAGE_PROPERTIES': 'IMAGE_PROPERTIES'
};

export class GoogleVision {

    VISION_ENDPOINT = `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_KEY}`;

    constructor() {}

    /**
     * Process the user's query.
     * Available queries:
     * - LABEL_DETECTION  : for generic label extraction (default)
     * - FACE_DETECTION   : for facial expression
     * - TEXT_DETECTION   : for OCR text
     * - IMAGE_PROPERTIES : for dominant color extraction
     */
    process(base64, feature = FEATURE_TYPE.TEXT_DETECTION) {
        let request = {
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
    post(body) {
        const options = {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }
        return fetch(this.VISION_ENDPOINT, options)
            .then(res => res.json())
            .then(res => this.processMetadata(res))
            .catch(error => console.error(error));
    }

    /**
     * Process the response result from the Vision endpoint.
     */
    processMetadata(data) {
        data.responses = data.responses || {};
        if (Array.isArray(data.responses)) {
            data.responses = data.responses.pop();
        }

        if (data.responses.labelAnnotations) {
            let labels = [];
            (data.responses.labelAnnotations || []).forEach((lbl) => {
                labels.push(lbl.description);
            });
            return { labels };
        }

        if (data.responses.faceAnnotations) {
            let face = [];
            (data.responses.faceAnnotations || []).forEach((expression) => {
                for (var exp in expression) {
                    if (exp.indexOf('Likelihood') !== -1) {
                        face.push(exp.replace('Likelihood', ''));
                    }
                }
            });
            return { face };
        }

        if (data.responses.imagePropertiesAnnotation) {
            let colorResponse = data.responses
                .imagePropertiesAnnotation
                .dominantColors
                .colors
                .sort((colorA, colorB) => colorA.score > colorB.score)
                .pop();
            let color = colorResponse.color;
            return { color: this.findNearestColorName(color) };
        }

        if (data.responses.textAnnotations) {
            let text = (data.responses.textAnnotations || []).shift();
            return { text: text.description };
        }

        return [];
    }

    /**
     * Find the nearest color name based on the RGB color extracted from the image.
     */
    findNearestColorName(color) {
        return COLORS[
            Object
            .keys(COLORS)
            .map((arrayColor, key, arr) => {
                return { color: arr[key], distance: this.colorDistance(color, this.hexToRgb(arrayColor)) };
            })
            .sort((a, b) => a.distance > b.distance ? -1 : 1)
            .pop().color
        ];
    }

    /**
     * Convert HEX color to RGB values
     */
    hexToRgb(hex) {
        return {
            red: parseInt(hex.substr(0, 2), 16),
            green: parseInt(hex.substr(2, 2), 16),
            blue: parseInt(hex.substr(4, 2), 16),
        };
    }

    /**
     * Compute the distance between two RGB colors
     */
    colorDistance(left, right) {
        return Math.abs(left.red - right.red) + Math.abs(left.green - right.green) + Math.abs(left.blue - right.blue);
    }

}

export const GoogleVisionInstance = new GoogleVision();
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _googleActionsServer = require('@manekinekko/google-actions-server');

var _googleVision = require('./google-vision');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MyAction = function () {
    function MyAction() {
        _classCallCheck(this, MyAction);

        // create a google action server
        this.agent = new _googleActionsServer.ActionServer();

        this.agent.setGreetings(['Hello. Place your document in front of your camera and when you are ready, just say "read this for me".']);

        this.agent.setConversationMessages(['Try again', 'Let\'s try again', 'Give it another try']);

        this.assistant = null;
    }

    // the (default) intent triggered to welcome the user


    _createClass(MyAction, [{
        key: 'welcomeIntent',
        value: function welcomeIntent(assistant) {
            this.assistant = assistant;
            this.agent.randomGreeting();
        }

        // the intent triggered on user's requests

    }, {
        key: 'textIntent',
        value: function textIntent(assistant) {
            var _this = this;

            this.assistant = assistant;
            var rawInput = assistant.getRawInput();

            switch (rawInput) {
                case 'read':
                case 'read this':
                case 'read this for me':

                    _googleVision.GoogleVisionInstance.process(this._captureImage()).then(function (data) {

                        _this.agent.ask('\n                            Here is your text: "' + data.text + '".\n                            ' + _this.agent.getRandomConversationMessage() + '\n                        ');
                    });

                    break;
                default:
                    this.agent.ask('\n                    I heard ' + rawInput + '.\n                    ' + this.agent.getRandomConversationMessage() + '\n                ');

            }
        }

        // start everything!!

    }, {
        key: 'listen',
        value: function listen() {
            // register intents and start server
            this.agent.welcome(this.welcomeIntent.bind(this));
            this.agent.intent(_googleActionsServer.ActionServer.intent.action.TEXT, this.textIntent.bind(this));
            this.agent.listen();
        }
    }, {
        key: '_captureImage',
        value: function _captureImage() {
            var file = '/tmp/google-actions.reader.png';
            _child_process2.default.execSync('imagesnap -w 3 ' + file);
            var bitmap = _fs2.default.readFileSync(file);
            return new Buffer(bitmap).toString('base64');
        }
    }]);

    return MyAction;
}();
// instantiate


new MyAction().listen();
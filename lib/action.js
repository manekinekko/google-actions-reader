import fs from 'fs';
import child_process from 'child_process';
import { ActionServer } from '@manekinekko/google-actions-server';
import { GoogleVisionInstance } from './google-vision';

class MyAction {
    constructor() {

        // create a google action server
        this.agent = new ActionServer();

        this.agent.setGreetings([
            `Hello. Place your document in front of your camera and when you are ready, just say "read this for me".`
        ]);

        this.agent.setConversationMessages([
            `Try again`,
            `Let's try again`,
            `Give it another try`
        ]);

        this.assistant = null;
    }

    // the (default) intent triggered to welcome the user
    welcomeIntent(assistant) {
        this.assistant = assistant;
        this.agent.randomGreeting();
    }

    // the intent triggered on user's requests
    textIntent(assistant) {
        this.assistant = assistant;
        let rawInput = assistant.getRawInput();

        switch (rawInput) {
            case 'read':
            case 'read this':
            case 'read this for me':

                GoogleVisionInstance
                    .process(this._captureImage())
                    .then(data => {

                        this.agent.ask(`
                            Here is your text: "${data.text}".
                            ${this.agent.getRandomConversationMessage()}
                        `);

                    });

                break;
            default:
                this.agent.ask(`
                    I heard ${rawInput}.
                    ${this.agent.getRandomConversationMessage()}
                `);

        }

    }

    // start everything!!
    listen() {
        // register intents and start server
        this.agent.welcome(this.welcomeIntent.bind(this));
        this.agent.intent(ActionServer.intent.action.TEXT, this.textIntent.bind(this));
        this.agent.listen();
    }

    _captureImage() {
        const file = '/tmp/google-actions.reader.png';
        child_process.execSync(`imagesnap -w 3 ${file}`);
        const bitmap = fs.readFileSync(file);
        return new Buffer(bitmap).toString('base64');
    }
}
// instantiate
(new MyAction()).listen();
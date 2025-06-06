class GamepadHandler {
    constructor() {
        this.buttonLabels = {
            0: 'BUTTON_0',
            1: 'BUTTON_1',
            2: 'BUTTON_2',
            3: 'BUTTON_3',
            4: 'LEFT_TOP_SHOULDER',
            5: 'RIGHT_TOP_SHOULDER',
            6: 'LEFT_BOTTOM_SHOULDER',
            7: 'RIGHT_BOTTOM_SHOULDER',
            8: 'SELECT',
            9: 'START',
            10: 'LEFT_STICK',
            11: 'RIGHT_STICK',
            12: 'DPAD_UP',
            13: 'DPAD_DOWN',
            14: 'DPAD_LEFT',
            15: 'DPAD_RIGHT',
        };

        this.keyMap = {
            'BUTTON_0': 'z',           // A
            'BUTTON_1': 'x',           // B
            'START': 'Shift',          // Start
            'SELECT': 'Enter',         // Select
            'DPAD_UP': 'ArrowUp',
            'DPAD_DOWN': 'ArrowDown',
            'DPAD_LEFT': 'ArrowLeft',
            'DPAD_RIGHT': 'ArrowRight',
        };

        this.gamepads = [];
        this.listeners = {};
        this.timeout = null;
        this.loop();
    }

    simulateKey(key, type = 'keydown') {
        const event = new KeyboardEvent(type, {
            key: key,
            bubbles: true,
            cancelable: true
        });

        // Try dispatching to document and canvas
        document.dispatchEvent(event);
        const canvas = document.querySelector('canvas');
        if (canvas) canvas.dispatchEvent(event);
    }

    terminate() {
        window.clearTimeout(this.timeout);
    }

    getGamepads() {
        return navigator.getGamepads ? navigator.getGamepads() : [];
    }

    loop() {
        this.updateGamepadState();
        this.timeout = setTimeout(this.loop.bind(this), 10);
    }

    updateGamepadState() {
        const gamepads = Array.from(this.getGamepads());

        gamepads.forEach((gamepad, index) => {
            if (!gamepad) return;

            let existingIndex = this.gamepads.findIndex(g => g.index === gamepad.index);

            const currentState = {
                axes: gamepad.axes.slice(),
                buttons: gamepad.buttons.map(b => typeof b === 'object' ? b.pressed : b === 1.0),
                index: gamepad.index,
                id: gamepad.id
            };

            if (existingIndex !== -1) {
                const oldGamepad = this.gamepads[existingIndex];

                // Handle buttons
                currentState.buttons.forEach((pressed, buttonIndex) => {
                    const wasPressed = oldGamepad.buttons[buttonIndex];
                    if (pressed !== wasPressed) {
                        const label = this.getButtonLabel(buttonIndex);
                        const key = this.keyMap[label];

                        if (pressed) {
                            if (key) this.simulateKey(key, 'keydown');
                            this.dispatchEvent('buttondown', { index: buttonIndex, label, gamepadIndex: gamepad.index });
                        } else {
                            if (key) this.simulateKey(key, 'keyup');
                            this.dispatchEvent('buttonup', { index: buttonIndex, label, gamepadIndex: gamepad.index });
                        }
                    }
                });

                this.gamepads[existingIndex] = currentState;
            } else {
                this.gamepads.push(currentState);
                this.dispatchEvent('connected', { gamepadIndex: gamepad.index });
            }
        });

        // Clean up disconnected
        this.gamepads = this.gamepads.filter(gp => gamepads.some(g => g && g.index === gp.index));
    }

    dispatchEvent(name, arg = {}) {
        if (typeof this.listeners[name] === 'function') {
            arg.type = name;
            this.listeners[name](arg);
        }
    }

    on(name, cb) {
        this.listeners[name.toLowerCase()] = cb;
    }

    getButtonLabel(index) {
        return this.buttonLabels[index] || `BUTTON_${index}`;
    }
}

window.GamepadHandler = GamepadHandler;

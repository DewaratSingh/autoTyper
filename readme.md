# AutoTyper

AutoTyper is a specialized desktop application designed to simulate the typing of code sequences. It allows you to script exactly *how* code is typed out—including edits, backspaces, and line navigation—and then "plays" it back using simulated keyboard events. This is ideal for creating coding tutorials, demos, or "live" coding sessions where precision is key.

## Features

- **Visual Sequencer**: An Electron-based editor to write code and define the exact typing sequence.
- **Granular Control**: Add lines, insert edits, and reorder typing steps using a visual selection system.
- **Playback Control**: Toggle lines on/off. Click on selection numbers to remove them from the sequence.
- **Simulated Typing**: A Python backend (`typer.py`) handles the actual keystroke injection, supporting navigation (Arrow keys, Home, End) and text entry.
- **Step-by-Step Execution**: Press any Function key (F1-F12) to trigger the next character or action, giving you full control over the pacing.

## Prerequisites

- **Node.js**: For the Electron frontend.
- **Python 3**: For the typing simulation script.

## Installation

1.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```

2.  **Install Python dependencies:**
    You need `keyboard` and `pyautogui`.
    ```bash
    pip install keyboard pyautogui
    ```

## Usage

1.  **Start the Application:**
    ```bash
    npm start
    ```

2.  **Create Your Sequence:**
    - **Type Code**: Enter text in the input box to create lines.
    - **Add Lines**: Use the `+` buttons to insert new lines above or below existing ones.
    - **Select for Typing**: Click the yellow arrow (`→`) on the left of a line to add it to the typing queue. It will be assigned a number (e.g., `1`, `2`, `3`).
    - **Edit Lines**: Click a line to edit its content. You can "record" edits (like fixing a typo) which will be played back.
    - **Deselect**: Click a number to remove a line from the sequence. The remaining steps will automatically renumber.

3.  **Run the Simulation:**
    - Click the **Start** button in the app. This saves the sequence to `code.json` and launches the Python typer in the background.
    - Open your target editor (VS Code, Notepad, etc.).
    - Press **F8** (or any F-key from F1-F12) repeatedly. Each keypress types the next character or performs the next navigation action.
    - Press **ESC** to stop the Python script.

## Project Structure

- `renderer.js`: Frontend logic for the editor, line management, and IPC communication.
- `main.js`: Electron main process, handles file I/O and spawning the Python process.
- `typer.py`: Python script that reads `code.json` and performs the keyboard simulation.
- `code.json`: Intermediate file storing the sequence of actions to be typed.
- `index.html`: Main UI layout.

## License

[MIT](LICENSE)

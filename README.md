# Team Plays Pokemon

Install [TRBot](https://codeberg.org/kimimaru/TRBot/src/branch/master/Wiki/Setup-WebSocket.md) and vJoy and RetroArch.

Edit the TRBot settings SQLite db. Change setting last_console to 5 (gbc). Change services: disable twitch, enable websockets.
Launch the bot and then close it, go into the Data folder and update the default websocket settings txt file to point to
localhost:15333.

Set up vJoy: configure it for 32 buttons.

Run TRBot. Set up RetroArch: go to Input settings and configure each button, by choosing it and then going to TRBot and sending that button command.

TODO:
* should have a textbox to allow for manual inputs
* should require a name, and just a one-click to save the name and connect to the websocket and lock the name.
* check for name uniqueness
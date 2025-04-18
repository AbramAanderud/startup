# Room

[My Notes](notes.md)

I am making a virtual chat room where you create a simple small character and can walk around and talk to others in the room. There will be objects you can interract with that others will be able to see. Thinking something like a post it board and buying others drinks. 


> [!NOTE]
>  This is a template for your startup application. You must modify this `README.md` file for each phase of your development. You only need to fill in the section for each deliverable when that deliverable is submitted in Canvas. Without completing the section for a deliverable, the TA will not know what to look for when grading your submission. Feel free to add additional information to each deliverable description, but make sure you at least have the list of rubric items and a description of what you did for each item.

> [!NOTE]
>  If you are not familiar with Markdown then you should review the [documentation](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax) before continuing.

## 🚀 Specification Deliverable

> [!NOTE]
>  Fill in this sections as the submission artifact for this deliverable. You can refer to this [example](https://github.com/webprogramming260/startup-example/blob/main/README.md) for inspiration.

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] Proper use of Markdown
- [x] A concise and compelling elevator pitch
- [x] Description of key features
- [x] Description of how you will use each technology
- [x] One or more rough sketches of your application. Images must be embedded in this file using Markdown image references.

### Elevator pitch

Welcome to Room! Have you ever had a long day and just wanted to sit and unwind with friends but the thought of being in public sounds misreable? With Room you can do just that without leaving the comfort of your home. In Room you can emote and chat with friends in a interactive environment playful environment. 

### Design

![Design image](mockup.png)

Top Bar: User profile, virtual currency balance, and settings menu.

Main Area: Interactive café layout with movable avatars.

Chat Window: Display chat history with real-time bubbles above avatars.

Menu: A floating menu for purchasing virtual items.

```mermaid
sequenceDiagram
    actor You
    actor Website
    You->>Website: Replace this with your design
```

### Key features

- Customizable Characters: Design your own avatar
- Interactive Space: walk around and interact with objects
- Real time chat: Talk to other users in real time via text chat bubbles.
- Expressive Emotes: Use a range of emotes like waving, and dancing.

### Technologies

I am going to use the required technologies in the following ways.

- **HTML** - Structure the hub layout with sections for seating areas, bar counters, and customizable avatars.
- **CSS** - Create a nice, chill aesthetic with quality colors, smooth animations, and responsive design for screen sizes.
- **React** - Build a dynamic single-page application with reusable components like the avatar editor, menu, and chat window. Ill also use React Router to manage navigation between spaces.
- **Service** - Call external APIs for random trivia questions or weather-based Room themes using the OpenWeather API
- **DB/Login** - Store user profiles, items, and chat logs in DB. Track virtual currency balances for purchasing items.
- **WebSocket** - Enable real-time messaging for chats and emote triggers. Broadcast special announcements like event updates or limited-time specials.

## 🚀 AWS deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **Server deployed and accessible with custom domain name** - [My server link](https://startup.chatterpad.click/).

## 🚀 HTML deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **HTML pages** - Made an html page for the home and login page that is serving as my index.html. I also made an html page for the room/hub that the user will hang out and interract with. 
- [x] **Proper HTML element usage** - Used headers, footers, main, div and nav to seperate elements and display information.
- [x] **Links** - Linked my github and there is easy page navigation through links
- [x] **Text** - added text place holders explaining what everything will be and where I will put it. 
- [x] **3rd party API placeholder** - I am going to use a weather api to change the way the room looks. 
- [x] **Images** - Image in there as a placeholder for the character design, ill add images as decorations to the room later.
- [x] **Login placeholder** - Added.
- [x] **DB data placeholder** - This will be seen with the gold counter and leaderboard as well as the current log of chats that is being stored.
- [x] **WebSocket placeholder** - The chat box will be in real time and with everyone in the room.

## 🚀 CSS deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **Header, footer, and main content body** - Put github link in footers, added header of chatter pad, body content is the room and also the login box and some text. 
- [x] **Navigation elements** - The EXIT button on the room in the top left and the login button is on the index page.
- [x] **Responsive to window resizing** - Made the room window dynamic so it resizes but the inside content is fixed inside the container so it seems more like a real virtual room. The chat box and buttons stay in the corner for easy access. 
- [x] **Application elements** - Added the room and gold counter will probably add a player list. Added a bar and some tables with little cushion chairs. Might try and design more and add a bar tender. 
- [x] **Application text content** - Has username in corner of room and a gold counter will have a list of settings that come up when you click on settings later along with a chat box. Hoping to store chat logs. 
- [x] **Application images** - Added Photos on the walls of the room and also the floor and wall are repeated photos. Might let users change the pictures not sure if thats a good idea. 

## 🚀 React part 1: Routing deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **Bundled using Vite** - Added Vite. 
- [x] **Components** - Everything is using React and formatted like the simom. I want to have custom headers and nav buttons so I accounted for that. 
- [x] **Router** - My pages are correctly routed. 

## 🚀 React part 2: Reactivity

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **All functionality implemented or mocked out** - I added everything that I wanted to, I have a settings button where you can change the color of your character, this color also shows up on your display name in chat. I made it so the player username is shown above their character and they load into the middle of the room when they join and when they leave and join they join in the same place. Made gold so you passively get gold by being on the site. Can click bar tender to by drinks that give a pop up on you to show you bought one and it costs gold. Made it so you can click bar and tables to sit there and they have limtted seats and aknowledge when you leave. I also added another pop up for when you type in chat your character says it and its stored in chat too. I also made chat colapsable. localStorage is stubbing out my database stuff for now like position, chat messages, gold. 
- [x] **Hooks** - I used useState to store dynamic values like position, gold, messages, pop ups. I used useEffect to set up keyboard listeners for player movement, I got the camera following code from https://codepen.io/punkydrewster713/pen/WNrXPrb, I used useEffect to run a timer that increments the gold that your get, I also used it to time pop ups for drinks and messages. 

## 🚀 Service deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **Node.js/Express HTTP service** - Implemented Index.js with mulitple endpoints. Also I want to clarify that in my code a lot of this will later use socket.io and it was getting overwhelming debugging this with the console logs. To make things easier I slowed down updating the site from polling so basically the chat messages update every 5 seconds, user data polls every 10 seconds and the position every 2 seconds. This is just effecting how often parts of the site update for everyone to see. 
- [x] **Static middleware for frontend** - express.static('public') is indeed configured in my code. 
- [x] **Calls to third party endpoints** - Calling OpenWeatherMap API for weather forecasts which are then sent to the global chat under the name weather man every 15 minutes. 
- [x] **Backend service endpoints** - Made endpoints for auth and login like in simon code but also made endpoints for user data that contains the users gold, color, current position in the room, and if they are logged in or not (for gold increment logic). I also made a global chat endpoint and an endpoint for all users currently in the room. 
- [x] **Frontend calls service endpoints** - All of my React components are calling from the backend using fetch. Specifically the userName, gold, color, status, and position (userData). 

## 🚀 DB/Login deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **User registration** - Users are able to register and be added to the database
- [x] **User login and logout** - Log in and log out working
- [x] **Stores data in MongoDB** - Can see the users in the database
- [x] **Stores credentials in MongoDB** - Stored userData is accurate and visable in the database
- [x] **Restricts functionality based on authentication** - Cannot join room unless you have a valid account and are logged in

## 🚀 WebSocket deliverable

For this deliverable I did the following. I checked the box `[x]` and added a description for things I completed.

- [x] **Backend listens for WebSocket connection** - Back end is listening for webscocket correctly and succesfully connects in the peerProxy.js. Creates a new instance of WebSocketServer that attatches to that HTTP server and listens. 
- [x] **Frontend makes WebSocket connection** - In my Room I use a useEffect that creates a new WebSocket('ws://localhost:4000') and then send an initial init to request persisted state. 
- [x] **Data sent over WebSocket connection** - I send quite a bit of data, sendRoomEvent in my room sends all changes so when the user changes color, moves, sends messages, buys a drink, all of these are sent with websockets and updated in the  database.
- [x] **WebSocket data displayed** - When a message is sent in the room the state is updated with the new chat messages to the state array which is update and everyone can see, the gold count is also updated with websockets when a drink is bought. 
- [x] **Application is fully functional** - Yes! You can create an account and log in and out while all your data is stored and persisted in the data base. Websocket connections are sent an recieved, real time movements are updated, processed, and rendered. You can log out using the exit button or logging out initially and you are logged out on window close. 

# CS 260 Notes

[My startup](https://simon.cs260.click)

## Helpful links

- [Course instruction](https://github.com/webprogramming260)
- [Canvas](https://byu.instructure.com)
- [MDN](https://developer.mozilla.org)

## AWS Notes

Testing and adding new note...


## HTML Notes

- Took IS 201 so some of this is review but I forgot how to add videos and some other things
- you can use the live server to see the changes as you do them
- I was confused about how simon is deployed but we are deploying the base simon to our app and then we are deploying our start up too
- was confused because the default on my site was taking back to the 260 simon
- the simon html has been really helpful
- I can put shapes to show what the room may look like, looked up shape formatting for the room.
- I think I am now going to make the room weather reactive.
- Learned that you can pull fonts off the internet with css as long as you have the url
- Using flex and some other built in styling on css you can make your website fit anything but it is important to make sure you arent flexing wrong
- You can debug css by inspecting the thing that is wrong in the browser to have a better idea of the issue
- You can use bootstraps to basically speed run making a website
- There is a z axis
- Vite is used to help view your webiste and enable react
- needed to add a gitignore for some reason didnt have one
- ubuntu was the issue becasue my index.html was in the wrong folder. 
- You can store things in local storage
- Can exhange large amounts of data with json
- Can use promises to not interrupt main thread
- Using async you can make promises pending because the execution function has no yet resolved
- Can use javascript debugging to see the debugger while having the site preview open
- Can use react to do color changes and for me this is good becasue I want to do blips and use settings to change there color.
- Can useEffect every time something is rendered, using the hook you can add details to this. You can also use a clean up to release resources
- Websocket messages can be mocked with set interval
- Can use local storage to store sessions
- Can use authstate to store app components
- Can make it so you exit out of chat box after chatting instead of having to click
- URL's can be instances even for gaming 
- URL parameters represent a list of key value pairs
- Port is the specified number that the connection is located on. Lower port numbers than 600 are reserved for common internet protocols, higher numnerw are used for anything
- HTTP requests are formatted GET /hypertext/WWW/Helping.html HTTP/1.1
Host: info.cern.ch
Accept: text/html
- If fetch is unspecified it defaults to GET
- Need to have server up first
- need to change the port to 4000 on my backend
- you can create console logs so that debugging is eassier, you can even pass in retrieved variables to be printed by the logs. 
- will my calls to console log effect my final site? 
- Need to have some initial data or it will crash my componeents. 
- It can be really helpful to inspect on the html to debug, fixed an issue pretty easily that I was wasting time on
- It is completely possible to get an infinite loop with no aysnc
- Time to start db hope its not as bad as 240 
- Only 8 gigs by default in your server
- You need to be smart about how you store your data so putting evreything in your db like large files such as videos is not a good idea and there is a better solution
- Server should be copy and replacable
- Cant do that with lots of files
- Seems like the way to solve this is by having external dbs that are stored on the cloud and will ensure that copies are made for you. 
- Databases were dominated by SQL till needs got a little more specific
- MongoDB is good becasue it uses collections of big arrays of JSON objects. 
- Mongo is nice becasue it changes directly, you can just add new fields to your document and the database adapts
- Mongo syntax for queries is simillar to javascript
- Some of the code on simon may need some asyncs 
- The code pulls highscores without waiting if needed. 
- Simon Deployed succesfully and showing up in the database
- Was able to test the server with new database and is working

Notes for web sockets:
- My website itself doesnt make sense with only a client server model. 
- Peer to peer connection style
- Websockets allow client and server to have an asynchronous exchange of information.
- 







export const RoomEvent = {
    Chat: 'chat',
    GoldUpdate: 'goldUpdate',
    ColorChange: 'colorChange',
    System: 'system'
  };
  
  class RoomEventMessage {
    constructor(from, type, payload) {
      this.from = from;
      this.type = type;
      this.payload = payload;
    }
  }
  
  class RoomNotifier {
    constructor() {
      this.events = [];
      this.handlers = [];
    }
  
    // Broadcast an event to all subscribers.
    broadcastEvent(from, type, payload) {
      const event = new RoomEventMessage(from, type, payload);
      this.receiveEvent(event);
    }
  
    // Register a handler function that will be called with each event.
    addHandler(handler) {
      this.handlers.push(handler);
    }
  
    // Remove a previously registered handler.
    removeHandler(handler) {
      this.handlers = this.handlers.filter(h => h !== handler);
    }
  
    // When an event is received, store it and notify all handlers.
    receiveEvent(event) {
      this.events.push(event);
      this.handlers.forEach(handler => handler(event));
    }
  }
  
  const roomNotifier = new RoomNotifier();
  export { roomNotifier };
  
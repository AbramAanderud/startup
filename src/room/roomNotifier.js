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
  
    broadcastEvent(from, type, payload) {
      const event = new RoomEventMessage(from, type, payload);
      this.receiveEvent(event);
    }
  
    addHandler(handler) {
      this.handlers.push(handler);
    }
  
    removeHandler(handler) {
      this.handlers = this.handlers.filter(h => h !== handler);
    }
  
    receiveEvent(event) {
      this.events.push(event);
      this.handlers.forEach(handler => handler(event));
    }
  }
  
  const roomNotifier = new RoomNotifier();
  export { roomNotifier };
  
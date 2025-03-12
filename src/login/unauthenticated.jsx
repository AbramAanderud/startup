import React from 'react';
import { MessageDialog } from './messageDialog';
import Button from 'react-bootstrap/Button';

export function Unauthenticated(props) {
  const [userName, setUserName] = React.useState(props.userName || "");
  const [password, setPassword] = React.useState('');
  const [displayError, setDisplayError] = React.useState(null);

  async function loginUser(e) {
    e.preventDefault();
    loginOrCreate('/api/auth/login');
  }

  async function createUser(e) {
    e.preventDefault();
    loginOrCreate('/api/auth/create');
  }

  async function loginOrCreate(endpoint) {
    try {
      const response = await fetch(endpoint, {
        method: 'post',
        body: JSON.stringify({ email: userName, password: password }),
        headers: { 'Content-type': 'application/json; charset=UTF-8' },
      });
      console.log("Response status:", response.status);
      const text = await response.text();
      console.log("Response text:", text);
      let body;
      try {
        body = JSON.parse(text);
      } catch (e) {
        body = {};
      }
      if (response.status === 200) {
        localStorage.setItem('userName', userName);
        props.onLogin(userName);
      } else {
        setDisplayError(`⚠ Error: ${body.msg || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setDisplayError("⚠ Error: Could not reach server");
    }
  }
  

  return (
    <form>
      <div>
        <input 
          type="text" 
          placeholder="your@email.com"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
      </div>
      <div>
        <input 
          type="password" 
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button type="submit" onClick={loginUser}>LOGIN</button>
      <button type="button" onClick={createUser}>CREATE</button>
      {displayError && <h5>{displayError}</h5>}
    </form>
  );
}

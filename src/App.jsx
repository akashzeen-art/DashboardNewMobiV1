import { useState } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(localStorage.getItem('isLoggedIn') === 'true');

  function handleLogin() { setLoggedIn(true); }

  function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    setLoggedIn(false);
  }

  return loggedIn
    ? <Dashboard onLogout={handleLogout} />
    : <Login onLogin={handleLogin} />;
}

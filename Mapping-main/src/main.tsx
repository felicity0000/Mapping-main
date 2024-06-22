import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import './index.css';
import Map from './Map';
// import Saved from '../src/assets/Saved';  // Assuming Saved is in the components folder

ReactDOM.render(
  <Router>
    <React.StrictMode>
      
        <Map />
        {/* <Route path="/saved-routes" component={Saved} /> */}
      
    </React.StrictMode>
  </Router>,
  document.getElementById('root')
);
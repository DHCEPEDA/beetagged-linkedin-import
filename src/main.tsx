import React from 'react'
import ReactDOM from 'react-dom/client'
// @ts-ignore
import BeeTaggedApp from './SquarespaceApp.jsx'
import './beetagged-styles.css'

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <BeeTaggedApp />
  </React.StrictMode>
)
import React from 'react'
import ReactDOM from 'react-dom/client'
import BeeTaggedApp from './SquarespaceApp'
import './beetagged-styles.css'

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <BeeTaggedApp />
  </React.StrictMode>
)
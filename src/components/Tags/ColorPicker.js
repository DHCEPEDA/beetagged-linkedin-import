import React, { useState } from 'react';
import { isLightColor } from '../../utils/colorUtils';

/**
 * Color picker component for tag creation and editing
 * Provides a predefined set of colors commonly used for tags
 * 
 * @param {Object} props - Component props
 * @param {string} props.selectedColor - Currently selected color (hex)
 * @param {Function} props.onColorSelect - Function to call when a color is selected
 */
const ColorPicker = ({ selectedColor = '#3498db', onColorSelect }) => {
  const [showPalette, setShowPalette] = useState(false);
  
  // Predefined color palette
  const colorPalette = [
    // Blues
    '#3498db', '#2980b9', '#0077c2', '#1abc9c', '#16a085',
    // Greens
    '#2ecc71', '#27ae60', '#00a651', '#00c853', '#69c23d',
    // Reds
    '#e74c3c', '#c0392b', '#d50000', '#ff5252', '#ff3d00',
    // Yellows/Oranges
    '#f39c12', '#e67e22', '#d35400', '#ff9800', '#ff6d00',
    // Purples/Pinks
    '#9b59b6', '#8e44ad', '#673ab7', '#e91e63', '#9c27b0',
    // Grays
    '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7', '#607d8b'
  ];

  const handleColorSelect = (color) => {
    if (onColorSelect) {
      onColorSelect(color);
    }
    setShowPalette(false);
  };

  return (
    <div className="color-picker-container">
      <div 
        className="selected-color-preview"
        style={{
          backgroundColor: selectedColor,
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          cursor: 'pointer',
          border: '2px solid #ddd',
          display: 'inline-block',
          marginRight: '10px'
        }}
        onClick={() => setShowPalette(!showPalette)}
      ></div>
      
      <button 
        type="button"
        className="color-picker-button"
        style={{
          backgroundColor: selectedColor,
          color: isLightColor(selectedColor) ? '#333' : '#fff',
          border: 'none',
          borderRadius: '4px',
          padding: '6px 12px',
          cursor: 'pointer',
          fontSize: '0.875rem'
        }}
        onClick={() => setShowPalette(!showPalette)}
      >
        {showPalette ? 'Close Color Palette' : 'Choose Color'}
      </button>
      
      {showPalette && (
        <div 
          className="color-palette"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #ddd',
            maxWidth: '300px'
          }}
        >
          {colorPalette.map((color, index) => (
            <div
              key={index}
              className={`color-option ${selectedColor === color ? 'selected-color' : ''}`}
              style={{
                backgroundColor: color,
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                cursor: 'pointer',
                border: selectedColor === color ? '2px solid #333' : '2px solid transparent',
                transition: 'transform 0.2s ease',
                transform: selectedColor === color ? 'scale(1.2)' : 'scale(1)'
              }}
              onClick={() => handleColorSelect(color)}
              title={color}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
/**
 * Tag Model
 * For categorizing contacts in the BeeTagger app
 */

import { getRandomColor } from '../utils/colorUtils';

class Tag {
  constructor(data = {}) {
    this.id = data.id || `tag_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.name = data.name || '';
    this.color = data.color || getRandomColor();
    this.count = data.count || 0; // Number of contacts with this tag
    this.createdAt = data.createdAt || new Date();
    this.description = data.description || '';
    this.isSystem = data.isSystem || false; // System tags cannot be deleted
    this.isFilter = data.isFilter || false; // Is this tag currently being used as a filter?
  }
  
  // Helper methods
  setColor(newColor) {
    this.color = newColor;
    return this;
  }
  
  setName(newName) {
    this.name = newName;
    return this;
  }
  
  incrementCount() {
    this.count++;
    return this;
  }
  
  decrementCount() {
    if (this.count > 0) {
      this.count--;
    }
    return this;
  }
  
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      count: this.count,
      createdAt: this.createdAt,
      description: this.description,
      isSystem: this.isSystem,
      isFilter: this.isFilter
    };
  }
  
  // Factory methods for creating common tags
  static createLocationTag(locationName) {
    return new Tag({
      name: `📍 ${locationName}`,
      description: `Contacts located in ${locationName}`,
      isSystem: true
    });
  }
  
  static createIndustryTag(industryName) {
    return new Tag({
      name: `💼 ${industryName}`,
      description: `Contacts in the ${industryName} industry`,
      isSystem: true
    });
  }
  
  static createBirthdayTag(month) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return new Tag({
      name: `🎂 ${months[month - 1]}`,
      description: `Contacts with birthdays in ${months[month - 1]}`,
      isSystem: true
    });
  }
}

export default Tag;
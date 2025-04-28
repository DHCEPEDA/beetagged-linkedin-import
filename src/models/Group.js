/**
 * Group Model
 * For creating affinity groups based on tags in the BeeTagger app
 */

import { getRandomColor } from '../utils/colorUtils';

class Group {
  constructor(data = {}) {
    this.id = data.id || `group_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.name = data.name || '';
    this.description = data.description || '';
    this.color = data.color || getRandomColor();
    this.icon = data.icon || '👥'; // Default icon
    this.members = data.members || []; // Array of contact IDs
    this.tags = data.tags || []; // Array of tag IDs that define this group
    this.createdAt = data.createdAt || new Date();
    this.lastUpdated = data.lastUpdated || new Date();
    this.isAutomatic = data.isAutomatic || false; // Whether this group is automatically maintained
  }
  
  // Helper methods
  addMember(contactId) {
    if (!this.members.includes(contactId)) {
      this.members.push(contactId);
      this.lastUpdated = new Date();
    }
    return this;
  }
  
  removeMember(contactId) {
    this.members = this.members.filter(id => id !== contactId);
    this.lastUpdated = new Date();
    return this;
  }
  
  addTag(tagId) {
    if (!this.tags.includes(tagId)) {
      this.tags.push(tagId);
      this.lastUpdated = new Date();
    }
    return this;
  }
  
  removeTag(tagId) {
    this.tags = this.tags.filter(id => id !== tagId);
    this.lastUpdated = new Date();
    return this;
  }
  
  setName(newName) {
    this.name = newName;
    this.lastUpdated = new Date();
    return this;
  }
  
  setColor(newColor) {
    this.color = newColor;
    this.lastUpdated = new Date();
    return this;
  }
  
  setIcon(newIcon) {
    this.icon = newIcon;
    this.lastUpdated = new Date();
    return this;
  }
  
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      color: this.color,
      icon: this.icon,
      members: this.members,
      tags: this.tags,
      createdAt: this.createdAt,
      lastUpdated: this.lastUpdated,
      isAutomatic: this.isAutomatic
    };
  }
  
  // Factory methods for creating common groups
  static createFromTags(name, tags, description = '') {
    return new Group({
      name,
      description,
      tags,
      isAutomatic: true
    });
  }
  
  static createLocationGroup(locationName) {
    return new Group({
      name: `${locationName} Contacts`,
      description: `Contacts located in ${locationName}`,
      icon: '📍',
      isAutomatic: true
    });
  }
  
  static createIndustryGroup(industryName) {
    return new Group({
      name: `${industryName} Professionals`,
      description: `Contacts in the ${industryName} industry`,
      icon: '💼',
      isAutomatic: true
    });
  }
}

export default Group;
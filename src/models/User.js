/**
 * User model equivalent to User.java
 * Represents a contact with name and tags for search functionality
 */
export class User {
  constructor(name, tags = []) {
    this.name = name;
    this.tags = tags;
  }

  getName() {
    return this.name;
  }

  getTags() {
    return this.tags;
  }

  // Additional methods for web functionality
  getId() {
    return this.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Convert from LinkedIn import format
  static fromLinkedInContact(contact) {
    const tags = [];
    
    if (contact.location) tags.push(contact.location);
    if (contact.company) tags.push(contact.company);
    if (contact.title) tags.push(contact.title);
    if (contact.industry) tags.push(contact.industry);
    
    // Add tag objects if they exist
    if (contact.tags && Array.isArray(contact.tags)) {
      contact.tags.forEach(tag => {
        if (typeof tag === 'object' && tag.name) {
          tags.push(tag.name);
        } else if (typeof tag === 'string') {
          tags.push(tag);
        }
      });
    }

    const user = new User(contact.name || `${contact.firstName} ${contact.lastName}`.trim(), tags);
    user.id = contact.id;
    user.email = contact.email;
    user.company = contact.company;
    user.title = contact.title;
    user.location = contact.location;
    user.industry = contact.industry;
    user.source = contact.source;
    
    return user;
  }

  // Convert to display format
  toDisplayObject() {
    return {
      id: this.getId(),
      name: this.name,
      email: this.email,
      company: this.company,
      title: this.title,
      location: this.location,
      industry: this.industry,
      tags: this.tags,
      source: this.source
    };
  }
}
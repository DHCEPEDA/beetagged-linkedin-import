/**
 * Contact Model
 * Based on the XML data model from the iOS app
 */

class Contact {
  constructor(data = {}) {
    // Personal information
    this.first_name = data.first_name || '';
    this.last_name = data.last_name || '';
    this.name = data.name || `${this.first_name} ${this.last_name}`.trim();
    this.email = data.email || '';
    this.gender = data.gender || '';
    this.bio = data.bio || '';
    this.birthday = data.birthday || '';
    this.hometown = data.hometown || '';
    this.relationshipStatus = data.relationshipStatus || '';
    this.pictureUrl = data.pictureUrl || '';
    
    // Location information
    this.locationName = data.locationName || '';
    
    // Professional information
    this.headline = data.headline || '';
    this.industry = data.industry || '';
    this.linkedInUrl = data.linkedInUrl || '';
    
    // Position information
    this.positionTitle = data.positionTitle || '';
    this.positionName = data.positionName || '';
    this.positionIndustry = data.positionIndustry || '';
    this.positionSummary = data.positionSummary || '';
    this.positionSize = data.positionSize || '';
    this.positionIsCurrent = data.positionIsCurrent || false;
    
    // Social IDs
    this.fbId = data.fbId || '';
    this.parseId = data.parseId || '';
    
    // Grouping
    this.groupByLastName = data.groupByLastName || 
      (this.last_name ? this.last_name.charAt(0).toUpperCase() : '');
    
    // Tags and additional data
    this.hasGeneratedTags = data.hasGeneratedTags || false;
    this.tags = data.tags || [];
    
    // Education and work experience
    this.education = data.education || [];
    this.workExperience = data.workExperience || [];
  }
  
  // Helper methods
  getFullName() {
    return this.name || `${this.first_name} ${this.last_name}`.trim();
  }
  
  getInitials() {
    if (this.first_name && this.last_name) {
      return `${this.first_name.charAt(0)}${this.last_name.charAt(0)}`.toUpperCase();
    } else if (this.name) {
      const nameParts = this.name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
      } else {
        return nameParts[0].charAt(0).toUpperCase();
      }
    }
    return '';
  }
  
  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }
  
  removeTag(tag) {
    this.tags = this.tags.filter(t => t !== tag);
  }
  
  toJSON() {
    return {
      first_name: this.first_name,
      last_name: this.last_name,
      name: this.name,
      email: this.email,
      gender: this.gender,
      bio: this.bio,
      birthday: this.birthday,
      hometown: this.hometown,
      relationshipStatus: this.relationshipStatus,
      pictureUrl: this.pictureUrl,
      locationName: this.locationName,
      headline: this.headline,
      industry: this.industry,
      linkedInUrl: this.linkedInUrl,
      positionTitle: this.positionTitle,
      positionName: this.positionName,
      positionIndustry: this.positionIndustry,
      positionSummary: this.positionSummary,
      positionSize: this.positionSize,
      positionIsCurrent: this.positionIsCurrent,
      fbId: this.fbId,
      parseId: this.parseId,
      groupByLastName: this.groupByLastName,
      hasGeneratedTags: this.hasGeneratedTags,
      tags: this.tags,
      education: this.education,
      workExperience: this.workExperience
    };
  }
  
  // Factory method to create a contact from Facebook data
  static fromFacebookData(fbData) {
    return new Contact({
      first_name: fbData.first_name,
      last_name: fbData.last_name,
      name: fbData.name,
      email: fbData.email,
      gender: fbData.gender,
      birthday: fbData.birthday,
      hometown: fbData.hometown?.name,
      relationshipStatus: fbData.relationship_status,
      pictureUrl: fbData.picture?.data?.url,
      fbId: fbData.id
    });
  }
  
  // Factory method to create a contact from LinkedIn data
  static fromLinkedInData(liData) {
    return new Contact({
      first_name: liData.firstName,
      last_name: liData.lastName,
      name: `${liData.firstName} ${liData.lastName}`.trim(),
      headline: liData.headline,
      industry: liData.industry,
      locationName: liData.location?.name,
      pictureUrl: liData.pictureUrl,
      positionTitle: liData.positions?.values?.[0]?.title,
      positionName: liData.positions?.values?.[0]?.company?.name,
      positionIndustry: liData.positions?.values?.[0]?.company?.industry,
      positionSummary: liData.positions?.values?.[0]?.summary,
      positionIsCurrent: liData.positions?.values?.[0]?.isCurrent,
      linkedInUrl: liData.publicProfileUrl
    });
  }
}

export default Contact;
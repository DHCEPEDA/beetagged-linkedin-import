//
//  Constants.h
//  Bees Chest
//
//  Created by Billy Irwin on 12/29/13.
//  Copyright (c) 2013 Arbrr. All rights reserved.
//

#ifndef Bees_Chest_Constants_h
#define Bees_Chest_Constants_h

//********************************************************************//
//    API Keys //
//********************************************************************//
#define kLinkedInAPIKey @"77pcrxxrn2lvoi"
#define kLinkedInSecretKey @"LVZyO08yHbJ4RCzI"
#define kLinkedInOAuthToken @"b1ddadf4-8640-4808-91c2-d6845952fd40"
#define kLinkedInOAuthSecret @"21705a65-f7c8-4fba-863c-bce7b7e51f64"
#define kLIToken @"litoken"
#define kLICurUser @"licuruser"

//********************************************************************//
//    UIView Frames //
//********************************************************************//
#define kWidth [UIScreen mainScreen].bounds.size.width
#define kHeight [UIScreen mainScreen].bounds.size.height

//********************************************************************//
//    StoryBoard Segues //
//********************************************************************//
#define kLoginSegue @"login"
#define kShowContactSegue @"ShowContact"

//********************************************************************//
//    ContactCell //
//********************************************************************//
#define kContactCell @"ContactCell"
#define kContactCellHeight 70.0
#define kContactCellPlaceholderImage [UIImage imageNamed:@"Bees Chest Placeholder.png"]

#define kProfileHeaderCell @"ProfileHeaderCell"
#define kProfileDetailCell @"ProfileDetailCell"

//********************************************************************//
//    Contact //
//********************************************************************//
#define kContactFirstName @"first_name"
#define kContactLastName @"last_name"
#define kContactFormattedName @"name"
#define kContactBirthday @"birthday"
#define kContactFBId @"id"
#define kContactPicUrl @"pictureUrl"
#define kContactWork @"work"
#define kContactName @"name"
#define kContactType @"type"
#define kContactSchool @"school"
#define kContactRelationship @"relationship_status"
#define kContactGender @"gender"
#define kContactHometown @"hometown"
#define kContactEmployer @"employer"
#define kContactEducation @"education"
#define kContactPosition @"position"
#define kContactBio @"bio"

// Position
#define kContactPosition @"positions"
#define kContactPositionValues @"values"
#define kContactPositionCompany @"company"
#define kContactPositionIndustry @"industry"
#define kContactPositionName @"name"
#define kContactPositionSize @"size"
#define kContactPositionIsCurrent @"isCurrent"
#define kContactPositionSummary @"summary"
#define kContactPositionTitle @"title"
#define kContactLinkedInGetUrl @"siteStandardProfileRequest"
#define kContactLinkedInUrl @"url"
#define kContactGroupByLastName @"groupByLastName"
#define kContactTagData @"tagData"


//********************************************************************//
//    Cache //
//********************************************************************//
#define kCacheAllContacts @"allContactsCache"

//********************************************************************//
//    Tags //
//********************************************************************//
#define kTagsNumberOfSections 3
#define kTagClass @"Tag"
#define kTagObjectId @"objectId"
#define kTagAttributeName @"attributeName"
#define kTagTaggedBy @"taggedBy"
#define kTagUserId @"userId"
#define kTagOptionId @"tagOptionId"
#define kTagCreatedAt @"createdAt"
#define kTagUpdatedAt @"updatedAt"
#define kTagRank @"rank"

//********************************************************************//
//    Tag Option //
//********************************************************************//
#define kTagOptionClass @"TagOption"
#define kTagOptionAttributeName @"attributeName"
#define kTagOptionCreatedAt @"createdAt"
#define kTagOptionUpdatedAt @"updatedAt"


//********************************************************************//
//    User //
//********************************************************************//
#define kUserLinkedInId @"id"
#define kUserConnections @"connections"
#define kUserImportedAllContacts @"importedContacts"


//********************************************************************//
//    BATypeAhead //
//********************************************************************//
#define kBATypeAheadCellHeight 40
#define kBATypeAheadTextLabelHeight 45.0

//********************************************************************//
//    Tag Index //
//********************************************************************//
#define kSame @"same"
#define kContacts @"contactArray"

#define kTagName @"tagName"
#define kTagVal @"tagVal"

#endif

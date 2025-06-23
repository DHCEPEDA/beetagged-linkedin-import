//
//  Contact.h
//  Bees Chest
//
//  Created by Billy Irwin on 1/3/14.
//  Copyright (c) 2014 Arbrr. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CoreData/CoreData.h>
#import <SDWebImage/SDWebImageDownloader.h>
#import <SDWebImage/SDImageCache.h>
#import <SDWebImage/SDWebImageManager.h>
#import "FBManager.h"
#import "Tag.h"
#import "TagOption.h"
#import "FBManager.h"
#import <Parse/Parse.h>

@interface Contact : NSManagedObject

@property (nonatomic, retain) NSString * fbId;
@property (nonatomic, retain) NSString * parseId;
@property (nonatomic, retain) NSString * first_name;
@property (nonatomic, retain) NSString * last_name;
@property (nonatomic, retain) NSString * name;
@property (nonatomic, retain) NSString * headline;
@property (nonatomic, retain) NSString * locationName;
@property (nonatomic, retain) NSString * industry;
@property (nonatomic, retain) NSString * positionIndustry;
@property (nonatomic, retain) NSString * positionName;
@property (nonatomic, retain) NSString * positionSize;
@property (nonatomic, retain) NSData *tagData;
@property (nonatomic) BOOL positionIsCurrent;
@property (nonatomic) BOOL hasGeneratedTags;
@property (nonatomic, retain) NSString * positionSummary;
@property (nonatomic, retain) NSString * positionTitle;
@property (nonatomic, retain) NSString * pictureUrl;
@property (nonatomic, retain) NSString * linkedInUrl;
@property (nonatomic, retain) NSString * groupByLastName;
@property (nonatomic, strong) NSMutableDictionary * tags_;
@property (nonatomic, retain) NSData *workData;
@property (nonatomic, retain) NSData *educationData;
@property (strong, nonatomic) NSMutableArray *work;
@property (strong, nonatomic) NSMutableArray *education;
@property (nonatomic, retain) NSString *gender;
@property (nonatomic, retain) NSString *bio;
@property (nonatomic, retain) NSString *hometown;
@property (nonatomic, retain) NSString *relationshipStatus;
@property (strong, nonatomic) PFObject *userModel;

+ (Contact*)contactFromFB:(NSDictionary*)user;
+ (Contact*)contactFromUserModel:(PFObject*)user;

- (void)generateTags:(BOOL)pushToParse;
+ (void)setParseUser:(NSDictionary *)json andSave:(BOOL)save;

- (NSMutableArray*)profileAttributeKeys;
- (NSMutableArray*)detailAttributesFor:(NSString*)key;

- (void)updateEducationAtIndex:(NSInteger)index withHeader:(NSString *)header andValue:(NSString *)value;
- (void)updateWorkAtIndex:(NSInteger)index withHeader:(NSString *)header andValue:(NSString *)value;
- (void)save;
- (void)load;

- (void)saveContactToParse;
- (void)updateWithCallback:(void(^)(void))callback;

@end

//
//  Contact.m
//  Bees Chest
//
//  Created by Billy Irwin on 1/3/14.
//  Copyright (c) 2014 Arbrr. All rights reserved.
//

#import "Contact.h"

@implementation Contact

@dynamic fbId;
@dynamic parseId;
@dynamic first_name;
@dynamic last_name;
@dynamic name;
@dynamic headline;
@dynamic locationName;
@dynamic positionIndustry;
@dynamic positionName;
@dynamic positionSize;
@dynamic positionIsCurrent;
@dynamic positionSummary;
@dynamic positionTitle;
@dynamic industry;
@dynamic pictureUrl;
@dynamic linkedInUrl;
@dynamic groupByLastName;
@dynamic hasGeneratedTags;
@dynamic tagData;
@synthesize tags_;
@dynamic workData;
@dynamic educationData;
@dynamic hometown;
@dynamic gender;
@dynamic bio;
@synthesize work;
@synthesize education;
@dynamic relationshipStatus;
@synthesize userModel;


-(id)init {
    self = [super init];
    if (self) {
        self.hasGeneratedTags = NO;
    }
    return self;
}

#pragma mark JSON
+ (Contact*)contactFromFB:(NSDictionary*)user {
    FBManager *li = [FBManager singleton];
    Contact *c = [NSEntityDescription insertNewObjectForEntityForName:@"Contact" inManagedObjectContext:li.managedObjectContext];
    c.fbId = user[kContactFBId];
    c.first_name = user[kContactFirstName];
    c.last_name = user[kContactLastName];
    c.name = user[kContactFormattedName];
    //c.headline = user[kContactHeadline];
//    [c getLocationFromJSON:user];
//    [c getPositionFromJSON:user];
   // c.industry = user[kContactIndustry];
    
    c.pictureUrl = [NSString stringWithFormat:@"http://graph.facebook.com/%@/picture?type=normal", c.fbId];
    //c.linkedInUrl = user[kContactLinkedInGetUrl][kContactLinkedInUrl];

    // This is where they will appear in the grouping.
    if (c.last_name && c.last_name.length > 0) {
        c.groupByLastName = [[c.last_name substringToIndex:1] uppercaseString];
    } else if (c.first_name && c.first_name.length > 0) {
        c.groupByLastName = [[c.first_name substringToIndex:1] uppercaseString];
    } else {
        c.groupByLastName = @"Z";
    }
    
    [c addToCache];
    return c;
}

+ (void)reformatHometown:(NSMutableDictionary*)c {
    if (c[kContactHometown]) {
        NSLog(@"reformat home");
        NSString *s = c[kContactHometown][kContactName];
        [c removeObjectForKey:kContactHometown];
        [c setObject:s forKey:kContactHometown];
    }
}

- (void)reformatWorkFor:(NSMutableDictionary*)c {
    NSMutableArray *workArr = [[NSMutableArray alloc] init];
    NSLog(@"work");
    for (NSDictionary *workDict in c[kContactWork]) {
        NSMutableDictionary *d = [[NSMutableDictionary alloc] init];
        if (workDict[kContactEmployer]) {
            d[kContactEmployer] = workDict[kContactEmployer][kContactName];
        }
        if (workDict[kContactPosition]) {
            d[kContactPosition] = workDict[kContactPosition][kContactName];
        }
        
        [workArr addObject:d];
    }
    [c removeObjectForKey:kContactWork];
    c[kContactWork] = workArr;
    
}

- (void)reformatEducation:(NSMutableDictionary*)c {
    NSMutableArray *eduArr = [[NSMutableArray alloc] init];
    NSLog(@"education");
    for (NSDictionary *eduDict in c[kContactEducation]) {
        NSMutableDictionary *d = [[NSMutableDictionary alloc] init];
        if (eduDict[kContactSchool]) {
            d[kContactSchool] = eduDict[kContactSchool][kContactName];
        }
        if (eduDict[@"year"]) {
            d[@"year"] = eduDict[@"year"][kContactName];
        }
        
        if (eduDict[kContactType]) {
            d[kContactType] = eduDict[kContactType];
        }
        
        [eduArr addObject:d];
    }
    [c removeObjectForKey:kContactEducation];
    c[kContactEducation] = eduArr;
}


+ (Contact*)contactFromUserModel:(PFObject *)user {
    FBManager *li = [FBManager singleton];
    Contact *c = [NSEntityDescription insertNewObjectForEntityForName:@"Contact" inManagedObjectContext:li.managedObjectContext];
    c.fbId = [user objectForKey:@"fbId"];
    c.first_name = user[kContactFirstName];
    c.last_name = user[kContactLastName];
    c.name = [NSString stringWithFormat:@"%@ %@", c.first_name, c.last_name];
    c.parseId = user.objectId;
    c.bio = user[kContactBio];
    NSLog(@"homeotwn %@",[user[kContactHometown] class]);
    if ([user[kContactHometown] isKindOfClass:[NSDictionary class]]) {
        NSLog(@"reformat home");
        NSString *s = user[kContactHometown][kContactName];
        c.hometown = s;
    } else {
        NSLog(@"string hometown %@", user[kContactHometown]);
        c.hometown = user[kContactHometown];
    }
    
    NSLog(@"c.hometown %@ %@", c.hometown, [user[kContactHometown] class]);
    c.work = user[kContactWork];
    c.education = user[kContactEducation];
    c.gender = user[kContactGender];
    c.relationshipStatus = user[@"relationship_status"];
    
    c.pictureUrl = [NSString stringWithFormat:@"http://graph.facebook.com/%@/picture?type=normal", c.fbId];
    //c.linkedInUrl = user[kContactLinkedInGetUrl][kContactLinkedInUrl];
    
    // This is where they will appear in the grouping.
    if (c.last_name && c.last_name.length > 0) {
        c.groupByLastName = [[c.last_name substringToIndex:1] uppercaseString];
    } else if (c.first_name && c.first_name.length > 0) {
        c.groupByLastName = [[c.first_name substringToIndex:1] uppercaseString];
    } else {
        c.groupByLastName = @"Z";
    }
    
    [c addToCache];
    return c;
}

-(NSArray *)getValidStrings {
    NSMutableArray *v = [@[] mutableCopy];
    
    if (self.headline && self.headline.length > 0) {
        [v addObject:self.headline];
    }
    
    if (self.positionIndustry && self.positionIndustry.length > 0) {
        [v addObject:self.positionIndustry];
    }
    
    if (self.positionSummary && self.positionSummary.length > 0) {
        [v addObject:self.positionSummary];
    }
    
    if (self.positionTitle && self.positionTitle.length > 0) {
        [v addObject:self.positionTitle];
    }
    
    if (self.industry && self.industry.length > 0) {
        [v addObject:self.industry];
    }
    return v;
}

// adds the location json to the model file.
-(void)getLocationFromJSON:(NSDictionary *)json {
//    NSString *location = @"";
//    NSDictionary * locationJSON = json[kContactLocation];
//    if (locationJSON) {
//        NSString *temp = locationJSON[kContactLocationName];
//        if (temp) {
//            location = temp;
//        }
//    }
//    self.locationName = location;
}

// adds the positions JSON to model.
-(void)getPositionFromJSON:(NSDictionary *)json {
    
    if (json[kContactPosition] && json[kContactPosition][kContactPositionValues] && json[kContactPosition][kContactPositionValues][0]) {
        NSDictionary *position = json[kContactPosition][kContactPositionValues][0];
        
        self.positionIsCurrent = [position[kContactPositionIsCurrent] boolValue];
        self.positionSummary = position[kContactPositionSummary];
        self.positionTitle = position[kContactPositionTitle];
        
        NSDictionary *company = position[kContactPositionCompany];
        if (company) {
            self.positionIndustry = company[kContactPositionIndustry];
            self.positionName = company[kContactPositionName];
            self.positionSize = company[kContactPositionSize];
        } else {
            self.positionIndustry = @"";
            self.positionName = @"";
            self.positionSize = @"";
        }
    }
}

#pragma mark Image Cache
// add the picture to the image cache asynchronously
- (void)addToCache {
    SDWebImageDownloader *downloader = [SDWebImageDownloader sharedDownloader];
    NSURL *url = [NSURL URLWithString:self.pictureUrl];
    __weak NSURL *weakUrl = url;
    [downloader downloadImageWithURL:url options:SDWebImageDownloaderContinueInBackground progress:nil completed:^(UIImage *image, NSData *data, NSError *error, BOOL finished) {
        NSString *key = [self cacheKeyForURL:weakUrl];
        SDImageCache *imageCache = [SDImageCache sharedImageCache];
        [imageCache storeImage:image forKey:key toDisk:YES];
    }];
}

- (NSString *)cacheKeyForURL:(NSURL *)url {
    return [url absoluteString];
}

#pragma mark Parse
// This function sets the parse user when signed up.  Make sure to set the parse
// user differently if you are logging in rather than signing up for the first
// time.
+ (void)setParseUser:(NSDictionary *)json andSave:(BOOL)save {
    PFUser *user = [PFUser user];
    [user setObject:json[kContactFBId] forKey:kUserLinkedInId];
    [user setObject:@NO forKey:kUserImportedAllContacts];
    [user setObject:@[] forKey:kUserConnections];
    if (save) {
        [user saveInBackground];
    }
}


// generates tags based on Tag Options that are retrieved from Parse upon launch
// and

// Deprecated because of change to FB
- (void)generateTags:(BOOL)pushToParse {
    FBManager *lim = [FBManager singleton];
    NSMutableArray *generated = [[NSMutableArray alloc] init];
    NSMutableDictionary *addedTags = [[NSMutableDictionary alloc] init];
    NSCharacterSet *badCharSet = [[NSCharacterSet characterSetWithCharactersInString:@"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"] invertedSet];
    
    // go through all attributes and look for TagOptions
    // if there is a tag option, add it to the tags array for return.
    // before we return the array, send all of the attributes to parses
    NSArray *strings = [self getValidStrings];
    for (NSString *string in strings) {
        // make sure we don't deal with anything null or blank
        if (!string || string.length < 1) {
            continue;
        }
        
        for (NSString *word in [self cleanseString:string dirtySet:badCharSet]) {
            if (!word || word.length < 1 || addedTags[word] != nil) {
                continue;
            }
            addedTags[word] = @(0); // don't add tags twice
            TagOption *option = [lim.tagOptions objectForKey:word];
            if (option) {
                Tag *newTag = [Tag tagFromTagOption:option taggedUser:self.fbId byUser:[[lim currentParseUser] fbId]];
                //[generated addObject:@{kTagName: newTag, kTagVal : @(0)}];
            }
        }
    }
    
    if (pushToParse) {
        NSMutableArray *parseGenerated = [NSMutableArray arrayWithCapacity:generated.count];
        for (Tag *t in generated) {
            [parseGenerated addObject:[t pfObject]];
        }
        [PFObject saveAllInBackground:parseGenerated];
    }
    self.hasGeneratedTags = YES;
    self.tagData = [NSKeyedArchiver archivedDataWithRootObject:addedTags];
}


- (void)addTag:(NSString*)tag {
    self.tags_[tag] = [Tag tagFromTagName:tag taggedUser:self.parseId byUser:[[PFUser currentUser] objectForKey:@"fbId"] withRank:0];
    PFObject *t = [(Tag*)self.tags_[tag] pfObject];
    [t saveInBackgroundWithBlock:^(BOOL succeeded, NSError *error) {
        if (succeeded) [(Tag*)self.tags_[tag]  setObjectId:[t objectId]];
    }];
}

#pragma mark Tags Override setter
- (NSMutableDictionary*)tags_ {
    if (!tags_ && self.tagData) {
        tags_ = (NSMutableDictionary*)[NSKeyedUnarchiver unarchiveObjectWithData:self.tagData];
    }
    return tags_;
}

//- (void)setTags_:(NSMutableDictionary *)newTags {
//    self.tagData = [NSKeyedArchiver archivedDataWithRootObject:newTags];
//}

- (NSMutableArray*)work {
    if (!work && self.workData) {
        work = (NSMutableArray *)[NSKeyedUnarchiver unarchiveObjectWithData:self.workData];
    }
    return work;
}

- (NSMutableArray*)education {
    if (!education && self.educationData) {
        education = (NSMutableArray *)[NSKeyedUnarchiver unarchiveObjectWithData:self.educationData];
    } 
    return education;
}

// Makes sure that there are no special characters include when we are looking
// to guess tags.
-(NSArray *)cleanseString:(NSString *)dirtyString dirtySet:(NSCharacterSet *)dirtySet {
    return [dirtyString componentsSeparatedByCharactersInSet:dirtySet];
}
// returns the amount of profile options the user has
- (NSMutableArray*)profileAttributeKeys {
    NSMutableArray *n = [[NSMutableArray alloc] init];
    if (self.work.count > 0) {
        [n addObject:kContactWork];
    }
    if (self.education.count > 0) {
        [n addObject:kContactEducation];
    }
    return n;
}

// if the object is nil or [NSNull null], return @""
- (id)noNil:(id)s {
    if (!s) {
        return @"";
    } else if (s == [NSNull null]) {
        return @"";
    }
    return s;
}

//grabs contact details
- (NSMutableArray*)detailAttributesFor:(NSString *)key {
    NSMutableArray *n = [[NSMutableArray alloc] init];
    if ([key isEqualToString:kContactWork]) {
        
        [n addObject:kContactWork];
        for (NSMutableDictionary *d in self.work) {
            [n addObject:@{ @"header" : [self noNil:d[kContactEmployer]], @"value" : [self noNil:d[kContactPosition]] }];
        }
    }
    
    if ([key isEqualToString:kContactEducation]) {
        [n addObject:kContactEducation];
        for (NSMutableDictionary *d in self.education) {
            [n addObject:@{ @"header" : [self noNil:d[kContactType]], @"value" : [self noNil:d[kContactSchool]] }];
        }
    }
    return n;
}

- (void)updateEducationAtIndex:(NSInteger)index withHeader:(NSString *)header andValue:(NSString *)value {
    NSMutableDictionary *e = (NSMutableDictionary *)self.education[index];
    e[kContactType] = header;
    e[kContactSchool] = value;
}

- (void)updateWorkAtIndex:(NSInteger)index withHeader:(NSString *)header andValue:(NSString *)value {
    NSMutableDictionary *w = (NSMutableDictionary *)self.work[index];
    w[kContactEmployer] = header;
    w[kContactPosition] = value;
}

//saves contacts data to data before storing in core data
- (void)save {
    self.tagData = [NSKeyedArchiver archivedDataWithRootObject:self.tags_];
    self.educationData = [NSKeyedArchiver archivedDataWithRootObject:self.education];
    self.workData = [NSKeyedArchiver archivedDataWithRootObject:self.work];
}


// reupdate users from parse data
- (void)updateWithCallback:(void(^)(void))callback {
    PFQuery *query = [PFQuery queryWithClassName:@"UserModel"];
    [query whereKey:@"fbId" equalTo:self.fbId];
    [query getFirstObjectInBackgroundWithBlock:^(PFObject *object, NSError *error) {
        if (!error) {
            
            self.userModel = object;
            self.first_name = self.userModel[kContactFirstName];
            self.last_name = self.userModel[kContactLastName];
            //self.pictureUrl = self.userModel[kContactPicUrl];
            self.work = self.userModel[kContactWork];
            self.hometown = self.userModel[kContactHometown];
            self.education = self.userModel[kContactEducation];
            self.relationshipStatus = self.userModel[kContactRelationship];
            self.gender = self.userModel[kContactGender];

        }
        callback();
    }];
}

// save contact to parse when updated
- (void)saveContactToParse {
    NSLog(@"here");
    if (!self.userModel) {
        NSLog(@"here again %@", self.fbId);
        PFQuery *query = [PFQuery queryWithClassName:@"UserModel"];
        [query whereKey:@"fbId" equalTo:self.fbId];
        [query getFirstObjectInBackgroundWithBlock:^(PFObject *object, NSError *error) {
            self.userModel = object;
            [self uploadUpdates];
        }];
    } else {
        [self uploadUpdates];
    }
}

- (void)uploadUpdates {
    if (self.work) {
        self.userModel[kContactWork] = self.work;
    }
    if (self.education) {
        self.userModel[kContactEducation] = self.education;
    }
    [self.userModel saveInBackground];
}

@end

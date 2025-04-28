//
//  FBManager.m
//  Bees Chest
//
//  Created by Billy Irwin on 12/29/13.
//  Copyright (c) 2013 Arbrr. All rights reserved.
//

#import "FBManager.h"

@interface FBManager()

@property (nonatomic, assign, readwrite) BOOL isSearching;
@property (nonatomic, assign, readwrite) BOOL hasContacts;
@property (strong, nonatomic, readwrite) NSFetchedResultsController *fetchedResultsController;

@end

@implementation FBManager
static FBManager *fb = nil;

+ (FBManager*)singleton {
    if (!fb) {
        fb = [[FBManager alloc] init];
    }
    return fb;
}


//grabs current user from core data where fbId == Parse.current_user.fbID
- (void)fetchCurUser {
    NSFetchRequest *req = [[NSFetchRequest alloc] init];
    NSEntityDescription *desc = [NSEntityDescription entityForName:@"Contact" inManagedObjectContext:self.managedObjectContext];
    NSLog(@"Looking for serverID: %@", [[PFUser currentUser] objectForKey:@"fbId"]);
    NSPredicate *predicate = [NSPredicate predicateWithFormat:@"fbId==%@", [[PFUser currentUser] objectForKey:@"fbId"]];
    [req setPredicate:predicate];
    [req setEntity:desc];
    NSError *error;
    NSArray *arr = [self.managedObjectContext executeFetchRequest:req error:&error];
    if ([arr count] > 0) {
        self.currentParseUser = arr[0];
    }
}

//save parse current user to core data
- (void)cacheParseUser:(PFUser*)user reformat:(BOOL)reformat {
    if (reformat) {
        [FBManager reformatEducation:user];
        [FBManager reformatWork:user];
        [FBManager reformatHometown:user];
    }
    
    PFQuery *query = [PFQuery queryWithClassName:@"UserModel"];
    [query whereKey:@"fbId" equalTo:[user objectForKey:@"fbId"]];
    [query getFirstObjectInBackgroundWithBlock:^(PFObject *object, NSError *error) {
        self.currentParseUser = [Contact contactFromUserModel:object];
        NSError *error2;
        [self.managedObjectContext save:&error2];
        if (error) {
            NSLog(@"couldn't cache user: %@", error2);
            [[PFUser currentUser] deleteInBackground];
        }
    }];
    
}


// save all the contacts to core data (use sparingly, can freeze ui temporarily)
- (void)saveContext {
    for (Contact *c in self.fetchedResultsController.fetchedObjects) {
        [c save];
    }
    [self.managedObjectContext save:nil];
}

- (NSURL *)applicationDocumentsDirectory {
    return [[[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask] lastObject];
}

- (void)refreshContacts {
    [self fetchContacts];
}

- (id)init {
    self = [super init];
    if (self) {
        self.tagIndex = [[TagIndex alloc] init];
        
        //initiate core data connections
        NSURL *modelURL = [[NSBundle mainBundle] URLForResource:@"BeesChestData" withExtension:@"momd"];
        self.managedObjectModel = [[NSManagedObjectModel alloc] initWithContentsOfURL:modelURL];
        NSURL *storeURL = [[self applicationDocumentsDirectory] URLByAppendingPathComponent:@"Tag.sqlite"];
        
        NSError *error = nil;
        self.persistentStoreCoordinator = [[NSPersistentStoreCoordinator alloc] initWithManagedObjectModel:self.managedObjectModel];
        if (![_persistentStoreCoordinator addPersistentStoreWithType:NSSQLiteStoreType configuration:nil URL:storeURL options:nil error:&error]) {
            NSLog(@"Unresolved error %@, %@", error, [error userInfo]);
            abort();
        }
        
        if (self.persistentStoreCoordinator != nil) {
            self.managedObjectContext = [[NSManagedObjectContext alloc] init];
            [self.managedObjectContext setPersistentStoreCoordinator:self.persistentStoreCoordinator];
        }
        self.isSearching = NO;
        self.searchArray = [[NSMutableArray alloc] init];
        self.hasContacts = NO;
        [self fetchTagOptions];
        self.tagFilter = NO;
        
        self.filterArray = [[NSMutableArray alloc] init];
    }
    return self;
}

// grab all of the contact options from the server
- (void)fetchTagOptions {
    PFQuery *query = [PFQuery queryWithClassName:kTagOptionClass];
    [query setLimit:1000];
    [query findObjectsInBackgroundWithBlock:^(NSArray *objects, NSError *error) {
        if (error) {
            NSLog(@"Error fetching TagOptions: %@", error);
            self.tagOptions = [@[] mutableCopy]; // set tag options to empty array
        } else {
            self.tagOptions = [NSMutableDictionary dictionaryWithCapacity:objects.count];
            NSLog(@"found %i tag options", objects.count);
            for (PFObject *object in objects) {
                TagOption *t = [TagOption tagOptionFromParse:object];
                [self.tagOptions setObject:t forKey:[t.attributeName lowercaseString]];
            }
            NSLog(@"Tag options %@", self.tagOptions);
        }
    }];
}

+ (void)reformatWork:(NSMutableDictionary*)c {
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

+ (void)reformatEducation:(NSMutableDictionary*)c {
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

+ (void)reformatHometown:(NSMutableDictionary*)c {
    if (c[kContactHometown]) {
        NSLog(@"reformat home");
        NSString *s = c[kContactHometown][kContactName];
        [c removeObjectForKey:kContactHometown];
        [c setObject:s forKey:kContactHometown];
    }
}


//take array of fb friends and reformats data for parse
- (void)importContacts:(NSArray*)contacts cb:(void(^)(void))callback {
    NSLog(@"importing %i contacts", contacts.count);
    NSMutableArray *pfUsers = [NSMutableArray arrayWithCapacity:[contacts count]];
    for (int i = 0; i < contacts.count; i++) {
        NSMutableDictionary *c = [[NSMutableDictionary alloc] initWithDictionary:contacts[i]];
        [FBManager reformatWork:c];
        [FBManager reformatEducation:c];
        [FBManager reformatHometown:c];
        [pfUsers addObject:c];
    }
    NSString *meId = [[PFUser currentUser] objectForKey:@"fbId"];
    
    NSLog(@"pfusers: %@", pfUsers);
    
    [self uploadContacts:pfUsers meId:meId from:0 to:100 cb:callback];
    
}


//uploads reformated fb friends to parse at x amount at a time (feel free to play around with the amount)
//I found 100 at a time worked best with parse
- (void)uploadContacts:(NSArray*)contacts meId:(NSString*)meId from:(int)from to:(int)to cb:(void(^)(void))cb {
    NSLog(@"%i %i", from, contacts.count);
    if (from >= contacts.count) {
        
        [self fetchContacts];
        
        //store all user id's so we have access to them on login
        NSMutableArray *userIds = [[NSMutableArray alloc] init];
        for (Contact *c in self.fetchedResultsController.fetchedObjects) {
            [userIds addObject:c.fbId];
        }
        NSLog(@"update pfuser %@", [[PFUser currentUser] objectForKey:@"first_name"]);
        
        [[PFUser currentUser] setObject:userIds forKey:@"connections"];
        [[PFUser currentUser] saveInBackgroundWithBlock:^(BOOL succeeded, NSError *error) {
            if (succeeded) {
                cb();
                return;
            } else {
                NSLog(@"%@", error);
                PFUser *c = [PFUser currentUser];
                [PFUser logOut];
                [c deleteInBackground];
                return;
            }
        }];
        return;
    }
    int end = to;
    if (end >= contacts.count) end = contacts.count;
    
    float val = (float)from / (float)contacts.count;
    [self.vc setProgress:val];
    
    NSLog(@"upload from %i to %i", from, end);
    NSRange range = NSMakeRange(from, end-from);
    NSIndexSet *set = [[NSIndexSet alloc] initWithIndexesInRange:range];
    NSArray *uploadUsers = [contacts objectsAtIndexes:set];

    [PFCloud callFunctionInBackground:@"batchUpload" withParameters:@{@"users" : uploadUsers, @"meId" : meId} block:^(id object, NSError *error) {
        for (PFObject *o in object) {
            Contact *c = [Contact contactFromUserModel:o];
        }
        [self.managedObjectContext save:nil];
        [self uploadContacts:contacts meId:meId from:to to:to+100 cb:cb];
    }];
}


// This function gives the sort descriptors that allow group the contacts by
// lastName and sort the contacts by lastName
- (NSArray *)getSortDescriptors {
    NSSortDescriptor *groupByLastName = [[NSSortDescriptor alloc] initWithKey:kContactGroupByLastName ascending:YES];
    NSSortDescriptor *sortByLastName = [[NSSortDescriptor alloc] initWithKey:kContactLastName ascending:YES];
    return @[groupByLastName, sortByLastName];
}

// This returns the predicate that doesn't get all of the private private
// users that linkedin doesn't allow you to grab.
- (NSPredicate *)getPredicate {
    NSPredicate *predicate = [NSPredicate predicateWithFormat:@"first_name != %@ AND last_name != %@", @"private", @"private"];
    return predicate;
}


//grab all contacts from core data and store in fetchedResultsController
// also creates tagIndex
- (void)fetchContacts {
    NSFetchRequest *req = [[NSFetchRequest alloc] init];
    NSEntityDescription *desc = [NSEntityDescription entityForName:@"Contact" inManagedObjectContext:self.managedObjectContext];
    [req setEntity:desc];
    [req setSortDescriptors:[self getSortDescriptors]];
    [req setPredicate:[self getPredicate]];
    NSError *error;
    
    self.fetchedResultsController = [[NSFetchedResultsController alloc]
                                     initWithFetchRequest:req
                                     managedObjectContext:self.managedObjectContext
                                     sectionNameKeyPath:kContactGroupByLastName
                                     cacheName:kCacheAllContacts];
    
    BOOL success = [self.fetchedResultsController performFetch:&error];
    if (success) {
        self.hasContacts = YES;
        [self.tagIndex createIndex:self.fetchedResultsController.fetchedObjects];
        [self.tagIndex printTagIndex];
        NSLog(@"The fetch from Core Data was succcessful");
    } else {
        NSLog(@"Error fetching contacts from Core Data: %@", [error localizedDescription]);
    }
}


- (NSArray *)tagOptionsArray {
    NSMutableArray *tagOptions = [[NSMutableArray alloc] initWithCapacity:self.tagOptions.count];
    NSArray *keys = [self.tagOptions allKeys];
    
    for (NSString *key in keys) {
        [tagOptions addObject:self.tagOptions[key]];
    }
    return tagOptions;
}

// takes in string from ContactsViewController and returns contacts with matching first and last names
- (void)search:(NSString *)query {
    if (query.length == 0) {
        self.search = false;
    } else {
        self.search = true;
        NSArray *words = [query componentsSeparatedByString:@" "];
        NSString *first, *second;
        NSPredicate *queryNames;
        first = words[0];
        if (words.count > 1) {
            second = words[1];
            queryNames = [NSPredicate predicateWithFormat:
                          @"(first_name BEGINSWITH[cd] %@ AND last_name BEGINSWITH[cd] %@) OR (first_name BEGINSWITH[cd] %@ AND last_name BEGINSWITH[cd] %@)", first, second, second, first];
        } else {
            queryNames = [NSPredicate predicateWithFormat:@"first_name BEGINSWITH[cd] %@ OR last_name BEGINSWITH[cd] %@", first, first];
        }
        NSArray *contacts = [self.fetchedResultsController fetchedObjects];
        self.searchArray = [contacts filteredArrayUsingPredicate:queryNames];
    }
}


//takes in tags and finds the intersection of contacts with all tags
- (void)filterForTags:(NSArray*)tags {
    if (tags.count == 0) {
        self.tagFilter = false;
        return;
    }
    
    NSArray *arr = [self.tagIndex contactsForTag:tags[0]];
    [self.filterArray removeAllObjects];
    for (int i = 0; i < arr.count; i++) {
        Contact *c = arr[i];
        NSMutableDictionary *d = [@{ @"contact" : c, @"rank" : [c.tags_[tags[0]] rank] } mutableCopy];
        [self.filterArray addObject:d];
        for (int j = 0; j < tags.count; j++) {
            NSString *t = tags[j];
            if (c.tags_[t] == nil) {
                [self.filterArray removeLastObject];
                break;
            } else {
                d[@"rank"] = @([d[@"rank"] integerValue] + 1);
            }
        }
    }
    
    [self.filterArray sortUsingComparator:^NSComparisonResult(id obj1, id obj2) {
        return [obj1[@"rank"] integerValue] < [obj2[@"rank"] integerValue];
    }];
    
    NSLog(@"filtered array %@", self.filterArray);
}

// grabs all tags from network of friends and orders by ranks
- (void)filterForTagsFromNetwork:(NSArray *)tags cb:(void(^)(void))callback {
    PFQuery *query = [PFQuery queryWithClassName:@"Tag"];
    [query whereKey:kTagAttributeName containedIn:tags];
    [query whereKey:kTagTaggedBy containedIn:[[PFUser currentUser] objectForKey:kUserConnections]];
    [query whereKey:kTagUserId containedIn:[[PFUser currentUser] objectForKey:kUserConnections]];
    
    [query findObjectsInBackgroundWithBlock:^(NSArray *objects, NSError *error) {
        if (error) {
            NSLog(@"error doing network query %@", error);
        } else {
            NSLog(@"objects = %@", objects);
            NSMutableDictionary *tallies = [NSMutableDictionary dictionary];
            
            // find total tally of rank count for each contact
            Tag *tag = nil;
            for (PFObject *t in objects) {
                tag = [Tag tagFromParse:t];
                if (!tallies[tag.tagUserId]) {
                    tallies[tag.tagUserId] = @(0);
                }
                tallies[tag.tagUserId] = @([tallies[tag.tagUserId] integerValue] + [tag.rank integerValue]);
            }
            
            [self.filterArray removeAllObjects];
            for (Contact *c in self.fetchedResultsController.fetchedObjects) {
                if (tallies[c.fbId]) {
                    [self.filterArray addObject:@{@"contact" : c, @"rank": tallies[c.fbId]}];
                }
            }
            //sort contacts by rank
            [self.filterArray sortUsingComparator:^NSComparisonResult(id obj1, id obj2) {
                return [obj1[@"rank"] integerValue] < [obj2[@"rank"] integerValue];
            }];
            
            callback();
            NSLog(@"filtered array %@", self.filterArray);
            
        }
    }];
}

//completely delete database (use on logout)
- (void)clearDB {
    for (Contact *c in self.fetchedResultsController.fetchedObjects) {
        [self.managedObjectContext deleteObject:c];
    }
    
    [NSFetchedResultsController deleteCacheWithName:kCacheAllContacts];
    self.fetchedResultsController = nil;
    NSError *error = nil;
    [self.managedObjectContext save:&error];
    if (!error) {
        NSLog(@"Successfully deleted all contacts from Core Data");
    } else {
        NSLog(@"Error: %@ when attempting to delete all contacts from Core Data", [error localizedDescription]);
    }

}



@end

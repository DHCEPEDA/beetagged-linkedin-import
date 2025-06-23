//
//  FBManager.h
//  Bees Chest
//
//  Created by Billy Irwin on 12/29/13.
//  Copyright (c) 2013 Arbrr. All rights reserved.
//


//FBManager handles all of the logic involved with contacts
//Handle pushing/receiving contacts from parse
//Sorting
//Maintains the tag index
//Caching/retreiving to/from Core Data

#import <Foundation/Foundation.h>
#import <Parse/Parse.h>
#import <CoreData/CoreData.h>
#import "Constants.h"
#import "Contact.h"
#import "TagOption.h"
#import "TagIndex.h"
#import "ViewController.h"

@interface FBManager : NSObject

//Core data essentials
@property (strong, nonatomic) NSManagedObjectContext *managedObjectContext;
@property (strong, nonatomic) NSManagedObjectModel *managedObjectModel;
@property (strong, nonatomic, readonly) NSFetchedResultsController *fetchedResultsController;
@property (strong, nonatomic) NSPersistentStoreCoordinator *persistentStoreCoordinator;

//Arrays needed to populate tableviews for sorting/filtering
@property (strong, nonatomic) NSMutableArray *searchArray;
@property (strong, nonatomic) NSMutableArray *filterArray;
@property (nonatomic) BOOL search;
@property (nonatomic) BOOL tagFilter;

@property (nonatomic, assign, readonly) BOOL hasContacts;
@property (nonatomic, strong) NSMutableDictionary *tagOptions;

@property (strong, nonatomic)  TagIndex *tagIndex;

//cache contact model for current user
@property (strong, nonatomic) Contact *currentParseUser;

@property (weak, nonatomic) ViewController *vc;

+ (FBManager*)singleton;

- (void)refreshContacts;

//- (void)setToken:(NSString*)token;
//- (NSString*)token;
//- (void)setCurrentUser:(NSDictionary*)user;
//- (NSString*)currentUser;
//- (NSString *)currenUserId;
//
//- (NSDictionary *)currentUserAsDictionary;
- (NSArray *)tagOptionsArray;

//logic function to import contacts from facebook and push to parse
- (void)importContacts:(NSArray*)contacts cb:(void(^)(void))callback;

//used to query contacts for name searches
- (void)search:(NSString *)query;

//saves everything to core data
- (void)saveContext;

//clears core data db
- (void)clearDB;

//fetches contacts from core data and stores them in memory
- (void)fetchContacts;

//access tag index for tag filtering
- (void)filterForTags:(NSArray*)tags;

//caches [PFUser currentUser] to Core Data
- (void)cacheParseUser:(PFUser*)user reformat:(BOOL)reformat;

//grabs current user from Core Data
- (void)fetchCurUser;

//Helper functions to reformat fb data
+ (void)reformatHometown:(NSMutableDictionary*)c;
+ (void)reformatWork:(NSMutableDictionary*)c;
+ (void)reformatEducation:(NSMutableDictionary*)c;

// function to filter contacts and rank by network search
- (void)filterForTagsFromNetwork:(NSArray *)tags cb:(void(^)(void))callback;



@end

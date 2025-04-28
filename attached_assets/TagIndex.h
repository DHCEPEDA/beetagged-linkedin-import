//
//  TagIndex.h
//  Bees Chest
//
//  Created by Billy Irwin on 1/20/14.
//  Copyright (c) 2014 Arbrr. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "Contact.h"
#import "Tag.h"

@interface TagIndex : NSObject


// hash with format { tag_name => [array of sorted contacts with tag] }
@property (strong, nonatomic) NSMutableDictionary *data;

//@property (strong, nonatomic) NSMutableDictionary *sameTags;

//create the tagindex on launch
- (void)createIndex:(NSArray*)contacts;
//helper function to debug
- (void)printTagIndex;

// adds a contact to the tag index and optionally re-sorts
- (void)add:(Contact*)contact forTag:(Tag*)tag andSort:(BOOL)sort;

// used to move contacts position in index during beeschest game
- (void)move:(Contact*)contact forTag:(Tag*)tag toIndex:(int)index;

// remove a tag from the tag index and re-sorts
- (void)remove:(Contact*)contact forTag:(Tag*)tag;

- (BOOL)hasSameForTag:(Tag*)tag;

// returns two random contacts adjacent in tag index for game
- (NSArray*)findTwoSameForTag:(NSString*)tag;
- (void)printRandomSame:(int)i;

// returns a random tag (# of people for tag must be >= 2)
- (NSString*)randomTag;

// sorts contacts for tag and reupdates the tags on parse
- (void)sortForTag:(Tag*)tag;
- (void)sortForTagName:(NSString*)tagName;


- (int)countForTag:(Tag*)tag;
- (void)printForTag:(Tag*)t;

// returns all contacts for a given tag
- (NSArray*)contactsForTag:(NSString*)tag;


@end

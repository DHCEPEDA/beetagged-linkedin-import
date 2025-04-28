//
//  TagIndex.m
//  Bees Chest
//
//  Created by Billy Irwin on 1/20/14.
//  Copyright (c) 2014 Arbrr. All rights reserved.
//

#import "TagIndex.h"

@implementation TagIndex

- (id)init
{
    self = [super init];
    if (self) {
        self.data = [[NSMutableDictionary alloc] init];
        //self.sameTags = [[NSMutableDictionary alloc] init];
    }
    return self;
}

- (NSArray*)contactsForTag:(NSString*)tag {
    return self.data[tag];
}

- (void)move:(Contact *)contact forTag:(Tag *)tag toIndex:(int)index {
    NSMutableArray *tagArr = self.data[tag.attributeName];
    [tagArr removeObject:contact];
    [tagArr insertObject:contact atIndex:index];
}

- (int)countForTag:(Tag *)tag {
    return [self.data[tag.attributeName] count];
}

- (void)createIndex:(NSArray *)contacts
{
    [self.data removeAllObjects];
    for (Contact *c in contacts) {
        NSArray *keys = c.tags_.allKeys;
        for (NSString *t in keys) {
            [self add:c forTag:c.tags_[t] andSort:NO];
        }
    }
    // logic used to make sure contacts are placed in correct order in each array
    for (NSString *t in self.data.allKeys) {
        NSMutableArray *arr = self.data[t];
        NSMutableArray *arr2 = [[NSMutableArray alloc] init];
        for (int j = 0; j < arr.count; j++) {
            [arr2 addObject:[NSNull null]];
        }
        for (int i = 0; i < arr.count; i++) {
            Contact *c = arr[i];
            NSLog(@"%i %i", arr.count, [[c.tags_[t] rank] integerValue]);
            [arr2 replaceObjectAtIndex:[[c.tags_[t] rank] integerValue] withObject:c];
        }
        
        [arr2 removeObject:[NSNull null]];
        
        self.data[t] = arr2;
    }
}

- (void)add:(Contact*)contact forTag:(Tag *)tag andSort:(BOOL)sort {
    if (self.data[tag.attributeName] == nil) {
        self.data[tag.attributeName] =  [[NSMutableArray alloc] init];
    }
    [self.data[tag.attributeName] insertObject:contact atIndex:0];
    if (sort) [self sortForTag:tag];
}

- (void)remove:(Contact*)contact forTag:(Tag *)tag {
    NSMutableArray *arr = self.data[tag.attributeName];
    [arr removeObject:contact];
    [self sortForTag:tag];
}

//- (BOOL)hasSameForTag:(Tag*)tag {
//    int tmp = -1;
//    for (Contact *c in self.data[tag.attributeName]) {
//        Tag *t = c.tags_[tag.attributeName];
//        if (tmp == [t.rank integerValue]) {
//            self.sameTags[t.attributeName] = t;
//            return true;
//        } else {
//            tmp = [t.rank integerValue];
//        }
//    }
//    if (self.sameTags[tag.attributeName] != nil) {
//        [self.sameTags removeObjectForKey:tag.attributeName];
//    }
//    return NO;
//}

- (NSArray*)findTwoSameForTag:(NSString*)tag {
    NSMutableArray *arr = self.data[tag];
    int idx = rand() % arr.count - 1;
    if (idx == -1) idx = 0;
    return @[arr[idx], arr[idx+1]];
}

- (void)printForTag:(Tag*)t {
    NSLog(@"printing order for tag %@", t.attributeName);
    NSMutableArray *arr = self.data[t.attributeName];
    for (int i = 0; i < arr.count; i++) {
        Contact *c = (Contact*)arr[i];
        NSLog(@"%@ %@ %i", c.first_name, c.last_name, [[c.tags_[t.attributeName] rank] integerValue]);
    }

}

- (void)sortForTag:(Tag*)tag {
    NSMutableArray *pushTags = [[NSMutableArray alloc] init];
    NSMutableArray *arr = self.data[tag.attributeName];
    NSLog(@"setting new vals for tag %@", tag.attributeName);
    
    //update each users tag rank to their position in the array
    for (int i = 0; i < arr.count; i++) {
        Contact *c = (Contact*)arr[i];
        Tag *t = [c.tags_ objectForKey:tag.attributeName];
        [t setRank:[NSNumber numberWithInt:i]];
        PFObject *pfTag = [t pfObject];
        [pushTags addObject:pfTag];
    }
    
    //push all to parse
    [PFObject saveAllInBackground:pushTags];
}

- (void)sortForTagName:(NSString*)tagName {
    NSMutableArray *pushTags = [[NSMutableArray alloc] init];
    NSMutableArray *arr = self.data[tagName];
    
    //update each users tag rank to their position in the array
    for (int i = 0; i < arr.count; i++) {
        Contact *c = (Contact*)arr[i];
        Tag *t = [c.tags_ objectForKey:tagName];
        [t setRank:[NSNumber numberWithInt:i]];
        PFObject *pfTag = [t pfObject];
        [pushTags addObject:pfTag];
    }
    
    //push all to parse
    [PFObject saveAllInBackground:pushTags];
}

- (void)printTagIndex {
    NSArray *keys = [self.data allKeys];
    for (NSString *k in keys) {
        NSMutableString *str = [[NSMutableString alloc] init];
        for (Contact *c in self.data[k]) {
            Tag *t = c.tags_[k];
            [str appendFormat:@"%@ %i, ", c.name, t.rank.integerValue];
        }
        
        NSLog(@"%@    %@", k, str);
    }
}

- (NSString*)randomTag {
    NSArray *allTags = self.data.allKeys;
    NSMutableArray *possibleOptions = [[NSMutableArray alloc] init];
    int i = 0;
    // only grab tags that have at least two associated contacts
    for (Tag *t in allTags) {
        if ([self.data[t] count] > 1) {
            [possibleOptions addObject:@(i)];
        }
        i++;
    }
    if (possibleOptions.count == 0) {
        return nil;
    }
    NSLog(@"possible options: %i", possibleOptions.count);
    int idx = [possibleOptions[rand() % possibleOptions.count] integerValue];
    return allTags[idx];
}

@end

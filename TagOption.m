//
//  TagOption.m
//  Bees Chest
//
//  Created by Chris O'Neil on 1/5/14.
//  Copyright (c) 2014 Arbrr. All rights reserved.
//

#import "TagOption.h"

@implementation TagOption

+ (TagOption *)tagOptionFromParse:(PFObject *)pfObject {
    TagOption *tagOption = [[TagOption alloc] init];
    tagOption.objectId = [pfObject objectId];
    tagOption.attributeName = [pfObject objectForKey:kTagOptionAttributeName];
    tagOption.updatedAt = [pfObject objectForKey:kTagOptionUpdatedAt];
    tagOption.createdAt = [pfObject objectForKey:kTagOptionCreatedAt];
    return tagOption;
}

@end

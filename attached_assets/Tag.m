//
//  Tag.m
//  
//
//  Created by Chris O'Neil on 1/5/14.
//
//

#import "Tag.h"

@implementation Tag

+ (Tag *)tagFromParse:(PFObject *)pfObject {
    Tag *tag = [[Tag alloc] init];
    tag.objectId = [pfObject objectId];
    tag.attributeName = [pfObject objectForKey:kTagAttributeName];
    tag.taggedBy = [pfObject objectForKey:kTagTaggedBy];
    tag.tagUserId = [pfObject objectForKey:kTagUserId];
    tag.tagOptionId = [pfObject objectForKey:kTagOptionId];
    tag.createdAt = [pfObject objectForKey:kTagCreatedAt];
    tag.updatedAt = [pfObject objectForKey:kTagUpdatedAt];
    tag.rank = [pfObject objectForKey:kTagRank];
    return tag;
}

+ (Tag *)tagFromTagOption:(TagOption *)tagOption taggedUser:(NSString *)taggedUser byUser:(NSString *)byUser {
    Tag *tag = [[Tag alloc] init];
    tag.objectId = nil;
    tag.attributeName = tagOption.attributeName;
    tag.tagOptionId = tagOption.objectId;
    tag.taggedBy = byUser;
    tag.tagUserId = taggedUser;
    tag.createdAt = nil;
    tag.updatedAt = nil;
    tag.rank = @(0);
    return tag;
}

+ (Tag *)tagFromTagName:(NSString *)name taggedUser:(NSString *)taggedUser byUser:(NSString *)byUser withRank:(int)rank {
    Tag *tag = [[Tag alloc] init];
    tag.objectId = nil;
    tag.attributeName = name;
    tag.taggedBy = byUser;
    tag.tagUserId = taggedUser;
    tag.rank = @(rank);
    tag.createdAt = nil;
    tag.updatedAt = nil;
    return tag;
}

-(PFObject *)pfObject {
    
    PFObject *pfObject = [PFObject objectWithClassName:kTagClass];
    if (self.objectId && self.objectId.length > 0) {
        [pfObject setObjectId:self.objectId];
    }
    
    [pfObject setObject:self.attributeName forKey:kTagAttributeName];
    [pfObject setObject:self.taggedBy forKey:kTagTaggedBy];
    [pfObject setObject:self.tagUserId forKey:kTagUserId];
    //[pfObject setObject:self.tagOptionId forKey:kTagOptionId];
    [pfObject setObject:self.rank forKey:kTagRank];
    
    if (self.createdAt) {
        [pfObject setObject:self.createdAt forKey:kTagCreatedAt];
    }
    
    if (self.updatedAt) {
        [pfObject setObject:self.updatedAt forKey:kTagUpdatedAt];
    }
    
    return pfObject;
}

#pragma mark NSCoding
- (id)initWithCoder:(NSCoder *)decoder {
    self = [super init];
    if (!self) {
        return nil;
    }
    self.objectId = [decoder decodeObjectForKey:kTagObjectId]; // optional
    self.attributeName = [decoder decodeObjectForKey:kTagAttributeName];
    self.taggedBy = [decoder decodeObjectForKey:kTagTaggedBy];
    self.tagUserId = [decoder decodeObjectForKey:kTagUserId];
    self.tagOptionId = [decoder decodeObjectForKey:kTagOptionId];
    self.createdAt = [decoder decodeObjectForKey:kTagCreatedAt]; // optional
    self.updatedAt = [decoder decodeObjectForKey:kTagUpdatedAt]; // optional
    self.rank = [decoder decodeObjectForKey:kTagRank];
    return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder {
    [encoder encodeObject:self.objectId forKey:kTagObjectId];
    [encoder encodeObject:self.attributeName forKey:kTagAttributeName];
    [encoder encodeObject:self.taggedBy forKey:kTagTaggedBy];
    [encoder encodeObject:self.tagUserId forKey:kTagUserId];
    [encoder encodeObject:self.tagOptionId forKey:kTagOptionId];
    [encoder encodeObject:self.createdAt forKey:kTagCreatedAt];
    [encoder encodeObject:self.updatedAt forKey:kTagUpdatedAt];
    [encoder encodeObject:self.rank forKey:kTagRank];
}

@end

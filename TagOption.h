//
//  TagOption.h
//  Bees Chest
//
//  Created by Chris O'Neil on 1/5/14.
//  Copyright (c) 2014 Arbrr. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <Parse/Parse.h>

@interface TagOption : NSObject

@property (nonatomic, strong) NSString *objectId;
@property (nonatomic, strong) NSString *attributeName;
@property (nonatomic, strong) NSDate *createdAt;
@property (nonatomic, strong) NSDate *updatedAt;

+ (TagOption *)tagOptionFromParse:(PFObject *)pfObject;

@end

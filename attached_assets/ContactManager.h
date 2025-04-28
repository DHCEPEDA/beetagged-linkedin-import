//
//  ContactManager.h
//  Bees Chest
//
//  Created by Billy Irwin on 1/17/14.
//  Copyright (c) 2014 Arbrr. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface ContactManager : NSObject

@property (strong, nonatomic) NSMutableArray *contacts;
@property (strong, nonatomic) NSMutableDictionary *tagIndex;

+ (ContactManager*)singleton;

@end
